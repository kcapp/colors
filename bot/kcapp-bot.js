var debug = require('debug')('kcapp-bot:main');
var sleep = require('sleep');

var bot = require('./bot')(163);
bot.new(bot.EASY);

function doScore(socket) {
    var player = socket.currentPlayer;
    if (player.player_id === bot.id) {
        sleep.msleep(500);

        var thrown = 0;
        while (thrown < 3) {
            if (player.current_score > 170 || [169, 168, 166, 165, 163, 162, 159].includes(player.current_score)) {
                var dart = bot.attemptThrow(20, 3);
                socket.emitThrow(dart, false);
            } else {
                // We are in checkout range
                var darts = bot.attemptCheckout(player.current_score, thrown);
                for (var i = 0; i < darts.length; i++) {
                    var dart = darts[i];
                    sleep.msleep(200);
                    socket.emitThrow(dart, false);
                }
                thrown += darts.length;
            }
            thrown++;
            sleep.msleep(500);
        }
        debug("Sending visit");
        sleep.msleep(1000);
        socket.emitVisit();
    } else {
        debug("Not my turn, waiting...");
    }
}

var kcapp = require('kcapp-sio-client/kcapp')("localhost", 3000);
kcapp.connect(() => {
    kcapp.on('new_match', (data) => {
        var match = data.match;
        var legId = match.current_leg_id;
        debug(`Connected to match ${match.id}`);

        kcapp.connectLegNamespace(legId, (socket) => {
            socket.on('score_update', (data) => {
                if (data.is_finished) {
                    debug("Leg is finished");
                    return;
                }
                doScore(socket);
            });
            doScore(socket);
        });
    });
});