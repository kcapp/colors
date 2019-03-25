var debug = require('debug')('kcapp-bot:main');
var sleep = require('sleep');

var bot = require('./bot')(3);
bot.new(bot.MEDIUM);

function isOdd(number) {
    return number % 2 === 1;
}

var kcapp = require('kcapp-sio-client/kcapp')("localhost", 3000);
kcapp.connect(() => {
    kcapp.on('new_match', (data) => {
        var match = data.match;
        var legId = match.current_leg_id;
        if (match.venue.id === kcapp.DART_REIDAR_VENUE_ID) {
            debug(`Connected to match ${match.id}`);
            // TODO add a generic "venue_configuration" to avoid hardcoding this here

            kcapp.connectLegNamespace(legId, (socket) => {
                socket.on('score_update', (data) => {
                    var leg = data.leg;
                    var players = data.players;

                    if (data.is_finished) {
                        debug("Leg is finished");
                        return;
                    }

                    if (leg.current_player_id === bot.id) {
                        var player;
                        for (var i = 0; i < players.length; i++) {
                            // TODO move this check into leg-handler?
                            var player = players[i];
                            if (player.player_id === botId) {
                                player = player;
                            }
                        }
                        if (player.current_score <= 100) {
                            var thrown = 0;
                            while (thrown < 3) {
                                if (isOdd(player.current_score)) {
                                    socket.emitThrow({ score: 19, multiplier: bot.getMultipler() }, false);
                                    player.current_score -= score * multiplier;
                                } else if (player.current_score <= 40) {
                                    debug("Trying to checkout...");
                                    socket.emitThrow(bot.attemptCheckout(player.current_score), false);
                                } else {
                                    socket.emitThrow(bot.getDart(), false);
                                }
                                sleep.msleep(200);
                                thrown++;
                            }
                            sleep.msleep(200);
                            socket.emitVisit();
                        }
                        else {
                            for (var i = 0; i < 3; i++) {
                                sleep.msleep(200);
                                socket.emitThrow(bot.getDart(), false);
                            }
                            sleep.msleep(500);
                            socket.emitVisit();
                        }
                    } else {
                        debug("Not my turn, waiting...");
                    }
                });
            });
        }
    });
});