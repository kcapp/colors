# kcapp-color
Simple `node` script which listens for certain events from `socket.io` and switches colors on a LED strip, matching each color configured for a player

## Install
1. Clone repository `git clone https://github.com/kcapp/enhancements.git`
2. Install all node dependencies `npm install`
3. Make sure to set correct `GPIO` pins for the `RGB` strip in `kcapp-colors.js`
```js
const led = require("./led-util")(R, G, B);
```
4. Run with `npm start`
5. Test (on a non-RPi) with `npm run mock`

## Troubleshooting
Make sure `match` is started in a venue with `has_led_lights` enabled.
