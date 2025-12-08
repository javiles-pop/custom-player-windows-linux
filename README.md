# Custom Player for Windows/Linux

Browser-based content player for Windows and Linux systems, built on the Poppulo Shim v2.0 architecture.

## Overview

This is a browser-based player that runs on Windows and Linux systems, providing device management and channel download capabilities with cloud connectivity via MQTT. The player spoofs BrightSign for compatibility with existing cloudFeatures.json configurations.

**Note:** This player does NOT render content. It downloads channel metadata and assets to disk for use by a separate rendering service.

## Features

- ✅ **Device Activation & Provisioning** - Auto-activation via serial number or invite code
- ✅ **Real-time MQTT Communication** - Cloud connectivity via Harmony
- ✅ **Channel Download & Storage** - Downloads channel metadata, assets, and playlists locally
- ✅ **Playlist Support** - Downloads playlist JSON and all referenced videos/images
- ✅ **Multi-Format Support** - Videos, images, audio, documents, fonts, data files, and .dsapp
- ✅ **System Information Collection** - Auto-detects hardware (CPU, OS, serial number)
- ✅ **Automatic Channel Cleanup** - Removes old channels when downloading new ones
- ✅ **Simplified UI** - Streamlined menu with essential features only (network managed by OS)
- ❌ **Content Rendering** - NOT included (use separate rendering service)

## Requirements

- Node.js v16+
- Yarn v1.19.0+
- Windows 10/11 or Linux

## Quick Start

### 1. Install Dependencies

```bash
yarn
```

### 2. Set Environment Variables

**Development (CloudTest1):**

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

**Production:**

**Windows (PowerShell):**
```powershell
$env:ENVIRONMENT="prod"
$env:VERSION="2.0.0"
$env:BUILD_NUMBER="1"
```

**Linux/Mac:**
```bash
export ENVIRONMENT=prod
export VERSION=2.0.0
export BUILD_NUMBER=1
```

**Important:** 
- For **development/testing**, use a CloudTest1 company account
- For **production**, use a production cloud company account

### 3. Start the Node Server

```bash
cd device_browser
yarn server
```

### 4. Start the App

In a new terminal:

```bash
cd device_browser
yarn dev:simplified
```

The app will open at `http://localhost:2999`

## Project Structure

```
shim-master/
├── core/                    # Shared code (React, Redux, MQTT, etc.)
├── device_browser/          # Browser player implementation
│   ├── src/
│   │   ├── Browser.ts       # DeviceAPI implementation
│   │   ├── index.tsx        # Main entry point
│   │   ├── injectChannelURL.js  # Channel URL display
│   │   ├── simplified.css   # UI customization
│   │   └── SimplifiedShimMenuPageDeployment.tsx
│   ├── server.js            # Node server (system info, channel downloads)
│   ├── webpack.config.simplified.js  # Webpack config for renderer
│   ├── webpack.server.js    # Webpack config for server bundling
│   ├── electron-main.js     # Electron main process
│   └── package.json
├── webpack.config.base.js   # Base webpack config
├── package.json             # Root dependencies
└── README.md
```

## How It Works

### Device Activation

1. App starts and detects system information (serial number, CPU, OS)
2. Attempts auto-activation via serial number
3. If auto-activation fails, prompts for invite code
4. Connects to Harmony via MQTT for cloud communication

### Channel Download

1. Device receives channel assignment via MQTT
2. Node server downloads channel ZIP from API
3. Extracts channel metadata (channel.json or Deployment.xml) and downloads content assets
4. **Content Download**:
   - **Simple/Daily channels**: Downloads content from channel.json
   - **Content Experience Builder**: Parses Deployment.xml for content URLs
     - Playlist URLs: Downloads playlist JSON and all referenced media
     - Direct content URLs: Downloads images, HTML, and other content directly
5. **Automatic Cleanup**: Removes all old channels (different channel IDs) to save disk space
6. Stores locally at `C:\Users\Public\Documents\Four Winds Interactive\Content` (Windows) or `/var/lib/fwi/content` (Linux)
7. Separate rendering service reads files from disk

### BrightSign Spoofing

The player reports as `playerType: "BrightSign"` with `version: "2.0.0"` to leverage existing cloudFeatures.json configuration without requiring backend changes. This provides:
- Access to all BrightSign features (commands, logs, channels)
- Ability to set deployment URLs
- Compatibility with existing device management workflows

## Configuration

### Environment Variables

- `ENVIRONMENT` - Environment to connect to:
  - `dev` - Development (requires CloudTest1 company)
  - `staging` - Staging environment
  - `prod` - Production US (requires production company)
  - `prod-ap` - Production Asia-Pacific
  - `prod-eu` - Production Europe
- `CLOUD_ENV` - Cloud environment (dev only):
  - `cloudtest1` or `cloudtest2` - Test environments
  - `admin`, `contributor`, `network` - Other dev environments
  - **Not used in production**
- `VERSION` - Must be 2.0.0 for BrightSign compatibility
- `BUILD_NUMBER` - Build number (use "dev" for development, increment for production)

### Company Requirements

**Development/Testing:**
- Must use a **CloudTest1 company** account
- CloudTest companies are for testing only
- Access via: `https://cloudtest1.fwi-dev.com`

