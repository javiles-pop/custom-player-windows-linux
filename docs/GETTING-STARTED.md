# Getting Started

Quick start guide for running the Custom Player for Windows/Linux.

## Prerequisites

- Node.js v16+
- Yarn v1.19.0+
- Windows 10/11 or Linux

## Installation

```bash
yarn
```

## Configuration

### Environment Variables

**Development (CloudTest1):**

```powershell
# Windows PowerShell
$env:ENVIRONMENT="dev"
$env:CLOUD_ENV="cloudtest1"
$env:VERSION="2.0.0"
$env:BUILD_NUMBER="dev"
```

```bash
# Linux/Mac
export ENVIRONMENT=dev
export CLOUD_ENV=cloudtest1
export VERSION=2.0.0
export BUILD_NUMBER=dev
```

**Production:**

```powershell
# Windows PowerShell
$env:ENVIRONMENT="prod"
$env:VERSION="2.0.0"
$env:BUILD_NUMBER="1"
```

```bash
# Linux/Mac
export ENVIRONMENT=prod
export VERSION=2.0.0
export BUILD_NUMBER=1
```

### Company Requirements

- **Development:** Use a CloudTest1 company account (`https://cloudtest1.fwi-dev.com`)
- **Production:** Use a production company account (`https://app.fwicloud.com`)

## Running the Application

### 1. Start the Node Server

```bash
cd device_browser
yarn server
```

The server runs on port 3001 and handles:
- System information collection
- Channel downloads
- Content asset storage

### 2. Start the App

In a new terminal:

```bash
cd device_browser
yarn dev:simplified
```

The app opens at `http://localhost:2999`

## First Time Setup

1. **Activation Screen** - App auto-detects your system serial number
2. **Auto-Activation** - Attempts to activate with serial number
3. **Invite Code** - If auto-activation fails, enter your 6-character invite code
4. **Connected** - Device connects to Harmony via MQTT

## What Happens Next

- Device appears in your Harmony account
- Assign a channel to the device
- Channel automatically downloads to disk
- Content assets (videos/images) download automatically
- Playlists are fully supported

## Storage Location

**Windows:**
```
C:\Users\Public\Documents\Four Winds Interactive\Content\{channelId}.{version}\
```

**Linux:**
```
/var/lib/fwi/content/{channelId}.{version}/
```

## Building for Production

```bash
cd device_browser
yarn build:simplified
```

Output: `device_browser/dist/`

## Environment Options

**ENVIRONMENT:**
- `dev` - Development (requires CloudTest1)
- `staging` - Staging
- `prod` - Production US
- `prod-ap` - Production Asia-Pacific
- `prod-eu` - Production Europe

**CLOUD_ENV (dev only):**
- `cloudtest1` or `cloudtest2` - Test environments
- `admin`, `contributor`, `network` - Other dev environments

**VERSION:**
- Must be `2.0.0` for BrightSign compatibility

## Next Steps

- See [ARCHITECTURE.md](ARCHITECTURE.md) for how the system works
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
