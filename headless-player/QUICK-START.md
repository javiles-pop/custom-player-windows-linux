# Poppulo Headless Player - Quick Start Guide

## Prerequisites
- Ubuntu 20.04+ (x86_64)
- Node.js v16+ installed
- Production EU company account access

## Installation & Setup

### 1. Extract and Install
```bash
# Extract the headless-player folder
cd headless-player

# Install dependencies
npm install
```

### 2. Set Environment Variables (EU Production)
```bash
export ENVIRONMENT=prod-eu
export VERSION=2.0.0
export BUILD_NUMBER=1
```

### 3. Start the Service
```bash
npm start
```

## What Happens Next

1. **Auto-Detection**: Service detects your system info (CPU, OS, serial number)
2. **Activation**: Attempts auto-activation, or prompts for invite code if needed
3. **Cloud Connection**: Connects to EU production environment via MQTT
4. **Channel Downloads**: Downloads assigned channels to `~/Poppulo/Content/`

## Device Activation

The service will try to auto-activate using your system's serial number. If that fails:

1. You'll see a message asking for an invite code
2. Get an invite code from your EU production company admin
3. The service will prompt you to enter it

### Manual Activation (Alternative)
If you prefer to activate manually or need to re-activate:
```bash
# Start the service first
npm start

# In another terminal, activate with your invite code
curl -X POST http://localhost:3001/activate -H "Content-Type: application/json" -d '{"inviteCode":"YOUR_INVITE_CODE"}'
```

## Content Location

Downloaded channels are stored at:
```
~/Poppulo/Content/
├── [channel-id].[version]/     # Channel content
├── current-channel.json        # Active channel tracker
└── [channel-id].[version].zip  # Original channel ZIP
```

## Install as System Service (Optional)

To run automatically on boot:
```bash
sudo chmod +x install.sh
sudo ./install.sh

# Check status
sudo systemctl status poppulo-player

# View logs
sudo journalctl -u poppulo-player -f
```

## Troubleshooting

- **Connection issues**: Verify internet connection and firewall settings
- **Activation fails**: Ensure you have a valid EU production company account
- **Permission errors**: Make sure the user has write access to home directory

## Support

Contact DS-Core team for issues or questions.