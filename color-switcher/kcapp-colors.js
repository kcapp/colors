var debug = require('debug')('kcapp-color-switcher:main');
var led = require("./led-util-mock")(17, 22, 24);

function connectToMatch(data) {
    var match = data.match;
    if (match.venue && match.venue.id === kcapp.DART_REIDAR_VENUE_ID) {
        var legId = match.current_leg_id;
        debug(`Connected to match ${match.id}`);

        kcapp.connectLegNamespace(legId, (socket) => {
            socket.on('score_update', (data) => {
                var player = socket.currentPlayer.player;
                debug("Setting color for " + player.name + " = " + player.color);
                led.setColor(player.color);
            });

            socket.on('leg_finished', (data) => {
                var match = data.match;

                debug("Blinking lights for 4s");
                led.blink('#00ff00', 4000);

                if (match.is_finished) {
                    debug("Disabling lights in 6s");
                    setTimeout(() => {
                        debug("Disabling lights");
                        led.turnOff();
                    }, 6000);
                }
            });

            var player = socket.currentPlayer.player;
            debug("Setting color for " + player.name + " = " + player.color);
            led.setColor(player.color);
        });
    }
}

var kcapp = require('kcapp-sio-client/kcapp')("localhost", 3000);
kcapp.connect(() => {
    kcapp.on('new_match', (data) => {
        connectToMatch(data);
    });
    kcapp.on('warmup_started', (data) => {
        connectToMatch(data);
    });
});
debug("Waiting for events to change colors...");