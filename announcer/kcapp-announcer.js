var axios = require('axios');
var io = require("socket.io-client");

var BASE_URL = "http://localhost";
var API_URL = BASE_URL + ":8001";

var SLACK_KEY = "<slack_key_goes_here>";
var DO_ANNOUNCE = false;

var socket = io(BASE_URL + ":3000/active");

function postToSlack(prefix, text) {
    var message = prefix + " " + text;
    console.log(message);
    if (DO_ANNOUNCE) {
        axios.post('https://hooks.slack.com/services/' + SLACK_KEY, '{"text":"' + message + '"}')
            .then(response => {
                console.log("Successfully announced to Slack!");
            }).catch(error => {
                console.log(error);
            });
    }
}

function getMatchStartText(match, players) {
    var playersText = "";
    for (var i = 0; i < players.length; i++) {
        playersText += players[i].player_name + " vs. ";
    }
    playersText = playersText.substring(0, playersText.length - 5);
    return BASE_URL + "/matches/" + match.id + "/spectate" +
        " - " + playersText + " (" +
        match.match_type.name + " - " + match.match_mode.short_name + ")" +
        (match.venue.name != null ? " @ " + match.venue.name : "");
}

socket.on('new_match', function(data){
    var match = data.match;
    axios.get(API_URL + "/leg/" + match.current_leg_id + "/players")
        .then(response => {
            var players = response.data;
            var text = getMatchStartText(match, players);
            postToSlack("New active match:", text);
        }).catch(error => {
            console.log(error);
        });
});

socket.on('first_throw', function(data){
    var leg = data.leg;
    var players = data.players;
    axios.get(API_URL + "/match/" + leg.match_id)
        .then(response => {
            var match = response.data;
            if (match.tournament_id !== null) {
                var text = getMatchStartText(match, players);
                //postToSlack("Official match started:", text);
            } else {
                console.log("Skipping announcement of unofficial match...");
            }
        }).catch(error => {
            console.log(error);
        });
});

socket.on('warmup_started', function(data){
    var legId = data.leg_id;
    var matchId = data.match_id;
    axios.all([
        axios.get(API_URL + "/leg/" + legId + "/players"),
        axios.get(API_URL + "/match/" + matchId)
    ]).then(axios.spread((playersResponse, matchResponse) => {
        var players = playersResponse.data;
        var match = matchResponse.data;
        if (match.tournament_id !== null) {
                var text = match.tournament.tournament_group_name + " > " +
                    players[0].player_name + " vs. " + players[1].player_name + ", players warming up! (" + BASE_URL + "/matches/" + match.id + "/spectate)";
            postToSlack("Official Match:", text);
        } else {
            console.log("Skipping announcement of unofficial match...");
        }
    })).catch(error => {
        console.log(error);
    });
});

socket.on('order_changed', function(data){
    var legId = data.leg_id;
    axios.get(API_URL + "/leg/" + legId)
        .then(response => {
            var leg = response.data;
            axios.get(API_URL + "/leg/" + legId + "/players")
                .then(response => {
                    var players = response.data;
                    axios.get(API_URL + "/match/" + leg.match_id)
                        .then(response => {
                            var match = response.data;
                            if (match.tournament_id !== null) {
                                var text = match.tournament.tournament_group_name + " between " +
                                    players[0].player_name + " and " + players[1].player_name + " is about to start... (" + BASE_URL + "/matches/" + match.id + "/spectate)";
                                postToSlack("Official Match:", text);
                            } else {
                                console.log("Skipping announcement of unofficial match...");
                            }
                        }).catch(error => {
                            console.log(error);
                        });
                }).catch(error => {
                    console.log(error);
                });
        }).catch(error => {
            console.log(error);
        });
});

socket.on('leg_finished', function(data){
    var match = data.match;
    var leg = data.leg;

    if (match.is_finished) {
        axios.get(API_URL + "/leg/" + match.current_leg_id + "/players")
            .then(response => {
                var players = response.data;
                var playersText = players[0].player_name + "  (" + (players[0].wins ? players[0].wins : 0) + ") - ";
                for (var i = 1; i < players.length; i++) {
                    playersText += "(" + (players[i].wins ? players[i].wins : 0) + ") " + players[i].player_name + " - ";
                }
                playersText = playersText.substring(0, playersText.length - 3);

                var text = BASE_URL + "/matches/" + match.id + "/spectate - " + playersText
                postToSlack("Match finished:", text);
            })
            .catch(error => {
                console.log(error);
            });
    }
});


console.log("Waiting for events to announce...")
