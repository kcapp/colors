const debug = require('debug')('kcapp-color-switcher:main');
const RED = process.env.RED || 17;
const GREEN = process.env.GREEN || 22;
const BLUE = process.env.BLUE || 24;
const led = require("./led-util")(RED, GREEN, BLUE);

const host = process.env.KCAPP_API || "localhost";
const port = process.env.PORT || 3000;
const kcapp = require('kcapp-sio-client/kcapp')(host, port, 'kcapp-colors', "http");

// Disable lights when we start
led.turnOff();

function controlLights(socket) {
    const setLightsToCurrentPlayer = () => {
        const player = socket.currentPlayer.player;
        debug(`Setting color for ${player.name} = ${player.color}`);
        led.setColor(player.color);
    }

    socket.on('score_update', (data) => {
        if (data.leg.is_finished) {
            return;
        }
        setLightsToCurrentPlayer();
    });

    socket.on('leg_finished', (data) => {
        const match = data.match;

        debug("Blinking lights for 4s");
        led.blink('#00ff00', 4000, () => {
            if (!match.is_finished) {
                setLightsToCurrentPlayer();
            }
        });

        if (match.is_finished) {
            debug("Disabling lights in 6s");
            setTimeout(() => {
                led.turnOff();
            }, 6000);
        }
    });

    socket.on('order_changed', (data) => {
        debug('Order changed');
        setLightsToCurrentPlayer();
    });

    socket.on('cancelled', (data) => {
        debug("Leg cancelled, disabling lights");
        led.turnOff();
    });

    if (socket.leg && !socket.leg.is_finished) {
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
            kcapp.connectLegNamespace(legId, (socket) => {
                controlLights(socket);
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
});
debug("Waiting for events to change colors...");
