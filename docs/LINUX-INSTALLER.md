# Linux Ubuntu Installer Guide

Complete guide for building and installing the Poppulo Partner Player on Ubuntu Linux.

---

## Building the Linux Installer

### Prerequisites

- Windows machine with Node.js and npm installed
- WSL (Windows Subsystem for Linux) with Ubuntu
- Administrator privileges on Windows

### Step 1: Install WSL with Ubuntu

From PowerShell (as Administrator):

```powershell
wsl --install
```

This installs Ubuntu by default. Launch it:

```powershell
wsl -d Ubuntu
```

Follow prompts to create a username and password.

### Step 2: Configure package.json

The Linux build configuration in `device_browser/package.json` must include:

```json
{
  "name": "@fwi/shim-browser",
  "version": "2.0.0",
  "author": {
    "name": "Poppulo",
    "email": "support@poppulo.com"
  },
  "homepage": "https://www.poppulo.com",
  "description": "Poppulo Partner Player for Windows and Linux",
  "build": {
    "appId": "com.poppulo.partner-player",
    "productName": "Poppulo Partner Player Demo",
    "linux": {
      "target": "tar.gz",
      "category": "Utility"
    }
  },
  "scripts": {
    "electron:build:linux": "yarn build:simplified && electron-builder --linux"
  }
}
```

**Important Notes:**
- `target: "tar.gz"` - Can be built from Windows (unlike `deb` or `AppImage`)
- `author` and `homepage` are required for Linux builds
- `description` is required for package metadata

### Step 3: Build from WSL

Navigate to project in WSL:

```bash
cd "/mnt/c/Users/javiles/OneDrive - Poppulo/Applications/FWI/Players/shim-master/device_browser"
```

Run the build:

```bash
npm run electron:build:linux
```

**Build Output:**
- Location: `device_browser/release/@fwi/shim-browser-2.0.0.tar.gz`
- Size: ~180 MB (includes Electron runtime and all dependencies)

### Why WSL?

- Building from Windows PowerShell works for `tar.gz` format
- WSL provides better compatibility and avoids potential path issues
- Required for `deb` or `AppImage` formats (needs `fpm` tool)

---

## Installing on Ubuntu

### Step 1: Transfer the Installer

Copy `shim-browser-2.0.0.tar.gz` to your Ubuntu machine via:
- USB drive
- Network share
- SCP: `scp shim-browser-2.0.0.tar.gz user@ubuntu-ip:~/Desktop/`

### Step 2: Extract the Archive

```bash
cd ~/Desktop
tar -xzf shim-browser-2.0.0.tar.gz
cd shim-browser-2.0.0
```

**Extracted Contents:**
```
shim-browser-2.0.0/
├── @fwishim-browser          # Main executable (177 MB)
├── chrome-sandbox             # Chromium sandbox
├── chrome_100_percent.pak     # UI resources
├── chrome_200_percent.pak     # UI resources (high DPI)
├── chrome_crashpad_handler    # Crash reporting
├── icudtl.dat                 # Unicode data
├── libEGL.so                  # Graphics library
├── libffmpeg.so               # Media codecs
├── libGLESv2.so               # OpenGL ES
├── libvk_swiftshader.so       # Vulkan software renderer
├── libvulkan.so.1             # Vulkan loader
├── resources.pak              # Application resources
├── snapshot_blob.bin          # V8 snapshot
├── v8_context_snapshot.bin    # V8 context
├── locales/                   # Language files
└── resources/                 # App resources
    ├── app.asar               # Application code
    └── server.bundle.js       # Node server
```

### Step 3: Run the Application

```bash
cd shim-browser-2.0.0
chmod +x @fwishim-browser
./@fwishim-browser --no-sandbox
```

**Note:** Content directory `~/Poppulo/Content` is created automatically when the app starts.

**Command Line Flags:**
- `--no-sandbox` - Required when running as non-root user (Chromium security requirement)
- Without this flag, you'll get: `FATAL:setuid_sandbox_host.cc(158)] The SUID sandbox helper binary was found, but is not configured correctly`

---

## Troubleshooting

### Error: Missing X server or $DISPLAY

**Problem:**
```
ERROR:ozone_platform_x11.cc(240)] Missing X server or $DISPLAY
ERROR:env.cc(257)] The platform failed to initialize. Exiting.
```

**Solution:**
- Run the app directly on the Ubuntu desktop (not via SSH)
- Or use SSH with X11 forwarding: `ssh -X user@ubuntu-ip`

### Error: Permission denied on ~/Poppulo/Content

**Problem:**
```
Error: EACCES: permission denied, mkdir '~/Poppulo/Content'
```

**Solution:**
This should not occur as the directory is created in the user's home directory. If it does occur, ensure the user has write permissions to their home directory.

### Error: SUID sandbox helper binary not configured

**Problem:**
```
FATAL:setuid_sandbox_host.cc(158)] The SUID sandbox helper binary was found, but is not configured correctly
```

**Solution:**
Run with `--no-sandbox` flag:
```bash
./@fwishim-browser --no-sandbox
```

### Node Server Not Starting (Port 3001)

