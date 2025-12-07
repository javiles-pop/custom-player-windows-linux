# Simplified Device Browser

This is a simplified version of the device_browser app that removes unnecessary features while keeping core functionality.

## What's Included

✅ **Activation Flow** - Device registration and provisioning
✅ **MQTT Communication** - Cloud connectivity via Harmony (iframe runs in background)
✅ **Channel URL Display** - Shows the current channel URL in large text on screen
✅ **Network Settings** - WiFi configuration
✅ **About Page** - Device information and serial number

## What's Removed/Hidden

❌ Timers (On/Off scheduling) - Hidden via CSS
❌ Access Code protection - Hidden via CSS
❌ Firmware Updates - Hidden via CSS
❌ Display Orientation controls - Hidden via CSS
❌ Advanced settings - Hidden via CSS
❌ Logging configuration - Hidden via CSS
❌ Player iframe visibility - Hidden via CSS (still loads for MQTT)
❌ Bundle Analyzer - Removed from webpack config

## Usage

### 1. Set Environment Variables

**Windows (PowerShell):**
```powershell
$env:ENVIRONMENT="dev"
$env:CLOUD_ENV="cloudtest1"
$env:VERSION="2.0.0"
$env:BUILD_NUMBER="dev"
```

**Windows (CMD):**
```cmd
set ENVIRONMENT=dev
set CLOUD_ENV=cloudtest1
set VERSION=2.0.0
set BUILD_NUMBER=dev
```

**Linux/Mac:**
```bash
export ENVIRONMENT=dev
export CLOUD_ENV=cloudtest1
export VERSION=2.0.0
export BUILD_NUMBER=dev
```

**Notes:**
- Serial number is automatically detected from your system. No need to set it manually.
- Version 2.0.0 with playerType "BrightSign" is used for cloudFeatures.json compatibility.

### 2. Start the Node Server
```bash
cd device_browser
yarn server
```

### 3. Start the App

**Development Mode (with live reload):**
```bash
cd device_browser
yarn dev:simplified
```

**Watch Mode (compile on save):**
```bash
cd device_browser
yarn start:simplified
```

**Production Build:**
```bash
cd device_browser
yarn build:simplified
```

## Implementation Details

### CSS-Based Hiding
Unwanted menu items are hidden via `src/simplified.css`:
- Timers menu item
- Access code menu item
- Updates menu item
- Logging menu item
- Display orientation menu item
- Advanced settings menu item
- Player iframe (hidden but still loads for MQTT connectivity)

### Channel URL Display

**Main Display (`src/injectChannelURL.js`):**
- Listens for MQTT shadow updates via `window.postMessage`
- Receives `CurrentURL` from Shadow.ts when MQTT delta arrives
- Extracts channel ID and displays as `https://cloudtest1.fwi-dev.com/channels/{channelId}`
- Shows large centered text on main screen
- Hides automatically when menu is open (uses MutationObserver)
- Responds to `REQUEST_CHANNEL_URL` messages from menu components
- **Does NOT use iframe - all updates come from shadow**

**Menu Display:**
- `ShimMenuHome.tsx` - Shows channel URL preview on main menu
- `SimplifiedShimMenuPageDeployment.tsx` - Shows full channel URL on deployment page
- Both components listen for shadow updates and request current value on mount
- All three displays (main + 2 menu) stay in sync via postMessage

### Files Modified/Created

**Device Browser:**
- `webpack.config.simplified.js` - Uses regular index.tsx, adds CopyWebpackPlugin for injectChannelURL.js, injects simplified.css and script tag
- `src/simplified.css` - Hides unwanted UI elements (#player-iframe, menu items)
- `src/injectChannelURL.js` - Main display script that shows channel URL and manages visibility
- `src/SimplifiedShimMenuPageDeployment.tsx` - Read-only deployment page in menu
- `package.json` - Added simplified build scripts (start:simplified, dev:simplified, build:simplified)

**Core:**
- `core/src/MQTT/Shadow.ts` - Modified to send postMessage when CurrentURL or channel changes in shadow
- `core/src/GUI/components/ShimMenu/ShimMenuHome.tsx` - Updated to listen for shadow updates and display channel URL

## How It Works

1. **MQTT receives channel update** from cloud
2. **Shadow.ts processes the update** and extracts channel ID
3. **Shadow.ts posts message** with `{type: 'SHADOW_UPDATE', CurrentURL: 'https://cloudtest1.fwi-dev.com/channels/{id}'}`
4. **All three displays listen** for the message and update simultaneously:
   - Main screen display (injectChannelURL.js)
   - Menu home preview (ShimMenuHome.tsx)
   - Menu deployment page (SimplifiedShimMenuPageDeployment.tsx)
5. **Menu components request current value** on mount using `REQUEST_CHANNEL_URL` message
6. **Main display responds** with current channel URL

## Debugging

Debug logging has been removed for production. If you need to debug:
- Add `console.log` statements in Shadow.ts where postMessage is called
- Add `console.log` in injectChannelURL.js message listener
- Add `console.log` in menu components' message listeners
- Check browser console for errors from Logger.error calls

## Current Status

✅ **Complete** - Channel URL displays on screen in large text
✅ **Complete** - Real-time updates when channel changes via MQTT
✅ **Complete** - Menu shows correct channel URL (home and deployment pages)
✅ **Complete** - Display hides when menu is open
✅ **Complete** - MQTT connection maintained (no iframe needed for display)
✅ **Complete** - Menu items hidden via CSS
✅ **Complete** - Activation flow functional
✅ **Complete** - Network and About pages accessible
✅ **Complete** - Debug logging removed
✅ **Complete** - Channel download infrastructure (server, API methods, message handlers)
⚠️ **BLOCKED** - Channel download endpoint authentication

## Blocking Issue

The channel download endpoint `GET /channels/v1/companies/{companyId}/channels/{channelId}/download` returns HTML instead of JSON even with valid Bearer token authentication. 

**Symptoms:**
- HTTP 200 response
- Returns HTML (Channels UI page) instead of JSON
- Token is valid (works for other endpoints)

**Possible causes:**
1. Endpoint doesn't exist or path is incorrect
2. Requires different authentication method
3. Requires additional headers or query parameters
4. Endpoint not implemented in cloudtest1 environment

**Next steps:**
1. Verify correct endpoint URL with backend team
2. Check if endpoint requires different auth (cookies, different header format)
3. Test if channel JSON is available at different endpoint
4. May need to use existing channel data from MQTT shadow instead of download endpoint

## Environment Options

**CLOUD_ENV options:**
- `cloudtest1` or `cloudtest2` - Dev environments
- `admin`, `contributor`, `network` - Other dev environments

**ENVIRONMENT options:**
- `dev` - Development
- `staging` - Staging
- `prod`, `prod-ap`, `prod-eu` - Production

**VERSION:**
- Set to `2.0.0` to match existing BrightSign entry in cloudFeatures.json
- Browser player spoofs BrightSign for feature compatibility

## Switching Back to Full Version

To use the full version, simply use the original scripts:
```bash
yarn dev        # Full version with all features
yarn build      # Full production build
```
