# Headless Player

Cross-platform headless player service for Windows and Linux that provides device management and channel download capabilities without GUI requirements.

## Features

- ✅ **Device Activation & Provisioning** - Auto-activation via serial number or invite code
- ✅ **MQTT Communication** - Real-time cloud connectivity via AWS IoT Core
- ✅ **Channel Download & Storage** - Downloads and manages channel content automatically
- ✅ **Current Channel Tracking** - Creates `current-channel.json` for rendering apps
- ✅ **Token Management** - Handles fresh token broadcasts from cloud
- ✅ **BrightSign Compatibility** - Spoofs BrightSign for existing cloud infrastructure
- ✅ **Cross-Platform** - Works on Windows and Linux
- ✅ **Persistent Connection** - Automatic reconnection after reboots
- ❌ **Content Rendering** - Use separate rendering service

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

**Development (CloudTest1):**

**Windows:**
```cmd
set ENVIRONMENT=dev
set CLOUD_ENV=cloudtest1
set VERSION=2.0.0
set BUILD_NUMBER=dev
```

**Linux:**
```bash
export ENVIRONMENT=dev
export CLOUD_ENV=cloudtest1
export VERSION=2.0.0
export BUILD_NUMBER=dev
```

**Production:**
```bash
export ENVIRONMENT=prod
export VERSION=2.0.0
export BUILD_NUMBER=1
```

### 3. Start the Service

```bash
npm start
```

The service will:
1. Detect system information (serial number, CPU, OS)
2. Attempt auto-activation via serial number
3. If auto-activation fails, prompt for invite code activation
4. Connect to cloud via MQTT for real-time communication
5. Subscribe to device topics for channel assignments and commands
6. Automatically download channels when assigned via cloud
7. Start HTTP server on port 3001

## Device Activation

### Auto-Activation (Serial Number)
The service automatically attempts activation using the system serial number.

### Manual Activation (Invite Code)
If auto-activation fails, activate manually:

```bash
# PowerShell
irm http://localhost:3001/activate -Method POST -ContentType "application/json" -Body '{"inviteCode":"YOUR_INVITE_CODE"}'

# curl
curl -X POST http://localhost:3001/activate -H "Content-Type: application/json" -d '{"inviteCode":"YOUR_INVITE_CODE"}'
```

## API Endpoints

- `GET /system/info` - Returns system hardware information
- `POST /activate` - Activate device with invite code
- `POST /channel/download` - Downloads channel and content
- `POST /reset` - Clear device configuration
- `GET /health` - Service health check with MQTT status

## Content Storage

Content is stored at:
- **Windows**: `C:\Users\Public\Documents\Four Winds Interactive\Content`
- **Linux**: `~/Poppulo/Content`

The service creates a `current-channel.json` file that downstream rendering applications can monitor:

```json
{
  "channelId": "uuid",
  "version": 7,
  "path": "/path/to/channel",
  "name": "Channel Name",
  "lastUpdated": "2025-01-XX"
}
```

## Environment Configuration

### Development
- Use **CloudTest1** company accounts
- Set `ENVIRONMENT=dev` and `CLOUD_ENV=cloudtest1`

### Production
- Use **production** company accounts
- Set `ENVIRONMENT=prod` (or `prod-eu`, `prod-ap`)

## Device Activation

The service supports two activation methods:

### 1. Auto-Activation (Serial Number)
Automatic activation using system serial number for pre-registered devices.

### 2. Manual Activation (Invite Code)
For new devices or when auto-activation fails:

```bash
POST http://localhost:3001/activate
Body: {"inviteCode": "YOUR_INVITE_CODE"}
```

### Troubleshooting Activation
1. Check serial number detection: `GET /system/info`
2. Verify environment variables match company type
3. Ensure device not already registered in cloud
4. For development, use CloudTest1 company accounts
5. For production, use production company accounts

## Supported Content Types

- **Videos**: .mp4, .webm, .mov
- **Images**: .jpg, .png, .svg, .gif, .webp
- **Audio**: .mp3
- **Documents**: .pdf, .ppt, .pptx
- **Web**: .html
- **Apps**: .dsapp
- **Playlists**: JSON playlists with referenced media

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cloud/MQTT    │◄──►│  Headless Player │◄──►│ Rendering App   │
│                 │    │                  │    │                 │
│ • Device Mgmt   │    │ • Channel Mgmt   │    │ • Content Play  │
│ • Channel Assign│    │ • Content Store  │    │ • UI Display    │
│ • Commands      │    │ • MQTT Client    │    │ • User Input    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Troubleshooting

### Service Won't Start
- Check Node.js version (requires 16+)
- Verify environment variables are set
- Check network connectivity

### Device Activation Fails
- Try manual activation with invite code
- Verify serial number: `GET /system/info`
- Check environment/company type match
- Ensure device not already registered
- Use `/reset` endpoint to clear config if needed

### Channel Download Issues
- Check MQTT connection in health endpoint
- Verify bearer token validity
- Monitor service logs for errors

## Development

### Project Structure
```
src/
├── server.js          # Main HTTP server
├── device-manager.js  # System info & device detection
├── channel-manager.js # Channel downloads & content
├── mqtt-client.js     # MQTT communication
└── config.js          # Environment configuration
```

### Adding Features
1. Extend appropriate manager class
2. Add HTTP endpoints in server.js
3. Handle MQTT messages in mqtt-client.js
4. Update this README

## License

Proprietary - Poppulo/Four Winds Interactive