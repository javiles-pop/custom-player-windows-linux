# Channel Download Implementation

## Overview
Added functionality to download and store channel content locally on disk when a channel is assigned or updated via MQTT.

## Files Modified

### 1. `device_browser/src/injectChannelURL.js`
**Changes:**
- Added `downloadChannel()` function to fetch channel content via the download API
- Added message handlers for `CHANNEL_ASSIGNED` and `CHANNEL_UPDATE` events
- Calls `window.DeviceAPI.saveChannelContent()` to save downloaded content to disk
- Tracks current channel ID and version for update comparison

**Key Functions:**
```javascript
async function downloadChannel(channelId, versionId, companyId)
// Step 1: GET /channels/v1/companies/{companyId}/channels/{channelId}/download
// Step 2: Download from returned channelUrl
// Step 3: Save to disk via DeviceAPI
```

### 2. `core/src/MQTT/Shadow.ts`
**Changes:**
- Added `window.postMessage()` call when channel is assigned in shadow delta
- Posts `CHANNEL_ASSIGNED` message with channel info and companyId
- Triggers the download flow when a channel is assigned to the device

**Location:** Inside the `if ('channel' in state)` block

### 3. `core/src/MQTT/MessageRouter.ts`
**Changes:**
- Added routing for channel update MQTT messages
- Detects messages with `channel`, `version`, and `url` fields
- Posts `CHANNEL_UPDATE` message to trigger update download

**Location:** In the main switch statement, before the generic channel case

### 4. `core/src/Util/DeviceAPI.ts`
**Changes:**
- Added abstract method `saveChannelContent(blob, channelId, version)`
- Default implementation logs warning for unsupported devices

### 5. `device_browser/src/Browser.ts`
**Changes:**
- Implemented `saveChannelContent()` method
- Sends channel ZIP to local node server at `http://localhost:3001/channel/save`
- Uses FormData to upload blob with channelId and version metadata

### 6. `device_browser/server.js` (NEW FILE)
**Purpose:** Node.js server to handle saving channel content to disk

**Features:**
- Express server on port 3001
- `/channel/save` endpoint accepts multipart form data
- Saves files as `{channelId}.{version}.zip`
- Platform-aware storage paths:
  - Windows: `C:\Users\Public\Documents\Four Winds Interactive\Content`
  - Linux: `/var/lib/fwi/content`
- Auto-creates directory if it doesn't exist

### 7. `device_browser/package.json`
**Changes:**
- Added dependencies: `express` and `multer`
- Added script: `"server": "node server.js"`

## Flow Diagrams

### Scenario 1: Channel Assignment
```
1. MQTT shadow update with channel object
2. Shadow.ts posts CHANNEL_ASSIGNED message
3. injectChannelURL.js receives message
4. downloadChannel() called
   a. GET /channels/v1/companies/{companyId}/channels/{channelId}/download
   b. GET {channelUrl} from response
   c. window.DeviceAPI.saveChannelContent(blob, channelId, version)
5. Browser.ts sends to http://localhost:3001/channel/save
6. server.js writes to disk
```

### Scenario 2: Channel Update
```
1. MQTT message with {channel, version, url, name}
2. MessageRouter.ts posts CHANNEL_UPDATE message
3. injectChannelURL.js receives message
4. Checks if channel matches current and version is different
5. Downloads from url directly
6. window.DeviceAPI.saveChannelContent(blob, channelId, version)
7. Browser.ts sends to http://localhost:3001/channel/save
8. server.js writes to disk
```

## Storage Location

### Windows
```
C:\Users\Public\Documents\Four Winds Interactive\Content\{channelId}.{version}.zip
```

### Linux
```
/var/lib/fwi/content/{channelId}.{version}.zip
```

## Running the Application

### Prerequisites
1. Run `yarn` from monorepo root to install dependencies

### 1. Set Environment Variables

**Windows (PowerShell):**
```powershell
$env:ENVIRONMENT="dev"
$env:CLOUD_ENV="cloudtest1"
$env:VERSION="2.0.0"
$env:BUILD_NUMBER="dev"
```

**Linux/Mac:**
```bash
export ENVIRONMENT=dev
export CLOUD_ENV=cloudtest1
export VERSION=2.0.0
export BUILD_NUMBER=dev
```

### 2. Start the Server
```bash
cd device_browser
yarn server
```

### 3. Start the App
```bash
cd device_browser
yarn dev:simplified
```

## Testing

1. Activate device and assign a channel via Harmony
2. Check console for "Download info:" and "Channel downloaded:" logs
3. Verify file exists at storage location
4. Update channel in Harmony and verify new version downloads

## Dependencies Added
- `express`: ^4.18.2 - Web server framework
- `multer`: ^1.4.5-lts.1 - Multipart form data handling

## Current Implementation Status

### ✅ Completed
- Node server with CORS support on port 3001
- `/channel/download` endpoint with proper API URL (api-cloudtest1.fwi-dev.com)
- Message handlers for CHANNEL_ASSIGNED and CHANNEL_UPDATE
- File system storage at `C:\Users\Public\Documents\Four Winds Interactive\Content`
- Authentication token retrieval from Redux state
- ZIP extraction and content asset downloading
- Automatic cleanup of old channel versions
- Error handling and logging
- Cross-platform support (Windows/Linux)

## Notes
- Server must be running before app starts
- Channel downloads happen automatically on assignment/update
- Files are extracted to: `{channelId}.{version}/` directory
- Content assets are downloaded and saved with proper file extensions
- Old versions are automatically cleaned up
- Node.js handles cross-platform path differences automatically
- CORS is configured to allow requests from localhost:2999
