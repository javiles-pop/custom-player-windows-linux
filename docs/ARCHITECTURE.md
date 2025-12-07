# Architecture

How the Custom Player works under the hood.

## Overview

This is a browser-based player that downloads channel content to disk but does NOT render it. A separate rendering service reads the downloaded files.

## Key Components

### 1. Device Activation

**Flow:**
1. App detects system info (serial number, CPU, OS) via Node server
2. Attempts auto-activation with serial number
3. Falls back to invite code if needed
4. Connects to Harmony via MQTT (AWS IoT)

**Files:**
- `device_browser/server.js` - `/system/info` endpoint
- `device_browser/src/Browser.ts` - System info methods
- `core/src/Flows/ActivationFlow.ts` - Activation logic

### 2. Channel Download

**Flow:**
1. Device receives channel assignment via MQTT
2. Node server downloads channel ZIP from API
3. Extracts to disk
4. **For Simple/Daily channels (cloud):** Reads `channel.json` and downloads all content assets
5. **For Content Experience Builder channels (standard):** Parses `Deployment.xml` and downloads playlist content
6. **If Playlist:** Downloads playlist JSON and all referenced media
7. **Cleanup:** Removes old channels (different IDs)

**Files:**
- `device_browser/server.js` - `/channel/download` endpoint
- `device_browser/src/injectChannelURL.js` - Download trigger
- `core/src/MQTT/Shadow.ts` - Channel assignment detection

**Storage Structure:**
```
Content/
├── {channelId}.{version}/          # Simple/Daily (UUID-based)
│   ├── channel.json
│   ├── {contentId}.mp4
│   ├── {contentId}.jpg
│   └── {playlistId}.json (if playlist)
├── {channelName}.{version}/        # Content Experience Builder (name-based)
│   ├── Deployment.xml
│   ├── {contentId}.mp4
│   └── {contentId}.jpg
```

### 3. Playlist Support

**How it works:**
1. Detects `type: "Playlist"` in channel.json
2. Downloads playlist JSON from URL
3. Parses playlist items array
4. Extracts unique object IDs from URLs (e.g., `/objects/{id}/download`)
5. Downloads each video/image with unique filename

**Example Playlist JSON:**
```json
[
  {
    "URL": "https://api.../objects/76bdcf61-5a45-4b43-8d21-fc802ff3ea56/download",
    "Duration": "00:00:10",
    "MimeType": "video/mp4"
  }
]
```

**Downloaded as:** `76bdcf61-5a45-4b43-8d21-fc802ff3ea56.mp4`

### 4. Automatic Channel Cleanup

**How it works:**
- When a new channel downloads, removes ALL old channels
- Only keeps the current channel (by ID)
- Removes both directories and ZIP files
- Saves disk space

**Example:**
```
Before: 03a3b726-c1bf-4b3b-bfed-1d54a715f18a.1/, AMAZON.2/, CHROMA.45/
After:  CHROMA.45/  (only current channel kept)
```

### 6. Content Experience Builder Channel Support

**How it works:**
- CXB channels use channel names (e.g., "AMAZON") instead of UUIDs
- Contains `Deployment.xml` instead of `channel.json`
- Parses XML to extract playlist URLs from `<Path>` tags
- Downloads playlists and all referenced media files
- Supports same file types as Simple/Daily channels

### 5. BrightSign Spoofing

**Why:**
- Leverages existing `cloudFeatures.json` configuration
- No backend changes needed
- Access to all BrightSign features

**Implementation:**
- Reports as `playerType: "BrightSign"`
- Version: `2.0.0`
- Disables features not supported by browser (WiFi config, TCP/IP config)

## State Management

- **Redux** - Global state
- **Redux Sagas** - Async operations
- **React Hooks** - Component state

## Communication

- **MQTT** - Real-time cloud communication (AWS IoT)
- **REST API** - Channel downloads
- **Node Server** - System info, file operations

## Network Configuration

Network settings are managed by the OS (Windows/Linux). The player disables:
- WiFi configuration UI
- TCP/IP configuration UI
- "Configure Network" buttons

Users configure network through Windows/Linux settings.

## File Extensions

Determined by:
1. URL extension (e.g., `.mp4` in URL)
2. Content-Type header (e.g., `video/mp4`)
3. Fallback based on type (Image → `.jpg`, Video → `.mp4`)

### Supported File Types by Channel

**Super Simple Channels:**
- Video: .mp4, .webm, .mov
- Image: .jpg, .png, .svg, .gif, .webp
- .dsapp files
- Playlists (JSON)

**Daily Channels:**
- All Super Simple types
- Multiple items per channel

**Content Experience Builder:**
- Video: .mp4, .webm, .mov
- Image: .jpg, .png, .svg, .gif, .webp
- Audio: .mp3
- Documents: .pdf, .ppt, .pptx
- Web: .html
- Fonts: .ttf, .otf
- Data: .json, .xml
- .dsapp files
- Playlists (JSON)

### Content-Type Mapping

The server maps MIME types to file extensions:
- Images: image/jpeg → .jpg, image/png → .png, image/svg+xml → .svg
- Video: video/mp4 → .mp4, video/webm → .webm
- Audio: audio/mpeg → .mp3
- Documents: application/pdf → .pdf, application/vnd.ms-powerpoint → .ppt
- Fonts: font/ttf → .ttf, font/opentype → .otf
- Data: application/json → .json, application/xml → .xml
- Web: text/html → .html

## API Endpoints

**Node Server (localhost:3001):**
- `GET /system/info` - Hardware info
- `POST /channel/download` - Download channel
- `POST /channel/save` - Save channel ZIP

**Cloud API:**
- `GET /channels/v1/companies/{companyId}/channels/{channelId}/download`
- `GET /library/v1/company/{companyId}/playlist/{playlistId}/json`

## Dependencies

**Runtime:**
- `express` - Web server
- `multer` - File uploads
- `adm-zip` - ZIP extraction

**Frontend:**
- React, Redux, Redux Saga
- MQTT.js for AWS IoT

## Project Structure

```
shim-master/
├── core/                    # Shared React/Redux code
│   ├── src/
│   │   ├── MQTT/           # MQTT communication
│   │   ├── Flows/          # Activation, deployment
│   │   └── GUI/            # React components
├── device_browser/          # Browser player
│   ├── src/
│   │   ├── Browser.ts      # DeviceAPI implementation
│   │   ├── index.tsx       # Entry point
│   │   └── injectChannelURL.js  # Channel download
│   └── server.js           # Node server
└── docs/                    # Documentation
```

## Security

- Bearer token authentication (Cognito)
- Tokens stored in Redux state
- CORS configured for localhost only
- No credentials in code

## Platform Support

**Windows:**
- Uses WMIC for system info
- Paths use backslashes
- Storage: `C:\Users\Public\Documents\...`

**Linux:**
- Uses `/proc` and `/sys` for system info
- Paths use forward slashes
- Storage: `/var/lib/fwi/content`
