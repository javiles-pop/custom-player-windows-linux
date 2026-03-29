# Headless Player Feature Matrix

Feature coverage comparison between the headless player and the browser (Electron) player. This matrix identifies what is covered today, what is partially implemented, and what gaps remain.

## 1. Device Provisioning & Activation

| Feature | Status | Notes |
|---|---|---|
| Auto-activation via serial number | ✅ Covered | Publishes to `fwi/provision` with serial |
| Invite code activation | ✅ Covered | `POST /activate` endpoint |
| BrightSign spoofing (playerType) | ✅ Covered | Reports as `BrightSign` v2.0.0 |
| Device attribute publishing | ✅ Covered | IP, MAC, serial, OS, makeModel to `fwi/{companyId}/attributes` |
| Device deactivation / cloud delete handling | ✅ Covered | Clears config, restarts service |
| Device reset | ✅ Covered | `POST /reset` endpoint |

## 2. Channel Deployment Instructions

| Feature | Status | Notes |
|---|---|---|
| JSON channel support (`channel.json`) | ✅ Covered | Simple/Daily channels parsed and content downloaded |
| XML channel support (`Deployment.xml`) | ✅ Covered | CXB channels — parses `<Content>` blocks with `p3:type` |
| Playlist JSON parsing & media download | ✅ Covered | Downloads playlist JSON + all referenced items |
| Channel version tracking (`current-channel.json`) | ✅ Covered | Writes tracker file for downstream renderers |
| Automatic old channel cleanup | ✅ Covered | Removes old channel dirs and ZIPs |

## 3. Content Fetching

| Feature | Status | Notes |
|---|---|---|
| Video (.mp4, .webm, .mov) | ✅ Covered | |
| Image (.jpg, .png, .svg, .gif, .webp) | ✅ Covered | |
| Audio (.mp3) | ✅ Covered | |
| Documents (.pdf, .ppt, .pptx, .doc, .docx) | ✅ Covered | |
| Spreadsheets (.xls, .xlsx, .csv) | ✅ Covered | |
| Web (.html) | ✅ Covered | |
| Fonts (.ttf, .otf) | ✅ Covered | |
| Data (.json, .xml) | ✅ Covered | |
| .dsapp packages | ✅ Covered | |
| UNC network share paths | ✅ Covered | Copies from `\\server\share\file` |
| Token refresh before download | ✅ Covered | `getFreshToken()` gets new Cognito token each time |
| Broadcast-triggered re-download | ✅ Covered | Listens on `fwi/{companyId}/broadcast` |
| Broadcast channel filtering | ✅ Covered | Ignores broadcasts for non-assigned channels |

## 4. Player Logs — Device Logs

| Feature | Status | Notes |
|---|---|---|
| Console logging with category prefixes | ✅ Covered | `[MQTT]`, `[CHANNEL]`, `[CONTENT]`, etc. |
| Auto-upload device logs to cloud (S3) | ❌ Not covered | Browser uses `autoUploadCloudLogs()` → publishes to `fwi/{companyId}/logs` → gets S3 upload URL → uploads JSON. Headless has no equivalent |
| Cloud log level control (shadow `LogLevel`) | ❌ Not covered | Browser reads `LogLevel` from shadow delta and adjusts logging verbosity. Headless ignores this |
| Configurable log upload interval | ❌ Not covered | Browser supports `UploadLogTimeInterval` shadow key (5min to 24hr). Headless has no scheduled uploads |
| Log download to file | ❌ Not covered | Browser has `saveCloudLogsToDisk()`. Headless only has stdout/journalctl |
| Handle `log` command from cloud | ❌ Not covered | Browser handles `handleLogCommand()` for cloud-initiated log requests. Headless ignores `log` commands |

## 5. Player Logs — Content/Playback Logs

| Feature | Status | Notes |
|---|---|---|
| Content playback event logging | ❌ Not covered | Browser tracks `PlayEvent[]` via CPWeb integration. Headless doesn't render content so has no playback events |
| Auto-upload play logs to cloud | ❌ Not covered | Browser uses `autoUploadPlayLogs()`. Not applicable unless headless tracks what the renderer plays |
| Play log enable/disable (shadow `IsFwiCloudPlaylogEnabled`) | ❌ Not covered | |

## 6. Cloud Player Commands

