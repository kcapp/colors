![kcapp logo](https://raw.githubusercontent.com/wiki/kcapp/frontend/images/logo/kcapp_plus_led.png)
# colors
Simple `node` script which listens for certain events from `socket.io` and switches colors on a LED strip, matching each color configured for a player

## Install
1. Install all node dependencies `npm install`
2. Make sure to set correct `GPIO` pins for the `RGB` strip in `kcapp-colors.js`
```js
const led = require("./led-util")(R, G, B);
```
3. Run with
```bash
npm start
# ... or for testing (on a non-RPi)
npm run mock
```

## Troubleshooting
Make sure `match` is started in a venue with `has_led_lights` enabled.
