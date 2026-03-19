const debug = require('debug')('kcapp-colors:main');
const VENUE = process.env.VENUE;

const KCAPP_HOST = process.env.KCAPP_HOST || "localhost";
const KCAPP_PORT = process.env.KCAPP_PORT || 3000;
const KCAPP_PROTO = process.env.KCAPP_PROTO || "http";
const kcapp = require('kcapp-sio-client/kcapp')(KCAPP_HOST, KCAPP_PORT, "kcapp-colors", KCAPP_PROTO);

let lights = null;

function getLights(config) {
    if (lights) return lights;

    if (config.has_led_lights) {
        const RED = process.env.RED || 17;
        const GREEN = process.env.GREEN || 22;
        const BLUE = process.env.BLUE || 24;
        lights = require('./pwm-util')(RED, GREEN, BLUE);
        lights.turnOff();
    } else if (config.has_wled_lights) {
        if (config.wled_url) {
            lights = require('./wled-http')(config.wled_url);
        } else {
            const USB_PORT = process.env.SERIAL || "/dev/tty.usbserial-0200FE39";
            lights = require('./wled-serial')(USB_PORT);
        }
    }
    return lights;
}

function controlPWMLights(leg, lights) {
    const setLightsToCurrentPlayer = () => {
        const player = leg.currentPlayer.player;
        debug(`Setting color for ${player.name} = ${player.color}`);
        lights.setColor(player.color);
    }

    leg.on('score_update', (data) => {
        if (data.leg.is_finished) return;
        setLightsToCurrentPlayer();
    });

    leg.on('leg_finished', (data) => {
        const match = data.match;
        debug("Blinking lights for 4s");
        lights.blink('#00ff00', 4000, () => {
            if (!match.is_finished) setLightsToCurrentPlayer();
        });
        if (match.is_finished) {
            debug("Disabling lights in 6s");
            setTimeout(() => lights.turnOff(), 6000);
        }
    });

    leg.on('order_changed', () => setLightsToCurrentPlayer());

    leg.on('cancelled', () => {
        debug("Leg cancelled, disabling lights");
        lights.turnOff();
    });

    if (leg.leg && !leg.leg.is_finished) setLightsToCurrentPlayer();
}

function controlWLEDLights(leg, lights) {
    let throwTimeout = undefined;

    function clearThrowTimeout() {
        if (throwTimeout) {
            clearTimeout(throwTimeout);
            throwTimeout = undefined;
        }
    }

    const setLightsToCurrentPlayer = () => {
        const player = leg.currentPlayer.player;
        debug(`Setting color for ${player.name} = ${player.color}`);
        lights.setColor(player.color);
    }

    leg.on('score_update', (data) => {
        clearThrowTimeout();
        if (data.leg.is_finished) return;
        setLightsToCurrentPlayer();
    });

    leg.on('possible_throw', () => {
        clearThrowTimeout();
        lights.effect(lights.EFFECTS.SOLID);
        throwTimeout = setTimeout(() => {
            debug("No dart thrown for 30s");
            lights.effect(lights.EFFECTS.HEARTBEAT, null, null, 50, 50, null, null);
        }, 30000);
    });

    leg.on('leg_finished', (data) => {
        const match = data.match;
        clearThrowTimeout();
        debug("Blinking lights for 6s");
        lights.blink('#00ff00', 6000, () => {
            if (!match.is_finished) setLightsToCurrentPlayer();
        });
        if (match.is_finished) {
            debug("Disabling lights in 6s");
            setTimeout(() => lights.turnOff(), 6000);
        }
    });

    leg.on('order_changed', () => {
        clearThrowTimeout();
        setLightsToCurrentPlayer();
    });

    leg.on('cancelled', () => {
        clearThrowTimeout();
        debug("Leg cancelled, disabling lights");
        lights.turnOff();
    });

    if (leg.leg && !leg.leg.is_finished) {
        setLightsToCurrentPlayer();
    }
}

function connectToMatch(data) {
    const match = data.match;
    if (!(match.venue && match.venue.config && VENUE && VENUE == match.venue.id)) return;
    
    const config = match.venue.config;
    const lights = getLights(config);
    if (!lights) return;

    const legId = match.current_leg_id;

    if (config.has_led_lights) {
        debug(`Connected to match ${match.id} via PWM`);
        kcapp.connectLegNamespace(legId, (leg) => controlPWMLights(leg, lights));
    } else if (config.has_wled_lights) {
        const mode = config.wled_url ? 'http' : 'serial';
        debug(`Connected to match ${match.id} via WLED (${mode})`);
        kcapp.connectLegNamespace(legId, (leg) => controlWLEDLights(leg, lights));
    }
}

kcapp.connect(() => {
    kcapp.on('new_match', (data) => connectToMatch(data));
    kcapp.on('warmup_started', (data) => connectToMatch(data));
    kcapp.on('demo', (data) => {
        debug(`Enabling Demo Mode`);
        const venue = data.venue;
        if (!(VENUE && VENUE == venue.id && venue.config)) return;

        const config = venue.config;
        const lights = getLights(config);
        if (!lights || !config.has_wled_lights) return;

        let length = 0;
        data.audios.forEach(audio => length += audio.length ? audio.length : 0);
        lights.effect(lights.EFFECTS.BPM, null, lights.PALLETE.RAINBOW, 140, 240, length * 1000, null);
    });
});

debug("Waiting for events to change colors...");