| Feature | Status | Notes |
|---|---|---|
| Reboot | ⚠️ Partial | Headless calls `process.exit(0)` — relies on systemd/Windows Service to restart. Does NOT send command confirmation back to cloud like browser does |
| CheckDeployment (refresh channel) | ⚠️ Partial | Logs receipt but doesn't trigger re-download. Browser dispatches `setRunScript` which triggers full refresh |
| ClearCache | ❌ Not covered | Browser clears player cache via `DeviceAPI.clearPlayerCache()` |
| RunScript | ❌ Not covered | Browser forwards to CPWeb iframe for execution |
| Screenshot | ❌ Not covered | Browser captures DOM screenshot, rotates per orientation, uploads to S3 via signed URL |
| SendReaderId | ❌ Not covered | Browser forwards to CPWeb |
| Generic player commands | ❌ Not covered | Browser forwards unknown commands to CPWeb |
| Command confirmation to cloud | ❌ Not covered | Browser publishes `{status, eventId, requestId}` to `fwi/{companyId}/command`. Headless sends a basic `{status: 'SUCCESS'}` to `fwi/{companyId}/attributes` (wrong topic, missing `eventId`/`requestId`) |
| Peer-to-peer commands (`publishCommand`) | ❌ Not covered | Browser forwards CPWeb `publishCommand` messages to `fwi/{companyId}/p2p` topic for device-to-device communication |

### 6b. RunScript Sub-Commands (via CPWeb)

These are granular device configuration commands executed via the `RunScript` cloud command, processed by CPWeb and the core framework. None are applicable to headless without a CPWeb integration layer.

| Feature | Status | Notes |
|---|---|---|
| `configureDeployment` (set channel URL) | ❌ Not covered | |
| `setAccessCode` / `removeAccessCode` | ❌ Not covered | |
| `setDisplayOrientation` | ❌ Not covered | |
| `enableDailyReboot` / `disableDailyReboot` | ❌ Not covered | |
| `setDailyRebootTime` | ❌ Not covered | |
| `enableDisplayTimers` / `disableDisplayTimers` | ❌ Not covered | |
| `addDisplayTimer` / `deleteDisplayTimer` / `deleteAllDisplayTimers` | ❌ Not covered | |
| `updateSoftwareUrl` / `updateSoftwareTime` | ❌ Not covered | |
| `updateFirmwareUrl` / `updateFirmwareTime` | ❌ Not covered | |
| `toggleSoftwareEnable` (enable/disable update check) | ❌ Not covered | |
| `enableFirmwareUpdateCheck` / `disableFirmwareUpdateCheck` | ❌ Not covered | |
| `checkSoftwareNow` / `checkFirmware` | ❌ Not covered | |
| `turnOnDisplay` / `turnOffDisplay` | ❌ Not covered | |
| `rebootNow` / `restartApp` | ❌ Not covered | |

## 7. Player Cloud Configuration (Shadow)

| Feature | Status | Notes |
|---|---|---|
| Channel assignment (`channel`) | ✅ Covered | Triggers download on shadow delta |
| CurrentURL | ❌ Not covered | Browser sets deployment URL from shadow |
| WebPlayerURL | ❌ Not covered | Browser sets base web player URL |
| Device name (`name`) | ❌ Not covered | Browser updates device name in state |
| Log level (`LogLevel`) | ❌ Not covered | |
| Log upload interval (`UploadLogTimeInterval`) | ❌ Not covered | |
| Timezone (`TimeZone`) | ❌ Not covered | |
| Time server (`TimeServer`) | ❌ Not covered | |
| Resolution | ❌ Not covered | |
| Orientation | ❌ Not covered | |
| Proxy settings | ❌ Not covered | |
| Reboot schedule (`WantReboot`, `RebootTime`) | ❌ Not covered | |
| On/Off timers (`EnableOnOffTimers`, `OnOffTimers`) | ❌ Not covered | |
| CEC control (`CECEnabled`) | ❌ Not covered | |
| Software update URL & schedule | ❌ Not covered | |
| Firmware update URL & schedule | ❌ Not covered | |
| Access code | ❌ Not covered | |
| Volume | ❌ Not covered | |
| Encrypted storage | ❌ Not covered | |
| Play logging enabled flag | ❌ Not covered | |
| Device labels (`checkLabels`) | ❌ Not covered | Cloud sends `checkLabels` in shadow delta when labels change. Browser forwards `updateLabels` command to CPWeb which fetches updated labels from API. Headless ignores `checkLabels` entirely |
| Video wall (`VideoWallEnabled`, bezel compensation) | ❌ Not covered | Browser supports video wall enable/disable and bezel compensation settings |
| Report full shadow state to cloud | ❌ Not covered | Browser reports all settings via `reportCurrentShadow()`. Headless only reports back the delta it received |

