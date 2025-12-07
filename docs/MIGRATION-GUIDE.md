# Migration Guide: BrightSign/Samsung/LG → Windows/Linux Browser Player

Guide for developers familiar with the original shim-master (BrightSign, Samsung SSP, LG webOS) transitioning to the Windows/Linux browser player.

## Key Differences

### 1. No Content Rendering

**Old Shim:**
- Rendered content via iframe (v6-wplt)
- Full playback engine
- Video/image display

**New Browser Player:**
- **NO content rendering**
- Downloads content to disk only
- Separate rendering service reads files
- CPWebFrame iframe disabled

### 2. Platform Changes

**Old Shim:**
- BrightSign hardware
- Samsung Tizen (SSP)
- LG webOS

**New Browser Player:**
- Windows 10/11
- Linux
- Runs in browser (Chrome/Edge)
- Node.js backend for file operations

### 3. Network Configuration

**Old Shim:**
- Full WiFi configuration UI
- TCP/IP settings
- Network interface switching

**New Browser Player:**
- **Network managed by OS**
- No WiFi config UI
- No TCP/IP config UI
- `supportsWifiConfig = false`
- `supportsTCPConfig = false`

### 4. System Information

**Old Shim:**
- Hardware-specific APIs
- BrightSign registry
- Samsung/LG device APIs

**New Browser Player:**
- Node.js server collects system info
- Windows: WMIC commands
- Linux: `/proc` and `/sys` files
- Endpoint: `GET /system/info`

### 5. File Storage

**Old Shim:**
- Device-specific storage (SD card, internal)
- Direct file system access

**New Browser Player:**
- Node.js server handles file I/O
- Windows: `C:\Users\Public\Documents\Four Winds Interactive\Content`
- Linux: `/var/lib/fwi/content`
- Browser can't write to disk directly

## Architecture Changes

### DeviceAPI Implementation

**Old Shim (BrightSign example):**
```typescript
class BrightSignAPI extends DeviceAPI {
  getSerialNumber() {
    return registry.read('serial');
  }
  
  saveChannelContent(blob, channelId, version) {
    // Direct file write to SD card
    const file = new File(`/storage/${channelId}.zip`);
    file.write(blob);
  }
}
```

**New Browser Player:**
```typescript
class BrowserAPI extends DeviceAPI {
  async getSerialNumber() {
    // Call Node server
    const res = await fetch('http://localhost:3001/system/info');
    const { serialNumber } = await res.json();
    return serialNumber;
  }
  
  async saveChannelContent(blob, channelId, version) {
    // Send to Node server
    const formData = new FormData();
    formData.append('file', blob);
    await fetch('http://localhost:3001/channel/save', {
      method: 'POST',
      body: formData
    });
  }
}
```

### Channel Download Flow

**Old Shim:**
```
1. MQTT → Channel assigned
2. Download channel ZIP
3. Extract to device storage
4. Load content in iframe
5. Render/play content
```

**New Browser Player:**
```
1. MQTT → Channel assigned
2. Node server downloads channel ZIP
3. Extract to disk
4. Download all assets (videos/images)
5. Download playlists if present
6. STOP (no rendering)
7. Separate service reads files
```

### New Features Not in Old Shim

#### Playlist Support
```javascript
// Detects playlist type in channel.json
if (content.type === 'Playlist') {
  // Download playlist JSON
  const playlist = await fetch(content.url);
  
  // Download all referenced media
  for (const item of playlist) {
    const objectId = extractObjectId(item.URL);
    await downloadMedia(objectId);
  }
}
```

#### Automatic Channel Cleanup
```javascript
// Removes ALL old channels (different IDs)
function cleanupOldVersions(channelId, currentVersion) {
  const files = fs.readdirSync(CONTENT_DIR);
  files.forEach(file => {
    if (!file.startsWith(`${channelId}.${currentVersion}`)) {
      // Remove old channel
      fs.rmSync(file, { recursive: true });
    }
  });
}
```

