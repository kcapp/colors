var Gpio = require('pigpio').Gpio;

var PINS = {};

function write(rgb) {
    if (rgb && rgb != null) {
        console.log("Writing lights " + JSON.stringify(rgb));
        PINS.RED.pwmWrite(rgb.r);
        PINS.GREEN.pwmWrite(rgb.g);
        PINS.BLUE.pwmWrite(rgb.b);
    }
}

exports.setup = function (redGPIO, greenGPIO, blueGPIO) {
    this.PINS = {
        RED: new Gpio(redGPIO, { mode: Gpio.OUTPUT }),
        GREEN: new Gpio(greenGPIO, { mode: Gpio.OUTPUT }),
        BLUE: new Gpio(blueGPIO, { mode: Gpio.OUTPUT })
    }
}

exports.hexToRGB = function (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

exports.setColor = function (color) {
    rgb = this.hexToRGB(color);
    if (rgb === null) {
        console.log("Unable to convert '" + color + "' ro RGB");
        return;
    }
    write(rgb);
}

exports.turnOff = function () {
    console.log("Disabled lights");
    write({ r: 0, g: 0, b: 0 });
}

exports.blink = function (color, time) {
    rgb = this.hexToRGB(color);
    var enable = true;
    var blinker = setInterval(() => {
        console.log("Blinking " + color + "!");
        if (enable) {
            write(rgb);
        } else {
            this.turnOff();
        }
        enable = !enable;
    }, 100);

    setTimeout(() => {
        clearInterval(blinker);
        console.log("Stopped blinking...");
        this.turnOff();
    }, time);
}