**Problem:**
App loads but shows connection errors to `localhost:3001`

**Solution:**
Check that `~/Poppulo/Content` exists and has proper permissions (should be created automatically)

---

## Creating a Desktop Shortcut (Optional)

Create `~/.local/share/applications/poppulo-player.desktop`:

```ini
[Desktop Entry]
Name=Poppulo Partner Player
Comment=Digital Signage Player
Exec=/home/fwiplayer/Desktop/shim-browser-2.0.0/@fwishim-browser --no-sandbox
Icon=/home/fwiplayer/Desktop/shim-browser-2.0.0/resources/app.asar.unpacked/icon.png
Terminal=false
Type=Application
Categories=Utility;
```

Make it executable:
```bash
chmod +x ~/.local/share/applications/poppulo-player.desktop
```

---

## System Requirements

- Ubuntu 20.04 LTS or newer (tested on Ubuntu 24.04.3 LTS)
- x86_64 architecture (amd64)
- 4 GB RAM minimum
- 500 MB disk space for application
- Additional space for channel content (varies by usage)
- Display server (X11 or Wayland)

**Dependencies (automatically included):**
- Electron 28.3.3
- Node.js 18.18.2
- Chromium (embedded in Electron)

---

## Uninstalling

```bash
# Remove application files
rm -rf ~/Desktop/shim-browser-2.0.0

# Remove channel content (optional)
rm -rf ~/Poppulo

# Remove desktop shortcut (if created)
rm ~/.local/share/applications/poppulo-player.desktop
```

---

## Differences from Windows Installer

| Feature | Windows | Linux |
|---------|---------|-------|
| **Installer Type** | NSIS (.exe) | tar.gz archive |
| **Installation** | GUI wizard | Manual extraction |
| **Content Path** | `C:\Users\Public\Documents\Four Winds Interactive\Content` | `~/Poppulo/Content` |
| **Auto-start** | Optional (installer checkbox) | Manual setup required |
| **Uninstaller** | Included | Manual deletion |
| **Desktop Shortcut** | Created automatically | Manual creation |
| **Sandbox** | Enabled by default | Requires `--no-sandbox` flag |

---

## Build Comparison: tar.gz vs deb vs AppImage

| Format | Build on Windows | Install Method | Auto-updates | Dependencies |
|--------|------------------|----------------|--------------|--------------|
| **tar.gz** | ✅ Yes (via WSL) | Manual extract | No | Bundled |
| **deb** | ❌ No (needs fpm) | `dpkg -i` or double-click | No | System packages |
| **AppImage** | ❌ No (needs mksquashfs) | Make executable & run | Yes (with AppImageUpdate) | Bundled |

**Why we chose tar.gz:**
- Can be built from Windows development environment
- No additional Linux tools required (fpm, mksquashfs)
- Works on all Linux distributions (not just Debian/Ubuntu)
- Simple extraction and execution

---

## Remote Access via SSH

### Enable SSH on Ubuntu

```bash
sudo apt install openssh-server
sudo systemctl start ssh
sudo systemctl enable ssh
```

### Connect from Windows

```powershell
ssh user@ubuntu-ip
```

### View Logs Remotely

```bash
# View log file
ssh user@ubuntu-ip "cat ~/Desktop/shim-browser-2.0.0/app.log"

# Copy log to Windows
scp user@ubuntu-ip:~/Desktop/shim-browser-2.0.0/app.log C:\Users\javiles\Desktop\
```

### Run with Logging

```bash
./@fwishim-browser --no-sandbox 2>&1 | tee app.log
```

This captures all output (stdout and stderr) to `app.log` while displaying on screen.

---

## Production Deployment Recommendations

### 1. Install to /opt

```bash
sudo mkdir -p /opt/poppulo-player
sudo tar -xzf shim-browser-2.0.0.tar.gz -C /opt/poppulo-player --strip-components=1
sudo chown -R root:root /opt/poppulo-player
sudo chmod +x /opt/poppulo-player/@fwishim-browser
```

### 2. Create System Service

Create `/etc/systemd/system/poppulo-player.service`:

```ini
[Unit]
Description=Poppulo Partner Player
After=network.target

[Service]
Type=simple
User=fwiplayer
Environment="DISPLAY=:0"
ExecStart=/opt/poppulo-player/@fwishim-browser --no-sandbox
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable poppulo-player
sudo systemctl start poppulo-player
```

### 3. Auto-start on Login (Alternative)

Add to `~/.config/autostart/poppulo-player.desktop`:

```ini
[Desktop Entry]
Type=Application
Name=Poppulo Partner Player
Exec=/opt/poppulo-player/@fwishim-browser --no-sandbox
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
```

---

## Support

For issues or questions:
- Check logs: `cat ~/Desktop/shim-browser-2.0.0/app.log`
- Verify permissions: `ls -la ~/Poppulo/Content`
- Test Node server: `curl http://localhost:3001/system/info`
- Contact DS-Core team

---

## Version History

- **v2.0.0** - Initial Linux release
  - tar.gz format for universal compatibility
  - Electron 28.3.3
  - Node.js 18.18.2
  - Bundled server with webpack
