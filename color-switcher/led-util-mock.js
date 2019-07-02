var debug = require('debug')('kcapp-color-switcher:led-mock');

function sleep(ms){
    return new Promise(resolve => { setTimeout(resolve, ms) });
}

/**
 * Write values for each pin to the given values
 * @param {object} rgb - Object containing r,g,b values to set
 */
function write(rgb) {
    if (rgb && rgb != null) {
        debug("Setting lights " + JSON.stringify(rgb));
        this.PINS.RED.pwmWrite(rgb.r);
        this.PINS.GREEN.pwmWrite(rgb.g);
        this.PINS.BLUE.pwmWrite(rgb.b);
    }
}

/**
 * Convert the given hex color to RGB
 * @param {string} hex - Hex to convert
 */
exports.hexToRGB = (hex) => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Set the LEDs to the given hex color
 * @param {string} color - Hex color to set
 */
exports.setColor = async (color) => {
    if (this.blinking) {
        debug("Waiting for blink to finish...");
        await sleep(3000);
    }
    rgb = this.hexToRGB(color);
    if (rgb === null) {
        debug("Unable to convert '" + color + "' to RGB");
        return;
    }
    write.bind(this)(rgb);
}

/**
 * Turn off the LEDs, by setting all pins to low
 */
exports.turnOff = () => {
    debug("Disabled lights");
    write.bind(this)({ r: 0, g: 0, b: 0 });
}

/**
 * Blink the LEDs in the given color
 * @param {string} color - Hex color to blink
 * @param {int} time - Time in ms to blink
 */
exports.blink = (color, time) => {
    rgb = this.hexToRGB(color);
    var enable = true;
    this.blinking = true;
    var blinker = setInterval(() => {
        debug("Blinking " + color + "!");
        if (enable) {
            write.bind(this)(rgb);
        } else {
            this.turnOff();
        }
        enable = !enable;
    }, 150);


    setTimeout(() => {
        clearInterval(blinker);
        debug("Stopped blinking...");
        this.blinking = false;
        this.turnOff();
    }, time);
}

/**
 * Setup the module with the given GPIO pins
 * @param {int} redGPIO - GPIO pin of the red LED
 * @param {int} greenGPIO - GPIO pin of the green LED
 * @param {int} blueGPIO - GPIO pin of the blue LED
 */
module.exports = (redGPIO, greenGPIO, blueGPIO) => {
    this.PINS = {
        RED: { pwmWrite: (color) => { /*debug(`Set RED color = ${color}`)*/}},
        GREEN: { pwmWrite: (color) => { /*debug(`Set GREEN color = ${color}`)*/}},
        BLUE: { pwmWrite: (color) => { /*debug(`Set BLUE color = ${color}`)*/}}
    }
    this.blinking = false;
    return this;
}