## File Structure Changes

### New Files

**device_browser/server.js** - Node.js backend
- System information collection
- Channel download proxy
- File storage operations

**device_browser/src/Browser.ts** - DeviceAPI implementation
- Calls Node server for operations
- No direct hardware access
- Spoofs BrightSign for compatibility

### Modified Core Files

**core/src/GUI/components/ShimApp/ShimApp.tsx**
- CPWebFrame iframe disabled (no rendering)

**core/src/GUI/components/LaunchScreen/LaunchScreen.tsx**
- Network config button uses `supportsWifiConfig` flag

**core/src/GUI/components/ShimMenu/ShimStatusBar.tsx**
- Network button uses `supportsWifiConfig` flag

## Removed Features

### Not Supported
- ❌ Content rendering/playback
- ❌ WiFi configuration UI
- ❌ TCP/IP configuration UI
- ❌ CEC control
- ❌ HDMI output configuration
- ❌ Hardware video decoding
- ❌ GPIO controls
- ❌ IR remote support

### Still Supported
- ✅ Device activation
- ✅ MQTT communication
- ✅ Channel downloads
- ✅ Playlist support
- ✅ System information
- ✅ Logging
- ✅ Timers
- ✅ Access codes
- ✅ Software updates (app reload)

## BrightSign Spoofing

**Why:**
- Reuses existing `cloudFeatures.json` configuration
- No backend changes needed
- Access to BrightSign features in Harmony

**Implementation:**
```typescript
getManufacturer() {
  return DeviceManufacturer.BrightSign;
}

// Reports as BrightSign 2.0.0
playerType: "BrightSign"
version: "2.0.0"
```

**Disabled Features:**
```typescript
supportsCECControl = true;           // Reported but not functional
supportsCustomResolution = true;     // Reported but not functional
supportsDisplayRotation = true;      // Reported but not functional
supportsWifiConfig = false;          // Disabled (OS handles)
supportsTCPConfig = false;           // Disabled (OS handles)
```

## Running the App

### Old Shim
```bash
# Single command
yarn dev
```

### New Browser Player
```bash
# Terminal 1 - Node server
cd device_browser
yarn server

# Terminal 2 - App
cd device_browser
yarn dev:simplified
```

## Testing Differences

### Old Shim
- Test on actual hardware (BrightSign, Samsung, LG)
- Physical device required

### New Browser Player
- Test on any Windows/Linux machine
- Browser-based (Chrome/Edge)
- Faster iteration

## Common Pitfalls

### 1. Expecting Content to Render
**Problem:** No iframe, no playback
**Solution:** Use separate rendering service

### 2. Direct File System Access
**Problem:** Browser can't write files
**Solution:** Use Node server endpoints

### 3. Network Configuration
**Problem:** No WiFi config UI
**Solution:** Use OS network settings

### 4. Hardware-Specific APIs
**Problem:** No BrightSign/Samsung/LG APIs
**Solution:** Node server provides system info

## Migration Checklist

- [ ] Remove content rendering expectations
- [ ] Update file storage to use Node server
- [ ] Remove network configuration UI
- [ ] Update system info collection
- [ ] Test on Windows and Linux
- [ ] Verify playlist support
- [ ] Test channel cleanup
- [ ] Confirm MQTT connectivity
- [ ] Test activation flow

## Questions?

**Q: Can I add content rendering back?**
A: No, this is intentionally a download-only player. Use a separate rendering service.

**Q: Why spoof BrightSign?**
A: To reuse existing cloudFeatures.json without backend changes.

**Q: Can I configure WiFi from the app?**
A: No, use Windows/Linux OS network settings.

**Q: Where are the downloaded files?**
A: Windows: `C:\Users\Public\Documents\Four Winds Interactive\Content`
   Linux: `/var/lib/fwi/content`

**Q: How do I test without hardware?**
A: Just run on any Windows/Linux machine with Node.js and a browser.
