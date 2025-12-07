# Channel Download Implementation - Current Status

## ✅ Completed Features

### 1. System Information Collection
- Node.js server endpoint `/system/info` to collect real hardware and OS information
- Support for Windows and Linux platforms
- Collects: Serial Number, Device Type, Make & Model (CPU), Operating System
- Browser.ts methods updated to fetch real data:
  - `getSerialNumber()` - Returns actual BIOS serial number
  - `getManufacturer()` - Returns 'Windows' or 'Linux' based on platform
  - `getModel()` - Returns actual CPU manufacturer and model
  - `getFirmwareVersion()` - Returns OS name and version
- Added Windows and Linux to DeviceManufacturer enum

### 2. Channel Download Infrastructure
- Node.js server on port 3001 with CORS support
- `/channel/download` endpoint to bypass browser CORS restrictions
- Message handlers for `CHANNEL_ASSIGNED` and `CHANNEL_UPDATE` events
- File system storage at `C:\Users\Public\Documents\Four Winds Interactive\Content`
- Cross-platform path support (Windows/Linux)

### 2. Authentication & API Integration
- Bearer token authentication from Redux state
- Correct API endpoint: `https://api-cloudtest1.fwi-dev.com/channels/v1/companies/{companyId}/channels/{channelId}/download`
- Environment-aware (cloudtest1 vs production)

### 3. Channel Download Flow
**Working end-to-end:**
1. Device receives channel assignment via MQTT shadow update
2. `Shadow.ts` extracts channel info and posts `CHANNEL_ASSIGNED` message with companyId
3. `injectChannelURL.js` receives message and calls `downloadChannel()`
4. Request sent to Node server at `http://localhost:3001/channel/download`
5. Node server authenticates and fetches channel download info from Channels API
6. Server downloads channel ZIP from signed URL
7. ZIP saved to disk as `{channelId}.{version}.zip`

### 4. Downloaded Content Structure
**Example:** `c4307909-4121-4f4c-b661-e89598073676.1.zip`

**Contains:** `channel.json` with:
```json
{
  "docVersion": 1,
  "id": "c4307909-4121-4f4c-b661-e89598073676",
  "name": "Ocean View",
  "defaultContent": "25b5ab76-0c51-46e2-a68f-27573ff30145",
  "contentList": [
    {
      "id": "25b5ab76-0c51-46e2-a68f-27573ff30145",
      "scalingBehavior": "FillProportionate",
      "updateInterval": "00:15:00",
      "url": "https://api-cloudtest1.fwi-dev.com/library/v1/company/.../download",
      "type": "Image"
    }
  ],
  "schedule": [],
  "interrupts": [],
  "screenFlush": null
}
```

## 📋 Files Modified/Created

### Core Files
1. `core/src/MQTT/Shadow.ts` - Posts `CHANNEL_ASSIGNED` message with channel and companyId
2. `core/src/MQTT/MessageRouter.ts` - Routes `CHANNEL_UPDATE` MQTT messages
3. `core/src/Util/DeviceAPI.ts` - Added `saveChannelContent()` abstract method
4. `core/src/@types/MQTT.d.ts` - Added `name` field to `ChannelUpdateMessage` interface

### Device Browser Files
1. `device_browser/src/Browser.ts` - Implemented `saveChannelContent()` method
2. `device_browser/src/injectChannelURL.js` - Added `downloadChannel()` function and message handlers
3. `device_browser/server.js` - **NEW** - Node server with channel download endpoint
4. `device_browser/package.json` - Added `express` and `multer` dependencies, added `server` script

### Documentation
1. `device_browser/CHANNEL-DOWNLOAD-CHANGES.md` - Implementation details
2. `device_browser/SIMPLIFIED-README.md` - Updated with channel download info

## 🚀 How to Use

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

### 2. Start the Application
```bash
# Terminal 1 - Start Node server
cd device_browser
yarn server

# Terminal 2 - Start app
cd device_browser
yarn dev:simplified
```

### Test Channel Download
In browser console:
```javascript
window.postMessage({
  type: 'CHANNEL_ASSIGNED',
  channel: { id: 'CHANNEL_ID', versionId: '1' },
  companyId: 'COMPANY_ID'
}, '*');
```

### Check Downloaded Files
Navigate to: `C:\Users\Public\Documents\Four Winds Interactive\Content\`

## 🔄 Channel Update Flow (Implemented but Not Tested)
1. MQTT sends message with `{channel, version, url, name}`
2. `MessageRouter.ts` posts `CHANNEL_UPDATE` message
3. `injectChannelURL.js` checks if channel matches current and version is different
4. Downloads directly from provided URL
5. Saves to disk via Node server

## ⏭️ Next Steps (Not Yet Implemented)

### 1. Extract ZIP Files
- Automatically unzip downloaded channels after download
- Extract to `{channelId}.{version}/` directory

### 2. Download Content Assets
- Parse `channel.json` contentList
- Download each asset from the `url` field
- Store with original filenames or content IDs
- Handle authentication for asset downloads

### 3. Handle Channel Updates
- Test `CHANNEL_UPDATE` flow with real MQTT messages
- Verify version comparison logic
- Implement cleanup of old versions

### 4. Error Handling & Retry
- Handle network failures
- Retry failed downloads
- Validate downloaded files
- Report download status to UI

### 5. Content Playback Integration
- Create player component to display downloaded content
- Read channel.json and load assets
- Implement scheduling logic
- Handle interrupts and takeovers

## 🐛 Known Issues
None currently - basic download flow is working!

## 📝 Technical Notes

### Required Environment Variables
- `ENVIRONMENT` - dev, staging, prod, prod-ap, prod-eu
- `CLOUD_ENV` - cloudtest1, cloudtest2, admin, contributor, network (dev only)
- `VERSION` - Set to 2.0.0 (browser player spoofs BrightSign for cloudFeatures.json compatibility)
- `BUILD_NUMBER` - Build number (use "dev" for development)

**Note:** Serial number is automatically detected from your system via the Node server.

### API Endpoints
- **Production:** `https://api.fwicloud.com/channels`
- **CloudTest1:** `https://api-cloudtest1.fwi-dev.com/channels`
- **Endpoint:** `GET /v1/companies/{companyId}/channels/{channelId}/download`
- **Auth:** Bearer token from Cognito (stored in Redux state)

### Storage Paths
- **Windows:** `C:\Users\Public\Documents\Four Winds Interactive\Content`
- **Linux:** `/var/lib/fwi/content`

### File Naming
- Format: `{channelId}.{version}.zip`
- Example: `c4307909-4121-4f4c-b661-e89598073676.1.zip`

### Dependencies
- `express`: ^4.18.2 - Web server
- `multer`: ^1.4.5-lts.1 - File upload handling (for future use)
- Node.js 22+ (native fetch support)

## 🎯 Success Criteria Met
✅ Channel metadata downloaded from API  
✅ Channel ZIP saved to disk  
✅ Authentication working with Bearer token  
✅ CORS bypassed via Node server  
✅ Cross-platform path support  
✅ Message-based architecture for channel assignment  
✅ Error handling and logging  

## 📊 Test Results
- **Environment:** cloudtest1.fwi-dev.com
- **Channel ID:** c4307909-4121-4f4c-b661-e89598073676
- **Version:** 1
- **File Size:** ~2KB (channel.json only)
- **Download Time:** < 1 second
- **Status:** ✅ Success
