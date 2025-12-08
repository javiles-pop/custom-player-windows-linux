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

Output: `device_browser/release/FWI Player Setup.exe`

### Linux Packages

```bash
export ENVIRONMENT=prod VERSION=2.0.0 BUILD_NUMBER=1 && npm run electron:build:linux
```

Output: `device_browser/release/` (AppImage and .deb)

## Important Notes

### Environment Variables

Environment variables are **baked into the webpack build** at build time. You must:
1. Set environment variables
2. Run `npm run build:simplified`
3. Then run `npm run electron`

If you change environment variables, you must rebuild.

### Node Server

The Node.js server (server.js) starts automatically when Electron launches. You don't need to run it separately.

### DevTools in Production

To disable DevTools in production builds, remove this line from `electron-main.js`:

```javascript
mainWindow.webContents.openDevTools();
```

## Troubleshooting

### "Cannot find module 'copy-webpack-plugin'"

```bash
npm install --save-dev copy-webpack-plugin@6
```

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

### Wrong cloud environment

Verify environment variables are set correctly and rebuild:

```powershell
# Check current values
echo $env:ENVIRONMENT
echo $env:CLOUD_ENV

# Set and rebuild
$env:ENVIRONMENT="dev"; $env:CLOUD_ENV="cloudtest1"; npm run build:simplified
```
