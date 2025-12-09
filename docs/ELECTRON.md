# Electron App Setup & Debugging

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build & Run

**Development (CloudTest1):**

```powershell
# Windows PowerShell
$env:ENVIRONMENT="dev"; $env:CLOUD_ENV="cloudtest1"; $env:VERSION="2.0.0"; $env:BUILD_NUMBER="dev"; npm run build:simplified; npm run electron
```

```bash
# Linux/Mac
export ENVIRONMENT=dev CLOUD_ENV=cloudtest1 VERSION=2.0.0 BUILD_NUMBER=dev && npm run build:simplified && npm run electron
```

**Production:**

```powershell
# Windows PowerShell
$env:ENVIRONMENT="prod"; $env:VERSION="2.0.0"; $env:BUILD_NUMBER="1"; npm run build:simplified; npm run electron
```

```bash
# Linux/Mac
export ENVIRONMENT=prod VERSION=2.0.0 BUILD_NUMBER=1 && npm run build:simplified && npm run electron
```

## Debugging

### DevTools (Renderer Process)

DevTools opens automatically when the app starts. Use it to debug:
- React components
- Redux state
- Network requests
- Console logs
- UI issues

### Main Process Debugging

To debug Node.js code (electron-main.js, server.js):

```powershell
.\node_modules\.bin\electron.cmd --inspect=5858 .
```

Then:
1. Open Chrome browser
2. Go to `chrome://inspect`
3. Click "Configure" and add `localhost:5858`
4. Click "inspect" under your app

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Electron",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/device_browser",
      "runtimeExecutable": "${workspaceFolder}/device_browser/node_modules/.bin/electron.cmd",
      "args": ["."],
      "outputCapture": "std",
      "env": {
        "ENVIRONMENT": "dev",
        "CLOUD_ENV": "cloudtest1",
        "VERSION": "2.0.0",
        "BUILD_NUMBER": "dev"
      }
    }
  ]
}
```

Press `F5` to start debugging with breakpoints.

## Building Distributables

### Windows Installer

```powershell
$env:ENVIRONMENT="prod"; $env:VERSION="2.0.0"; $env:BUILD_NUMBER="1"; npm run electron:build:win
```

Output: `device_browser/release/Poppulo Partner Player Demo Setup 2.0.0.exe`

**Note:** The build process automatically bundles server.js with all dependencies using webpack.

### Linux Installer

**Requirements:**
- WSL (Windows Subsystem for Linux) with Ubuntu
- Build must be done from WSL, not Windows PowerShell

**Steps:**

1. Install WSL (if not already installed):
   ```powershell
   wsl --install
   ```

2. Launch Ubuntu and navigate to project:
   ```bash
   wsl -d Ubuntu
   cd "/mnt/c/Users/[username]/OneDrive - Poppulo/Applications/FWI/Players/shim-master/device_browser"
   ```

3. Build the installer:
   ```bash
   npm run electron:build:linux
   ```

**Output:** `device_browser/release/@fwi/shim-browser-2.0.0.tar.gz`

**Format:** tar.gz archive (works on all Linux distributions)

**Why WSL?**
- Building from Windows works for tar.gz format
- Avoids SSL certificate issues with corporate proxies
- Better compatibility than building from Windows directly
- Required for .deb or AppImage formats (needs additional tools)

See [LINUX-INSTALLER.md](../docs/LINUX-INSTALLER.md) for complete Linux build and installation guide.

## Important Notes

### Environment Variables

Environment variables are **baked into the webpack build** at build time. You must:
1. Set environment variables
2. Run `npm run build:simplified`
3. Then run `npm run electron`

If you change environment variables, you must rebuild.

### Node Server

The Node.js server (server.js) starts automatically when Electron launches. You don't need to run it separately.

**Production Builds:** The server is bundled with webpack into `server.bundle.js` with all dependencies included. This ensures the server works correctly in packaged apps without requiring external node_modules.

**Development Mode:** The server runs directly from `server.js` without bundling.

### DevTools in Production

To disable DevTools in production builds, remove this line from `electron-main.js`:

```javascript
mainWindow.webContents.openDevTools();
```

## Architecture

### Server Bundling

For production Electron builds, the Node.js server is bundled using webpack:

1. **webpack.server.js** - Bundles server.js with all dependencies
2. **babel-loader** - Transpiles modern JavaScript (optional chaining, etc.)
3. **Output** - Single `dist/server.bundle.js` file
4. **Electron** - Runs bundled server using `ELECTRON_RUN_AS_NODE` environment variable

This approach:
- ✅ Eliminates missing dependency errors in packaged apps
- ✅ Reduces package size (no need to copy entire node_modules)
- ✅ Ensures compatibility with Electron's embedded Node runtime
- ✅ Transpiles modern syntax for older Node versions

### Running the Server

**Development:**
```javascript
// electron-main.js uses server.js directly
const serverPath = path.join(__dirname, 'server.js');
```

**Production:**
```javascript
// electron-main.js uses bundled server
const serverPath = path.join(process.resourcesPath, 'server.bundle.js');
```

The server is spawned using:
```javascript
spawn(process.execPath, [serverPath], {
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
});
```

## Troubleshooting

### "Cannot find module 'copy-webpack-plugin'"

```bash
npm install --save-dev copy-webpack-plugin@6
```

### HTTP 500 Errors in Packaged App

If the server returns HTTP 500 errors in the packaged app:
1. Run the app from PowerShell to see server logs:
   ```powershell
   & "C:\Users\<username>\AppData\Local\Programs\@fwishim-browser\Poppulo Partner Player Demo.exe"
   ```
2. Check for "TypeError" or "is not a function" errors
3. Ensure server.js is properly bundled with webpack (should happen automatically during build)
4. Verify babel-loader is transpiling modern syntax

### Environment variables not working

Make sure to rebuild after setting variables:

```powershell
npm run build:simplified
```

### App won't start

Check that `dist/index.html` exists. If not, run:

```powershell
npm run build:simplified
```

### Linux: Permission denied on /var/lib/fwi/content

On Linux, the app needs write access to `/var/lib/fwi/content`:

```bash
sudo mkdir -p /var/lib/fwi/content
sudo chown -R $USER:$USER /var/lib/fwi
```

### Linux: SUID sandbox error

Run with `--no-sandbox` flag:

```bash
./@fwishim-browser --no-sandbox
```

### Linux: Missing X server or $DISPLAY

Run the app directly on the Ubuntu desktop, not via SSH. Or use SSH with X11 forwarding:

```bash
ssh -X user@ubuntu-ip
```

### Wrong cloud environment

Verify environment variables are set correctly and rebuild:

```powershell
# Check current values
echo $env:ENVIRONMENT
echo $env:CLOUD_ENV

# Set and rebuild
$env:ENVIRONMENT="dev"; $env:CLOUD_ENV="cloudtest1"; npm run build:simplified
```

### WMIC Command Not Found

If you see "'wmic' is not recognized" errors:
- This is expected on some Windows systems
- The app still works fine - it just can't auto-detect serial number via BIOS
- Users can activate using invite codes instead
- Non-critical warning that can be ignored
