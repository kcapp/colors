var axios = require('axios');
var io = require("socket.io-client");
var GPIO = require('pigpio').Gpio;

var BASE_URL = "http://localhost";
var API_URL = BASE_URL + ":8001";
var socket = io(BASE_URL + ":3000/active");

var PINS = {
    RED: new Gpio(27, { mode: Gpio.OUTPUT }),
    GREEN: new Gpio(17, { mode: Gpio.OUTPUT }),
    BLUE: new Gpio(22, { mode: Gpio.OUTPUT })
}

function hexToRGB(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function setColor(color) {
    rgb = hexToRGB(color);
    if (rgb === null) {
        console.log("Unable to convert '" + color + "' ro RGB");
        return;
    }
    console.log("Converted " + color + " to " + JSON.stringify(rgb));

    PINS.RED.pwmWrite(rgb.r);
    PINS.GREEN.pwmWrite(rgb.g);
    PINS.BLUE.pwmWrite(rgb.b);
}

function turnOff() {
    console.log("Disabled lights");
    PINS.RED.pwmWrite(0);
    PINS.GREEN.pwmWrite(0);
    PINS.BLUE.pwmWrite(0);
}

socket.on('new_match', (data) => {
    var match = data.match;
    var legId = match.current_leg_id;
    if (match.venue.id === 4) {
        // TODO add a generic "venue_configuration" to avoid hardcoding this here
        axios.get(API_URL + "/leg/" + legId + "/players")
            .then(response => {
                var players = response.data;
                setColor(players[0].player.color);
            }).catch(error => {
                console.log(error);
            });

        // Connect to leg namespace, so we can cycle lights between player throws
        var legSocket = io(BASE_URL + ":3000/legs/" + legId);
        legSocket.on('score_update', (data) => {
            var legId = data.leg_id;
            for (var i = 0; i < data.players.length; i++) {
                var player = data.players[i];
                if (player.is_current_player) {
                    console.log("Setting color for " + player.player.name);
                    setColor(player.player.color);
                }
            }
        });
    } else {
        console.log("Not setting color for match played at " + match.venue.name);
    }
});

socket.on('leg_finished', (data) => {
    var match = data.match;
    if (match.is_finished) {
        console.log("Disabling lights in 5s");
        setTimeout(() => turnOff(), 5000);
    }
});

console.log("Waiting for events to change colors...")

setColor("ptotato");