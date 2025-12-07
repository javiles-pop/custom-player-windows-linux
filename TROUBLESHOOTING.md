# Troubleshooting Guide

## Common Errors and Fixes

### 1. ERR_CONNECTION_REFUSED to localhost:3001

**Error:**
```
GET http://localhost:3001/system/info net::ERR_CONNECTION_REFUSED
GET http://localhost:3001/network/interfaces net::ERR_CONNECTION_REFUSED
```

**Cause:** Node server is not running.

**Fix:**
```bash
cd device_browser
yarn server
```

The Node server must be running in a separate terminal before starting the app.

---

### 2. MQTT Connection Dropping Every ~60 Seconds

**Error:**
```
ERROR | [MQTT] Connection to Harmony Error: Error: premature close
WARN | [MQTT] Connection to Harmony closed
WARN | [MQTT] Device is still online. Re-establishing Harmony connection.
```

**Cause:** AWS IoT subscription limit or policy issue. The device is subscribing to multiple topics:
- `$aws/things/{deviceID}/shadow/update/delta`
- `fwi/{companyId}/broadcast`
- `fwi/{companyId}/{deviceID}`
- `$aws/things/{deviceID}/shadow/get/#`
- `$aws/things/{deviceID}/shadow/rejected/#` (dev only)
- `$aws/things/{deviceID}/shadow/accepted/#` (dev only)

**Potential Fixes:**

1. **Check AWS IoT Policy** - Ensure the device policy allows all required subscriptions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["iot:Subscribe"],
         "Resource": [
           "arn:aws:iot:region:account:topicfilter/$aws/things/${iot:Connection.Thing.ThingName}/shadow/*",
           "arn:aws:iot:region:account:topicfilter/fwi/*"
         ]
       },
       {
         "Effect": "Allow",
         "Action": ["iot:Publish", "iot:Receive"],
         "Resource": [
           "arn:aws:iot:region:account:topic/$aws/things/${iot:Connection.Thing.ThingName}/shadow/*",
           "arn:aws:iot:region:account:topic/fwi/*"
         ]
       }
     ]
   }
   ```

2. **Increase keepalive** - Edit `core/src/MQTT/Activation.ts` line 253:
   ```typescript
   keepalive: 60,  // Changed from 15 to 60 seconds
   ```

3. **Check AWS IoT Limits** - Verify account limits:
   - Max subscriptions per connection: 50 (default)
   - Max message rate: 100 messages/sec (default)
   - Connection duration: Unlimited

4. **Monitor in AWS IoT Console:**
   - Go to AWS IoT Core → Test → MQTT test client
   - Subscribe to `$aws/events/#` to see connection events
   - Check for policy violations or throttling

---

### 3. Screenshot Command Failing

**Error:**
```
ERROR | [SCREENSHOT] Error undefined
```

**Cause:** Screenshot functionality not implemented for browser-based player.

**Fix:** This is expected. Browser players cannot take screenshots of the rendered content due to browser security restrictions. This feature only works on native players (BrightSign, Android, etc.).

**To suppress the error**, you can add a stub implementation in `device_browser/src/Browser.ts`:

```typescript
async takeScreenshot(): Promise<string> {
  Logger.warn('[SCREENSHOT] Not supported in browser player');
  return '';
}
```

---

### 4. Webpack Dev Server Disconnected

**Error:**
```
[WDS] Disconnected!
GET http://localhost:2999/sockjs-node/info?t=... net::ERR_CONNECTION_REFUSED
```

**Cause:** Webpack dev server hot reload connection lost (normal when dev server restarts).

**Fix:** This is not critical. Just refresh the browser page if you need to reconnect. Or restart the dev server:
```bash
cd device_browser
yarn dev:simplified
```

---

### 5. Segment Analytics Blocked

**Error:**
```
GET https://cdn.segment.com/analytics.js/... net::ERR_BLOCKED_BY_CLIENT
```

**Cause:** Ad blocker or privacy extension blocking analytics.

**Fix:** This is not critical for development. The channel content loads analytics from Segment. You can:
- Disable ad blocker for localhost
- Ignore the error (doesn't affect functionality)

---

## Startup Checklist

Before running the player, ensure:

1. ✅ Environment variables are set:
   ```powershell
   $env:ENVIRONMENT="dev"
   $env:CLOUD_ENV="cloudtest1"
   $env:VERSION="2.0.0"
   $env:BUILD_NUMBER="dev"
   ```

2. ✅ Node server is running:
   ```bash
   cd device_browser
   yarn server
   ```

3. ✅ App is running:
   ```bash
   cd device_browser
   yarn dev:simplified
   ```

4. ✅ Device is activated in CloudTest1 company

5. ✅ Channel is assigned to device

---

## Debug Mode

To enable more verbose logging, set log level to DEBUG in the menu:
1. Open menu (click hamburger icon)
2. Go to About
3. Change log level to DEBUG
4. Check browser console for detailed logs

---

## Clean Slate

If things are completely broken, reset everything:

```bash
# Stop all processes
# Ctrl+C in both terminals

# Clear browser storage
# Open browser console and run:
localStorage.clear()
sessionStorage.clear()

# Restart
cd device_browser
yarn server  # Terminal 1
yarn dev:simplified  # Terminal 2
```

Then re-activate the device with invite code or serial number.
