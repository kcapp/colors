var debug = require('debug')('kcapp-bot:main');
var sleep = require('sleep');

var bot = require('./bot')(162);
bot.new(bot.EASY);

function isOdd(number) {
    return number % 2 === 1;
}

var player = { current_score: 8 };
function doThrows() {
    var thrown = 0;
    debug("Starting score " + player.current_score);
    while (thrown < 3) {
        if (player.current_score > 170 || [169, 168, 166, 165, 163, 162, 159].includes(player.current_score)) {
            var dart = bot.attemptThrow(20, 3);
            player.current_score -= dart.score * dart.multiplier;
            debug("Threw " + JSON.stringify(dart));
        } else {
            // We are in checkout range
            var darts = bot.attemptCheckout(player.current_score, thrown);
            for (var i = 0; i < darts.length; i++) {
                var dart = darts[i];
                player.current_score -= dart.score * dart.multiplier;
            }
            debug("Got " + JSON.stringify(darts));
            thrown += darts.length;
            if (player.current_score <= 1) {
                break;
            }
        }
        thrown++;
    }
    debug("Score remaining " + player.current_score);
}
doThrows();


var kcapp = require('kcapp-sio-client/kcapp')("localhost", 3000);
kcapp.connect(() => {
    kcapp.on('new_match', (data) => {
        var match = data.match;
        var legId = match.current_leg_id;
        debug(`Connected to match ${match.id}`);

        kcapp.connectLegNamespace(legId, (socket) => {
            socket.on('score_update', (data) => {
                var leg = data.leg;
                if (data.is_finished) {
                    debug("Leg is finished");
                    return;
                }

                if (leg.current_player_id === bot.id) {
                    var player = socket.currentPlayer;
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
            });
        });
    });
});