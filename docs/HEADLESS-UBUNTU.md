# Headless Ubuntu Service Implementation

## Overview

Convert the Electron-based device_browser app to run as a headless Node.js service on Ubuntu without GUI/display server requirements.

## Current State

**Electron App Structure:**
- GUI-based player with React frontend
- Node.js server (server.js) for system info and channel downloads
- Browser APIs for device detection and storage
- Requires X11/Wayland display server

**Target State:**
- Headless Node.js service only
- No GUI dependencies
- Runs as systemd service
- No display server required

## Implementation Plan

### Phase 1: Extract Core Service

**1. Create Headless Package Structure**
```
headless-player/
├── src/
│   ├── server.js           # Main HTTP server (existing)
│   ├── device-api.js       # Device info without browser APIs
│   ├── mqtt-client.js      # MQTT communication
│   ├── channel-manager.js  # Channel download/management
│   ├── system-info.js      # Hardware detection (Node.js)
│   └── config.js           # Configuration management
├── package.json            # Node.js only dependencies
├── systemd/
│   └── poppulo-player.service
└── install.sh              # Installation script
```

**2. Dependencies to Remove**
- electron
- electron-builder
- react/react-dom
- webpack (for frontend)
- All GUI-related packages

**3. Dependencies to Keep**
- express (HTTP server)
- adm-zip (channel extraction)
- node-fetch (API calls)
- Core MQTT libraries

### Phase 2: Replace Browser APIs

**Current Browser Dependencies:**
```javascript
// Browser.ts - needs Node.js equivalents
navigator.userAgent         → os.platform(), os.release()
localStorage               → fs.writeFileSync/readFileSync
window.location            → config file
fetch()                    → node-fetch
```

**System Info Replacement:**
```javascript
// Replace browser-based detection
const os = require('os');
const { execSync } = require('child_process');

// CPU info
const cpuInfo = os.cpus()[0].model;

// Serial number (Linux)
const serialNumber = execSync('cat /sys/class/dmi/id/product_serial').toString().trim();

// OS info
const osInfo = `${os.platform()} ${os.release()}`;
```

**Storage Replacement:**
```javascript
// Replace localStorage with JSON file
const configPath = '/var/lib/fwi/config.json';

function saveConfig(data) {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

function loadConfig() {
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}
```

### Phase 3: Service Configuration

**Systemd Service File:**
```ini
[Unit]
Description=Poppulo Partner Player Headless Service
After=network.target

[Service]
Type=simple
User=fwiplayer
WorkingDirectory=/opt/poppulo-player
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=ENVIRONMENT=prod
Environment=VERSION=2.0.0

[Install]
WantedBy=multi-user.target
```

**Installation Script:**
```bash
#!/bin/bash
# Create user and directories
sudo useradd -r -s /bin/false fwiplayer
sudo mkdir -p /opt/poppulo-player
# Content directory will be created automatically in user home

# Install service
sudo cp systemd/poppulo-player.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable poppulo-player
```

### Phase 4: Core Functionality Preservation

**Must Keep Working:**
- Device activation via serial number or invite code
- MQTT communication with Harmony
- Channel download and extraction
- Content storage at `~/Poppulo/Content`
- System info reporting
- BrightSign spoofing

**HTTP Endpoints to Maintain:**
- `GET /system/info` - Hardware information
- `POST /channel/download` - Channel download
- `POST /channel/save` - Save channel to disk
- Health check endpoints for monitoring

### Phase 5: Build and Deployment

**Build Process:**
```bash
# No webpack needed - pure Node.js
npm install --production
tar -czf poppulo-player-headless-2.0.0.tar.gz .
```

**Deployment:**
```bash
# Extract and install
tar -xzf poppulo-player-headless-2.0.0.tar.gz -C /opt/poppulo-player
cd /opt/poppulo-player
./install.sh
sudo systemctl start poppulo-player
```

## Implementation Steps

### Step 1: Create Base Structure
1. Create `headless-player/` directory
2. Copy `server.js` and core files
3. Create minimal `package.json` with Node.js dependencies only

### Step 2: Replace Browser APIs
1. Create `device-api.js` with Node.js system detection
2. Replace localStorage with file-based config
3. Update MQTT client for headless operation

### Step 3: Test Core Functions
1. Device activation flow
2. MQTT connectivity
3. Channel download and extraction
4. System info reporting

### Step 4: Service Integration
1. Create systemd service file
2. Test service start/stop/restart
3. Verify auto-start on boot
4. Test logging and monitoring

### Step 5: Package and Deploy
1. Create installation script
2. Build deployment package
3. Test on clean Ubuntu system
4. Document deployment process

## Technical Considerations

**Challenges:**
- Redux/React state management → Simple in-memory state
- Browser event system → Node.js EventEmitter
- UI feedback → Logging only
- Error handling without user interaction

**Benefits:**
- Much smaller footprint (~50MB vs ~180MB)
- No display server dependency
- Better for server/embedded deployments
- Easier monitoring and logging
- Standard Linux service management

## Testing Strategy

**Development Testing:**
```bash
# Run locally
node src/server.js

# Test endpoints
curl http://localhost:3001/system/info
curl -X POST http://localhost:3001/channel/download
```

**Service Testing:**
```bash
# Service management
sudo systemctl status poppulo-player
sudo journalctl -u poppulo-player -f

# Integration testing
# - Device activation
# - Channel assignment via cloud
# - Content download verification
```

## Timeline Estimate

- **Day 1-2**: Extract core service, replace browser APIs
- **Day 3**: Service configuration and testing
- **Day 4**: Integration testing and deployment packaging
- **Day 5**: Documentation and final testing

## Success Criteria

- [ ] Headless service starts without display server
- [ ] Device activation works (serial number + invite code)
- [ ] MQTT communication functional
- [ ] Channel download and extraction working
- [ ] Current channel tracking file (`current-channel.json`) created
- [ ] Content stored correctly in `~/Poppulo/Content`
- [ ] Service auto-starts on boot
- [ ] Proper logging and monitoring
- [ ] BrightSign spoofing maintained for cloud compatibility

## Rollback Plan

Keep existing Electron build as fallback. Headless service can coexist or replace based on deployment needs.