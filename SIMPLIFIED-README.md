# Simplified Device Browser

This is a simplified version of the device_browser app that removes unnecessary features while keeping core functionality.

## What's Included

✅ **Activation Flow** - Device registration and provisioning
✅ **MQTT Communication** - Cloud connectivity via Harmony
✅ **Channel Download** - Automatic download and extraction of channel content
✅ **System Information** - Auto-detects hardware (CPU, OS, serial number)
✅ **Network Settings** - WiFi configuration (stub)
✅ **About Page** - Device information and serial number
❌ **Content Rendering** - NOT included (v6-wplt iframe disabled)

## What's Removed/Hidden

❌ Timers (On/Off scheduling) - Hidden via CSS
❌ Access Code protection - Hidden via CSS
❌ Firmware Updates - Hidden via CSS
❌ Display Orientation controls - Hidden via CSS
❌ Advanced settings - Hidden via CSS
❌ Logging configuration - Hidden via CSS
❌ Player iframe (v6-wplt) - Completely disabled (not rendered)
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

### Channel Download

**Download Handler (`src/injectChannelURL.js`):**
- Listens for MQTT shadow updates via `window.postMessage`
- Receives channel assignment from Shadow.ts when MQTT delta arrives
- Triggers channel download via Node server
- Downloads channel ZIP and extracts to disk
- Downloads all content assets referenced in channel.json
- Stores at `C:\Users\Public\Documents\Four Winds Interactive\Content\{channelId}.{version}/`

**Menu Display:**
- `ShimMenuHome.tsx` - Shows channel URL preview on main menu
- `SimplifiedShimMenuPageDeployment.tsx` - Shows full channel URL on deployment page
- Both components listen for shadow updates and display channel info

### Files Modified/Created

**Device Browser:**
- `webpack.config.simplified.js` - Uses regular index.tsx, adds CopyWebpackPlugin for injectChannelURL.js, injects simplified.css and script tag
- `src/simplified.css` - Hides unwanted UI elements (menu items)
- `src/injectChannelURL.js` - Handles channel download via Node server
- `src/SimplifiedShimMenuPageDeployment.tsx` - Read-only deployment page in menu
- `package.json` - Added simplified build scripts (start:simplified, dev:simplified, build:simplified)

**Core:**
- `core/src/MQTT/Shadow.ts` - Modified to send postMessage when CurrentURL or channel changes in shadow
- `core/src/GUI/components/ShimMenu/ShimMenuHome.tsx` - Updated to listen for shadow updates and display channel URL
- `core/src/GUI/components/ShimApp/ShimApp.tsx` - Disabled CPWebFrame iframe (v6-wplt not rendered)

## How It Works

1. **MQTT receives channel update** from cloud
2. **Shadow.ts processes the update** and extracts channel ID
3. **Shadow.ts posts message** with channel assignment
4. **injectChannelURL.js downloads channel** via Node server:
   - Downloads channel ZIP from API
   - Extracts channel.json
   - Downloads all content assets
   - Stores locally on disk
5. **Menu components display** channel info when opened
6. **Separate rendering service** reads downloaded files from disk

## Debugging

Debug logging has been removed for production. If you need to debug:
- Add `console.log` statements in Shadow.ts where postMessage is called
- Add `console.log` in injectChannelURL.js message listener
- Add `console.log` in menu components' message listeners
- Check browser console for errors from Logger.error calls

## Current Status

✅ **Complete** - Real-time updates when channel changes via MQTT
✅ **Complete** - Menu shows channel info (home and deployment pages)
✅ **Complete** - MQTT connection maintained
✅ **Complete** - Menu items hidden via CSS
✅ **Complete** - Activation flow functional
✅ **Complete** - Network and About pages accessible
✅ **Complete** - Channel download with ZIP extraction
✅ **Complete** - Content asset downloading
✅ **Complete** - Automatic cleanup of old versions
✅ **Complete** - System information collection (CPU, OS, serial number)
✅ **Complete** - Cross-platform support (Windows/Linux)
✅ **Complete** - v6-wplt iframe disabled (no content rendering)

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
