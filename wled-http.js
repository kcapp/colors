const debug = require('debug')('kcapp-colors:wled-http');
const { WLEDClient } = require('wled-client');

const SEGMENTS = [ 0 ];

const EFFECTS = {
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
};

const PALLETE = {
    RAINBOW: 11
};

function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [
        parseInt(h.substring(0, 2), 16),
        parseInt(h.substring(2, 4), 16),
        parseInt(h.substring(4, 6), 16)
    ];
}

module.exports = (wledUrl) => {
    const host = wledUrl.replace(/^https?:\/\//, '');
    debug(`Connecting to WLED at ${host}`);
    const client = new WLEDClient({ host, secure: false, websocket: false, immediate: false });

    let connected = false;
    let pendingFn = null;

    client.refreshContext().then(() => {
        connected = true;
        debug(`Connected to WLED at ${host}`);
        if (pendingFn) {
            debug("Flushing pending command");
            const fn = pendingFn;
            pendingFn = null;
            send(fn);
        }
    }).catch((err) => {
        debug(`Failed to connect to WLED at ${host}: ${err.message}`);
    });

    async function send(fn) {
        if (!connected) {
            debug("Not connected to WLED, queuing command");
            pendingFn = fn;
            return;
        }
        try {
            await fn();
        } catch (err) {
            debug(`Error communicating with WLED: ${err.message}`);
        }
    }

    return {
        EFFECTS,
        PALLETE,

        setColor: (color) => {
            debug(`Setting lights to ${color}`);
            const rgb = hexToRgb(color);
            return send(async () => {
                for (const id of SEGMENTS) {
                    await client.updateSegment(id, { on: true, effectId: EFFECTS.SOLID, colors: [rgb] });
                }
                await client.turnOn();
            });
        },

        turnOff: () => {
            debug("Disabled lights");
            return send(() => client.turnOff());
        },

        blink: function(color, time, callback) {
            this.effect(EFFECTS.BLINK, color, null, 225, 120, time, callback);
        },

        effect: function(effect, color, pallete, sx = 100, ix = 100, time, callback) {
            const effectName = Object.keys(EFFECTS).find(k => EFFECTS[k] === effect) || effect;
            debug(`Setting effect ${effectName}`);
            const rgb = color ? hexToRgb(color) : null;
            send(async () => {
                for (const id of SEGMENTS) {
                    const seg = { effectId: effect, effectSpeed: sx, effectIntensity: ix };
                    if (rgb) seg.colors = [rgb];
                    if (pallete) seg.paletteId = pallete;
                    await client.updateSegment(id, seg);
                }
                await client.turnOn();
            });

            if (time) {
                setTimeout(() => {
                    debug("Stopping effect...");
                    send(() => client.turnOff()).then(() => {
                        if (callback) callback();
                    });
                }, time);
            }
        }
    };
};