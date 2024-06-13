const debug = require('debug')('kcapp-color-switcher:wled');
const { SerialPort } = require('serialport')

exports.EFFECTS = {
    SOLID: 0,
    BLINK: 1,
    TWO_DOTS: 50,
    DANCING_SHADOW: 112,
    PRIDE2015: 63,
    LOADING: 47,
    HEARTBEAT: 100,
    BREATH: 2,
    BPM: 68,
    LIGHTHOUSE: 41,  // 240 effect, 220 fade
}

exports.PALLETE = {
    RAINBOW: 11
}

function write(message) {
    message = JSON.stringify(message);
    debug(`Message: ${message}`);
    this.port.write(message, (err) => {
        if (err) {
            debug('Error on write: ', err.message)
            return;
        }
    });
}

/**
 * Set the LEDs to the given hex color
 * @param {string} color - Hex color to set
 */
exports.setColor = async (color) => {
    debug(`Setting lights to ${color}`);

    const message = {
        on: true,
        transition: 0,
        seg: {
            fx: this.EFFECTS.SOLID,
            col: [ color.substring(1) ],
            bri: 255
        }
    }
    write.bind(this)(message);
}

/**
 * Turn off the LEDs
 */
exports.turnOff = () => {
    debug("Disabled lights");
    write.bind(this)({ on :false });
}

exports.blink = (color, time, callback) => {
    this.effect(this.EFFECTS.BLINK, color, null, 245, 75, time, callback);
}

exports.effect = (effect, color, pallete, sx = 100, ix = 100, time, callback) => {
    debug(`Setting effect ${effect}!`);

    const message = { on: true, seg: { sx: sx, ix: ix, fx: effect } };
    if (color) {
        message.seg.col = [ color.substring(1) ];
    }
    if (pallete) {
        message.seg.pal = pallete;
    }
    write.bind(this)(message);
    
    if (time) {
        setTimeout(() => {
            debug("Stopping effect...");
            write.bind(this)({ on: false, seg: { fx: this.EFFECTS.SOLID }});
            if (callback) {
                callback();
            }
        }, time);
    }
}


module.exports = (path) => {
    this.port = new SerialPort({ path: path, baudRate: 115200 });
    this.port.on('error', (err) => {
        debug('Error: ', err.message)
    });
    return this;
}