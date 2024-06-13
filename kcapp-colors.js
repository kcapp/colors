const debug = require('debug')('kcapp-color-switcher:main');
const VENUE = process.env.VENUE;

const RED = process.env.RED || 17;
const GREEN = process.env.GREEN || 22;
const BLUE = process.env.BLUE || 24;

const pwm = require("./pwm-util")(RED, GREEN, BLUE);

const USB_PORT = process.env.SERIAL || "/dev/tty.usbserial-0200FE39";
const wled = require("./wled-util")(USB_PORT);

const host = process.env.KCAPP_API || "localhost";
const port = process.env.PORT || 3000;
const kcapp = require('kcapp-sio-client/kcapp')(host, port, 'kcapp-colors', "http");

// Disable lights when we start
pwm.turnOff();

function controlPWMLights(leg) {
    const setLightsToCurrentPlayer = () => {
        const player = leg.currentPlayer.player;
        debug(`Setting color for ${player.name} = ${player.color}`);
        pwm.setColor(player.color);
    }

    leg.on('score_update', (data) => {
        if (data.leg.is_finished) {
            return;
        }
        setLightsToCurrentPlayer();
    });

    leg.on('leg_finished', (data) => {
        const match = data.match;

        debug("Blinking lights for 4s");
        pwm.blink('#00ff00', 4000, () => {
            if (!match.is_finished) {
                setLightsToCurrentPlayer();
            }
        });

        if (match.is_finished) {
            debug("Disabling lights in 6s");
            setTimeout(() => {
                pwm.turnOff();
            }, 6000);
        }
    });

    leg.on('order_changed', (data) => {
        setLightsToCurrentPlayer();
    });

    leg.on('cancelled', (data) => {
        debug("Leg cancelled, disabling lights");
        pwm.turnOff();
    });

    if (leg.leg && !leg.leg.is_finished) {
        setLightsToCurrentPlayer();
    }
}

function controlWLEDLights(leg) {
    let throwTimeout = undefined;

    function clearThrowTimeout() {
        if (throwTimeout) {
            clearTimeout(throwTimeout);
        }
    }

    const setLightsToCurrentPlayer = () => {
        const player = leg.currentPlayer.player;
        debug(`Setting color for ${player.name} = ${player.color}`);
        wled.setColor(player.color);
    }

    leg.on('score_update', (data) => {
        clearThrowTimeout();
        if (data.leg.is_finished) {
            return;
        }
        setLightsToCurrentPlayer();
    });

    leg.on('possible_throw', (data) => {
        clearThrowTimeout();
        wled.effect(wled.EFFECTS.SOLID);
        throwTimeout = setTimeout(() => {
            debug("No dart thrown for 10s");
            wled.effect(wled.EFFECTS.HEARTBEAT, null, null, 50, 240, 5000, null);
        }, 10000);
    });

    leg.on('leg_finished', (data) => {
        const match = data.match;
        clearThrowTimeout();

        debug("Blinking lights for 6s");
        wled.blink('#00ff00', 6000, () => {
            if (!match.is_finished) {
                setLightsToCurrentPlayer();
            }
        });

        if (match.is_finished) {
            debug("Disabling lights in 6s");
            setTimeout(() => {
                wled.turnOff();
            }, 6000);
        }
    });

    leg.on('order_changed', (data) => {
        clearThrowTimeout();
        setLightsToCurrentPlayer();
    });

    leg.on('cancelled', (data) => {
        clearThrowTimeout();
        debug("Leg cancelled, disabling lights");
        wled.turnOff();
    });

    if (leg.leg && !leg.leg.is_finished) {
        setLightsToCurrentPlayer();
    }
}

function connectToMatch(data) {
    const match = data.match;

    if (match.venue && match.venue.config) {
        const config = match.venue.config;
        if (config.has_led_lights) {
            const legId = match.current_leg_id;
            debug(`Connected to match ${match.id}`);
            kcapp.connectLegNamespace(legId, (leg) => {
                controlPWMLights(leg);
            });
        } else if (config.has_wled_lights) {
            const legId = match.current_leg_id;
            debug(`Connected to match ${match.id} via WLED`);
            kcapp.connectLegNamespace(legId, (leg) => {
                controlWLEDLights(leg);
            });
        }
    }
}

kcapp.connect(() => {
    kcapp.on('new_match', (data) => {
        connectToMatch(data);
    });
    kcapp.on('warmup_started', (data) => {
        connectToMatch(data);
    });
    kcapp.on('demo', (data) => {
        debug(`Enabling Demo Mode`);
        const venue = data.venue;
        if (VENUE && VENUE == venue.id) {
            if (venue && venue.config) {
                const config = venue.config;
                if (config.has_led_lights) {
                    // TODO
                } else if (config.has_wled_lights) {
                    let length = 0;
                    data.audios.forEach(audio => length += audio.length ? audio.length : 0);

                    wled.effect(wled.EFFECTS.BPM, null, wled.PALLETE.RAINBOW, 140, 240, length * 1000, null);
                }
            }

        }
        
    });
});
debug("Waiting for events to change colors...");
