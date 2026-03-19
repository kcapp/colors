![kcapp logo](https://raw.githubusercontent.com/wiki/kcapp/frontend/images/logo/kcapp_plus_led.png)
# colors
Simple `node` script which listens for certain events from `socket.io` and switches colors on a `PWM` or [WLED](https://kno.wled.ge) strip, matching each color configured for a player

## Install
1. Install all node dependencies `npm install`
2. Run with
```bash
VENUE=<id> npm start
# ... or for testing PWM
VENUE=<id> npm run mock
```

## Troubleshooting

### General
* Make sure `match` is started on a venue with `has_led_lights` (`PWM`) or `has_wled_lights` (`WLED`) enabled.

### PWM
If you are using a `PWM` strip, make sure to set correct `GPIO` pins for the `RGB` strip via environment variables `RED`, `GREEN` and `BLUE`.

### WLED
For `WLED` two different modes are supported, either direct serial (USB) mode, or via the HTTP API.
The easiest is using the `HTTP` API, by adding the IP address of your `WLED` instance under venue settings in kcapp

#### Serial
If only the `has_wled_lights` setting is enabled, it will attempt to connect via serial. To use this the correct serial port must be specified via the `SERIAL` environment variable on startup

