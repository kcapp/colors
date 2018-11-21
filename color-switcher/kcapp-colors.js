var axios = require('axios');
var io = require("socket.io-client");

var led = require("./led_util");
led.setup(17, 22, 24);

var BASE_URL = "http://localhost";
var API_URL = BASE_URL + ":8001";
var socket = io(BASE_URL + ":3000/active");

function setupLegNamespace(legId) {
    // Connect to leg namespace, so we can cycle lights between player throws
    var legSocket = io(BASE_URL + ":3000/legs/" + legId);
    legSocket.on('score_update', scoreUpdate);
    legSocket.on('leg_finished', legFinished);
    legSocket.on('possible_throw', possibleThrow);
}

function scoreUpdate(data) {
    for (var i = 0; i < data.players.length; i++) {
        var player = data.players[i];
        if (player.is_current_player) {
            led.setColor(player.player.color);
        }
    }
}
function possibleThrow(data) {
    if (data.is_finished) {
        led.blink('#00ff00', 1000);
    }
}

function legFinished(data) {
    console.log("Leg finished, moving to next: " + data.new_leg_id);
    setupLegNamespace(data.new_leg_id);
}

socket.on('new_match', (data) => {
    var match = data.match;
    var legId = match.current_leg_id;
    if (match.venue.id === 4) {
        // TODO add a generic "venue_configuration" to avoid hardcoding this here
        axios.get(API_URL + "/leg/" + legId + "/players")
            .then(response => {
                var players = response.data;
                led.setColor(players[0].player.color);
            }).catch(error => {
                console.log(error);
            });
        setupLegNamespace(legId);
    } else {
        console.log("Not setting color for match played at " + match.venue.name);
    }
});

socket.on('leg_finished', (data) => {
    var match = data.match;
    if (match.is_finished) {
        console.log("Disabling lights in 5s");
        setTimeout(() => led.turnOff(), 5000);
    }
});

console.log("Waiting for events to change colors...")