## 8. Local Configuration

| Feature | Status | Notes |
|---|---|---|
| Persistent device config (activation state) | ✅ Covered | Saves to `config.json` on disk |
| Environment variable configuration | ✅ Covered | `ENVIRONMENT`, `CLOUD_ENV`, `VERSION`, `BUILD_NUMBER` |
| Content directory management | ✅ Covered | Auto-creates content dir per platform |
| Windows Service install/uninstall | ✅ Covered | `windows/install.bat`, `install-service.js` |
| Linux systemd service | ✅ Covered | `systemd/poppulo-player.service` |
| Local settings persistence (all shadow keys) | ❌ Not covered | Browser persists all shadow settings to localStorage/registry. Headless only persists activation state |

## 9. Cloud Status Monitoring

### 9a. Device Info Reported to Cloud (via `fwi/{companyId}/attributes`)

| Feature | Status | Notes |
|---|---|---|
| Serial number | ✅ Covered | Detected from BIOS (Windows) or `/sys/class/dmi/id/product_serial` (Linux) |
| Player type (device type) | ✅ Covered | Reports `BrightSign` (spoofed) |
| Make/model (CPU info) | ✅ Covered | Detected from `Win32_Processor` (Windows) or `/proc/cpuinfo` (Linux) |
| Operating system | ✅ Covered | Detected from `Win32_OperatingSystem` (Windows) or `/etc/os-release` (Linux) |
| Player version | ✅ Covered | Reports `2.0.0.{BUILD_NUMBER}` |
| IP address | ✅ Covered | First non-loopback IPv4 address from `os.networkInterfaces()` |
| MAC address | ✅ Covered | From same interface as IP |
| Active network adapter name | ✅ Covered | Interface name (e.g. `eth0`, `Ethernet`) published in `adapters` object |
| Adapter description | ⚠️ Partial | Published as empty string `""` — browser also sends empty string |
| IPv6 address | ⚠️ Partial | Published as empty string `""` — browser also sends empty string |
| IPv6 link-local address | ⚠️ Partial | Published as empty string `""` — browser also sends empty string |
| Multiple network adapters | ❌ Not covered | Headless only reports the first active adapter. Browser also only reports one, but has WiFi scanning/status APIs |
| WiFi adapter details (SSID, signal strength) | ❌ Not covered | Browser has `getWifiStatus()` and `scanNetworks()`. Headless has no WiFi-specific reporting |
| Wired adapter link status | ❌ Not covered | `/network/interfaces` returns stubs (`hasLink: false`). No real detection |

> **Note:** Activated date, created date, and last modified date are tracked server-side by Harmony — the player does not report these. They are set when the device is provisioned/activated in the cloud backend.

### 9b. Shadow-Reported Device State (via `$aws/things/{deviceId}/shadow/update`)

The browser reports a full device shadow on connect via `reportCurrentShadow()`. The cloud portal reads these values for the device detail/monitoring page.

| Feature | Status | Notes |
|---|---|---|
| Report full shadow on connect | ❌ Not covered | Browser calls `reportCurrentShadow()` after MQTT connect. Headless only reports back deltas it receives |
| CurrentURL (deployment URL) | ❌ Not covered | Shows what content is deployed to the device |
| Device name | ❌ Not covered | Displayed in cloud portal device list |
| Resolution | ❌ Not covered | |
| Orientation | ❌ Not covered | |
| Timezone | ❌ Not covered | |
| Log level | ❌ Not covered | |
| Reboot schedule | ❌ Not covered | |
| On/Off timer state | ❌ Not covered | |
| Software/firmware update URLs | ❌ Not covered | |
| Proxy configuration | ❌ Not covered | |
| Access code | ❌ Not covered | |
| CEC enabled | ❌ Not covered | |
| Volume | ❌ Not covered | |
| Encrypted storage | ❌ Not covered | |
| Web player URL | ❌ Not covered | |
| Play logging enabled | ❌ Not covered | |

### 9c. Real-time Monitoring