**Production:**
- Must use a **production cloud company** account
- Access via: `https://app.fwicloud.com` (US), `https://ap1.fwicloud.com` (AP), `https://eu1.fwicloud.com` (EU)

### Node Server Endpoints

- `GET /system/info` - Returns system hardware information
- `POST /channel/download` - Downloads channel and content
- `POST /channel/save` - Saves channel ZIP to disk
- `GET /network/config` - Network configuration (stub)
- `GET /network/interfaces` - Network interfaces (stub)

## Development

### Build for Production

```bash
cd device_browser
yarn build:simplified
```

Output will be in `device_browser/dist/`

### Running Tests

```bash
cd core
yarn test              # Unit tests
yarn test:cypress      # UI tests
```

## Documentation

- [GETTING-STARTED.md](docs/GETTING-STARTED.md) - Quick start guide
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - How the system works
- [ELECTRON.md](docs/ELECTRON.md) - Electron app setup and debugging
- [MIGRATION-GUIDE.md](docs/MIGRATION-GUIDE.md) - For developers familiar with BrightSign/Samsung/LG shim
- [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Common issues and solutions

## Architecture

### State Management

- **Redux** - Global state management
- **Redux Sagas** - Async operations and side effects
- **React Hooks** - Component state and lifecycle

### Communication

- **MQTT** - Real-time cloud communication via AWS IoT
- **REST API** - Channel downloads and content retrieval
- **WebSocket** - Live updates from Harmony

### Storage

- **LocalStorage** - Browser-based settings (development)
- **File System** - Channel content and assets (via Node server)

## Troubleshooting

### Node Server Not Running

If you see `ERR_CONNECTION_REFUSED` errors:
```bash
cd device_browser
yarn server
```

### Webpack Warnings

BrightSign environment variable warnings are suppressed in webpack config. If you see them, restart the dev server.

### Network Configuration

Network configuration is handled by the operating system (Windows/Linux). The "Configure Network" button is disabled for browser-based players. Use your OS network settings to configure WiFi or Ethernet.

### Wrong Company Type

If activation fails:
- **Development:** Ensure you're using a CloudTest1 company
- **Production:** Ensure you're using a production company (not CloudTest)
- Verify the `ENVIRONMENT` variable matches your company type

### Device Stuck on "Checking Player Registration"

If the device gets stuck after deleting from cloud and re-provisioning, refresh the browser (F5). The app will automatically reload and continue the activation process.

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Proprietary - Poppulo/Four Winds Interactive

## Supported Content Types

### Super Simple Channels (single item)
- **Video**: .mp4, .webm, .mov
- **Image**: .jpg, .png, .svg, .gif, .webp
- **.dsapp**: Digital signage app packages
- **Playlist**: JSON playlists with referenced media

### Daily Channels (mixed content)
- All Super Simple types
- Multiple items in sequence

### Content Experience Builder (full design tool)
- **Video**: .mp4, .webm, .mov
- **Image**: .jpg, .png, .svg, .gif, .webp
- **Audio**: .mp3
- **Documents**: .pdf, .ppt, .pptx
- **Web**: .html
- **Fonts**: .ttf, .otf
- **Data**: .json, .xml
- **.dsapp**: Digital signage app packages
- **Playlists**: JSON playlists

## Recent Updates

### Electron Server Bundling (Latest)
- Server.js is now bundled with webpack for production Electron builds
- Uses babel-loader to transpile modern JavaScript syntax (optional chaining)
- All server dependencies bundled into single server.bundle.js file
- Server runs using Electron's embedded Node runtime (ELECTRON_RUN_AS_NODE)
- Fixes HTTP 500 errors in packaged apps caused by missing dependencies

### Network Share Support
- Added support for UNC network share paths in CXB channels
- Copies files from network shares (e.g., `\\192.168.0.82\Share\file.mp4`) to local storage
- Works alongside HTTP/HTTPS content downloads

### Content Experience Builder Direct Content Support
- Added support for direct content URLs in CXB channels
- Downloads ImageContent, HtmlContent, and other content types from Deployment.xml
- Handles both playlist URLs and direct download URLs
- Extracts object IDs from URLs for proper file naming

### Multi-Format Content Support
- Added support for audio files (.mp3)
- Added support for documents (.pdf, .ppt, .pptx)
- Added support for fonts (.ttf, .otf)
- Added support for data formats (.json, .xml)
- Added support for web content (.html)
- Full support for Content Experience Builder channels

### Playlist Support
- Added support for downloading playlist JSON files
- Automatically downloads all videos/images referenced in playlists
- Extracts unique object IDs from URLs to prevent file overwrites

### Channel Management
- Implemented automatic cleanup of old channels
- Only keeps the currently assigned channel to save disk space
- Removes both old channel directories and ZIP files

### Network Configuration
- Disabled network configuration UI for browser players
- Network settings managed by Windows/Linux OS
- Removed "Configure Network" button from activation screen and status bar

### Device Deactivation Fix
- Fixed issue where device would get stuck after deactivation
- Browser now properly reloads when device is deleted from cloud
- Improved re-provisioning flow

## Support

For issues or questions, contact the DS-Core team.
