# System Information Collection

## Overview
Implemented real hardware and OS information collection for device activation and provisioning on Windows and Linux platforms.

## What Was Changed

### 1. Node Server (`server.js`)
Added `/system/info` endpoint that collects:
- **Serial Number**: BIOS serial number from system
- **Device Type**: "Windows" or "Linux"
- **Make & Model**: CPU manufacturer and model name
- **Operating System**: Full OS name and version

**Windows Commands:**
- `wmic bios get serialnumber`
- `wmic cpu get manufacturer`
- `wmic cpu get name`
- `wmic os get caption`

**Linux Commands:**
- `/sys/class/dmi/id/product_serial`
- `/proc/cpuinfo` (model name)
- `/etc/os-release` (PRETTY_NAME)

### 2. Browser.ts
Updated methods to fetch real system info:

**Before:**
```typescript
getSerialNumber() => 'BROWSER_SERIAL_NUMBER'
getManufacturer() => DeviceManufacturer.BrightSign
getModel() => 'Chrome 120'
getFirmwareVersion() => '11.0.0'
```

**After:**
```typescript
getSerialNumber() => 'S9ASQL0005083LL' (actual BIOS serial)
getManufacturer() => DeviceManufacturer.Windows or DeviceManufacturer.Linux
getModel() => 'GenuineIntel Intel(R) Core(TM) Ultra 9 185H'
getFirmwareVersion() => 'Windows 11 Home'
```

### 3. Constants (`core/src/constants/index.ts`)
Added to DeviceManufacturer enum:
```typescript
Windows = 'Windows',
Linux = 'Linux',
```

## Example Output

### Windows System
```json
{
  "success": true,
  "serialNumber": "S9ASQL0005083LL",
  "deviceType": "Windows",
  "makeModel": "GenuineIntel Intel(R) Core(TM) Ultra 9 185H",
  "operatingSystem": "Windows 11 Home"
}
```

### Linux System
```json
{
  "success": true,
  "serialNumber": "VMware-56 4d 8c 7f...",
  "deviceType": "Linux",
  "makeModel": "Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz",
  "operatingSystem": "Ubuntu 22.04.3 LTS"
}
```

## Usage in Activation

When device provisions with serial number or invite code, the payload now includes:
```javascript
{
  env: 'dev',
  hardwareNumbers: ['S9ASQL0005083LL'],
  playerType: 'BrightSign',
  makeModel: 'GenuineIntel Intel(R) Core(TM) Ultra 9 185H',
  os: 'Windows 11 Home',
  playerVersion: '2.0.0'
}
```

## Testing

1. Set environment variables:

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

2. Start the Node server:
```bash
cd device_browser
yarn server
```

3. Test the endpoint:
```bash
curl http://localhost:3001/system/info
```

4. Start the app and activate a device - the correct system info will be sent to Harmony:
```bash
cd device_browser
yarn dev:simplified
```

## Files Modified
- `device_browser/server.js` - Added `/system/info` endpoint
- `device_browser/src/Browser.ts` - Updated 4 methods to fetch real data
- `core/src/constants/index.ts` - Added Windows and Linux to enum
- `device_browser/IMPLEMENTATION-STATUS.md` - Updated documentation

## Fallback Behavior
If the Node server is not running or system commands fail:
- Serial Number: Falls back to `process.env.REACT_APP_SERIAL` or 'BROWSER_SERIAL_NUMBER'
- Make & Model: 'Unknown Model'
- Operating System: 'Unknown OS'
- Manufacturer: Determined by navigator.platform (Windows/Linux)