| Feature | Status | Notes |
|---|---|---|
| MQTT connection status | ✅ Covered | `GET /health` returns `{mqtt: true/false}` |
| Cloud connected state | ❌ Not covered | Browser tracks `connected` in Redux and updates UI. Headless has `isConnectedFlag` but doesn't report it to cloud |
| Screenshot capture & upload | ❌ Not covered | No display to capture. Would need integration with renderer |
| Device online/offline detection | ❌ Not covered | Browser probes internet connectivity (`isOnline()`) and runs online/offline flows. Headless has no connectivity probing |
| Online/offline flow (reconnect, cache-bust, log upload) | ❌ Not covered | Browser runs `doOnlineFlow()` on reconnect (re-establishes MQTT, cache-busts content, uploads buffered logs). Headless has no equivalent |

## 10. Scheduled Tasks & Background Operations

| Feature | Status | Notes |
|---|---|---|
| Scheduled daily reboot | ❌ Not covered | Browser schedules reboot at configured time with random jitter to avoid network congestion. Headless has no scheduler |
| Scheduled software update check | ❌ Not covered | Browser checks for software updates at configured time daily |
| Scheduled firmware update check | ❌ Not covered | Browser checks for firmware updates at configured time daily |
| On/Off display timers | ❌ Not covered | Browser schedules display on/off per weekday/time configuration |
| Scheduled log upload intervals | ❌ Not covered | Browser uploads logs at configurable intervals (5min to 24hr) |
| Internet connectivity probing (every 1 min) | ❌ Not covered | Browser checks internet connectivity every minute |
| Playback log save to disk (every 5 min) | ❌ Not covered | Browser saves playback logs to disk every 5 minutes as backup |

## 11. Token & Session Management

| Feature | Status | Notes |
|---|---|---|
| Cognito token refresh scheduling | ❌ Not covered | Browser schedules token refresh 5 minutes before expiration via `refreshAccessToken()`. Headless only refreshes tokens on-demand before channel downloads |
| MQTT credential refresh on token expiry | ❌ Not covered | Browser calls `updateWebSocketCredentials()` to inject new credentials into live MQTT connection. Headless creates static credentials at connect time — MQTT disconnects when session expires (~1hr) |
| Deployment URL token injection | ❌ Not covered | Browser appends `_fwi_accessToken` and `_fwi_cloudCompanyId` to channel URLs for authenticated access |
| Offline log buffering & upload on reconnect | ❌ Not covered | Browser saves logs to disk while offline, then uploads buffered logs when connectivity returns via `doOnlineFlow()` |

## 12. Other

| Feature | Status | Notes |
|---|---|---|
| CPWeb bi-directional communication | ❌ Not covered | Browser has full message router for CPWeb iframe (log, itemPlayed, setPlayer, executeCommandResponse, loadSign, showConfiguration, playEvent, publishCommand). Not applicable unless headless integrates with a renderer |
| Channel broadcast cache-busting | ❌ Not covered | Browser calls `cacheBustCurrentDeployment()` to append cache-buster param and re-verify URL. Headless re-downloads the full channel instead |
| Deployment URL verification | ❌ Not covered | Browser verifies channel URLs are valid CPWeb instances, checks authentication status, retries on failure with backoff |
| Web security toggle | ❌ Not covered | Browser supports `enableWebSecurity()` / `disableWebSecurity()` via DeviceAPI |

---

## Summary

| Category | ✅ Covered | ⚠️ Partial | ❌ Not Covered |
|---|---|---|---|
| Provisioning & Activation | 6 | 0 | 0 |
| Channel Deployment Instructions | 5 | 0 | 0 |
| Content Fetching | 13 | 0 | 0 |
| Device Logs | 1 | 0 | 5 |
| Content/Playback Logs | 0 | 0 | 3 |
| Cloud Player Commands | 0 | 2 | 6 |
| RunScript Sub-Commands | 0 | 0 | 14 |
| Cloud Configuration (Shadow) | 1 | 0 | 18 |
| Local Configuration | 4 | 0 | 1 |
| Device Info Reported to Cloud | 7 | 3 | 3 |
| Shadow-Reported Device State | 0 | 0 | 17 |
| Real-time Monitoring | 1 | 0 | 4 |
| Scheduled Tasks & Background Ops | 0 | 0 | 7 |
| Token & Session Management | 0 | 0 | 4 |
| Other | 0 | 0 | 4 |
| **Total** | **38** | **5** | **86** |

The headless player is strong on provisioning, channel download, and content fetching. The biggest gaps are cloud commands (especially command confirmations), device/playback log uploads, and shadow configuration — essentially everything the `core/` framework handles for the browser player that was never reimplemented in the headless service.
