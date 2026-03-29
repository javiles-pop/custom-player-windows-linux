# Player Architecture Diagram

This document provides a visual overview of the Poppulo player architecture. Use this as an SDK reference for understanding the subsystems required to build a player from the ground up.

## High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          POPPULO CLOUD (Harmony)                            │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  AWS IoT Core │  │  Channels    │  │  Device Mgmt │  │  Log Storage  │  │
│  │  (MQTT)       │  │  API         │  │  API         │  │  (S3)         │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         │                  │                  │                   │          │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐  ┌───────┴───────┐  │
│  │ Device Shadow│  │ Content CDN  │  │ Cognito      │  │ Screenshot    │  │
│  │ (IoT Thing)  │  │ (S3/CF)      │  │ (Auth)       │  │ Upload (S3)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
        │                    │                  │                   │
        │         MQTT / HTTPS / WebSocket      │                  │
        ▼                    ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PLAYER DEVICE                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     1. ACTIVATION LAYER                             │    │
│  │                                                                     │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────────┐  │    │
│  │  │ System Info      │  │ Provisioning    │  │ Authentication     │  │    │
│  │  │ Detection        │  │                 │  │                    │  │    │
│  │  │                  │  │ • Serial auto   │  │ • Cognito session  │  │    │
│  │  │ • Serial number  │  │ • Invite code   │  │ • Token refresh    │  │    │
│  │  │ • CPU / model    │  │ • BrightSign    │  │ • Credential mgmt  │  │    │
│  │  │ • OS version     │  │   spoofing      │  │ • AES key decrypt  │  │    │
│  │  │ • Network info   │  │                 │  │                    │  │    │
│  │  └─────────────────┘  └─────────────────┘  └────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     2. MQTT COMMUNICATION LAYER                     │    │
│  │                                                                     │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │                    Topic Subscriptions                       │   │    │
│  │  │                                                              │   │    │
│  │  │  $aws/things/{deviceId}/shadow/update/delta  ← Shadow config│   │    │
│  │  │  $aws/things/{deviceId}/shadow/get/#         ← Initial state│   │    │
│  │  │  fwi/{companyId}/broadcast                   ← Channel updates│  │    │
│  │  │  fwi/{companyId}/{deviceId}                  ← Device commands│  │    │
│  │  │  fwi/provision/{id}                          ← Provisioning  │   │    │
│  │  │  fwi/activate/{id}                           ← Activation    │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  │                                                                     │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │                    Topic Publishing                          │   │    │
│  │  │                                                              │   │    │
│  │  │  $aws/things/{deviceId}/shadow/update        → Report state  │   │    │
│  │  │  fwi/{companyId}/attributes                  → Device info   │   │    │
│  │  │  fwi/{companyId}/command                     → Cmd confirm   │   │    │
│  │  │  fwi/{companyId}/logs                        → Log upload req│   │    │
│  │  │  fwi/provision                               → Register      │   │    │
│  │  │  fwi/activate                                → Activate      │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  │                                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │    │
│  │  │ Message      │  │ Shadow       │  │ Command                  │  │    │
│  │  │ Router       │  │ Handler      │  │ Handler                  │  │    │
│  │  │              │  │              │  │                          │  │    │
│  │  │ Routes by:   │  │ • Get/Delta  │  │ • Reboot                │  │    │
│  │  │ • topic      │  │ • Channel    │  │ • CheckDeployment       │  │    │
│  │  │ • command    │  │ • Config     │  │ • ClearCache            │  │    │
│  │  │ • status     │  │ • Labels     │  │ • RunScript             │  │    │
│  │  │ • channel    │  │ • Report     │  │ • Screenshot            │  │    │
│  │  │              │  │   shadow     │  │ • Log upload            │  │    │
│  │  │              │  │              │  │ • Command confirmation  │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                 ┌──────────────────┼──────────────────┐                     │
│                 ▼                  ▼                  ▼                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐      │
│  │ 3. CHANNEL       │  │ 4. DEVICE        │  │ 5. LOGGING &         │      │
│  │    MANAGEMENT    │  │    CONFIGURATION │  │    MONITORING        │      │
│  │                  │  │                  │  │                      │      │
│  │ • Download ZIP   │  │ Shadow Config:   │  │ Device Logs:         │      │
│  │ • Extract        │  │ • Channel URL    │  │ • In-memory buffer   │      │
│  │ • Parse:         │  │ • Device name    │  │ • Upload to S3       │      │
│  │   - channel.json │  │ • Resolution     │  │ • Log level control  │      │
│  │   - Deployment   │  │ • Orientation    │  │ • Upload interval    │      │
│  │     .xml         │  │ • Timezone       │  │ • Offline buffering  │      │
│  │ • Fetch content  │  │ • Log level      │  │                      │      │
│  │ • Fetch playlist │  │ • Proxy          │  │ Playback Logs:       │      │
│  │   items          │  │ • Reboot sched   │  │ • Play events        │      │
│  │ • Track current  │  │ • On/Off timers  │  │ • Upload to S3       │      │
│  │   channel        │  │ • CEC            │  │                      │      │
│  │ • Cleanup old    │  │ • Volume         │  │ Screenshots:         │      │
│  │   versions       │  │ • Labels         │  │ • Capture display    │      │
│  │ • Network share  │  │ • Video wall     │  │ • Rotate per orient  │      │
│  │   copy           │  │ • SW/FW update   │  │ • Upload to S3       │      │
│  │                  │  │ • Access code    │  │                      │      │
│  │ Content Types:   │  │ • Encryption     │  │ Health:              │      │
│  │ • Video          │  │                  │  │ • MQTT connected     │      │
│  │ • Image          │  │ Local Config:    │  │ • Online/offline     │      │
│  │ • Audio          │  │ • Persist to     │  │ • Network interface  │      │
│  │ • Documents      │  │   disk/registry  │  │                      │      │
│  │ • Spreadsheets   │  │ • Env variables  │  │ Attributes:          │      │
│  │ • Web/HTML       │  │                  │  │ • Serial, IP, MAC    │      │
│  │ • Fonts          │  │ RunScript Cmds:  │  │ • OS, CPU, version   │      │
│  │ • Data files     │  │ • Set URL        │  │ • Adapter details    │      │
│  │ • .dsapp         │  │ • Set timers     │  │                      │      │
│  │ • Playlists      │  │ • Set orientation│  │                      │      │
│  │                  │  │ • Set updates    │  │                      │      │
│  │                  │  │ • Display on/off │  │                      │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘      │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     6. SCHEDULER / BACKGROUND TASKS                 │    │
│  │                                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │ Token Refresh │  │ Timed Tasks  │  │ Interval     │              │    │
│  │  │               │  │              │  │ Tasks        │              │    │
│  │  │ • 5 min before│  │ • Daily      │  │              │              │    │
│  │  │   expiry      │  │   reboot     │  │ • Log upload │              │    │
│  │  │ • MQTT cred   │  │ • SW update  │  │   (5m-24h)   │              │    │
│  │  │   refresh     │  │   check      │  │ • Connectivity│             │    │
│  │  │               │  │ • FW update  │  │   probe (1m) │              │    │
│  │  │               │  │   check      │  │ • Playback   │              │    │
│  │  │               │  │ • Display    │  │   log save   │              │    │
│  │  │               │  │   on/off     │  │   (5m)       │              │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     7. LOCAL STORAGE                                │    │
│  │                                                                     │    │
│  │  ┌──────────────────────┐  ┌────────────────────────────────────┐  │    │
│  │  │ Content Directory     │  │ Device Configuration               │  │    │
│  │  │                       │  │                                    │  │    │
│  │  │ Windows:              │  │ • Activation state                 │  │    │
│  │  │  C:\Users\Public\     │  │ • Provisioned device payload       │  │    │
│  │  │  Documents\FWI\       │  │ • AWS settings                     │  │    │
│  │  │  Content\             │  │ • All shadow settings              │  │    │
│  │  │                       │  │ • Scheduled task state             │  │    │
│  │  │ Linux:                │  │                                    │  │    │
│  │  │  ~/Poppulo/Content/   │  │ Storage:                           │  │    │
│  │  │                       │  │ • Browser: localStorage            │  │    │
│  │  │ Contents:             │  │ • BrightSign: registry             │  │    │
│  │  │ • {channelId}.{ver}/  │  │ • Headless: config.json            │  │    │
│  │  │ • {channelId}.{ver}   │  │                                    │  │    │
│  │  │   .zip                │  │                                    │  │    │
│  │  │ • current-channel     │  │                                    │  │    │
│  │  │   .json               │  │                                    │  │    │
│  │  └──────────────────────┘  └────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     8. RENDERING (External)                         │    │
│  │                                                                     │    │
│  │  The player does NOT render content. A separate rendering service   │    │
│  │  reads from the content directory and current-channel.json.         │    │
│  │                                                                     │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │  Rendering App reads:                                        │   │    │
│  │  │  • current-channel.json  → which channel is active           │   │    │
│  │  │  • {channelId}.{ver}/    → content files (video, images...)  │   │    │
│  │  │  • channel.json          → content list & metadata           │   │    │
│  │  │  • Deployment.xml        → CXB layout instructions           │   │    │
│  │  │                                                              │   │    │
│  │  │  Monitors current-channel.json for changes to detect updates │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Device Activation

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Player   │     │  AWS IoT     │     │  Harmony     │     │  Cognito     │
│  Device   │     │  (MQTT)      │     │  Lambda      │     │  (Auth)      │
└─────┬────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
      │                  │                     │                    │
      │  1. Get AWS settings (HTTPS)           │                    │
      │─────────────────────────────────────────────────────────────>
      │                  │                     │                    │
      │  2. Get unauth Cognito credentials     │                    │
      │─────────────────────────────────────────────────────────────>
      │                  │                     │                    │
      │  3. Connect MQTT (unauthenticated)     │                    │
      │─────────────────>│                     │                    │
      │                  │                     │                    │
      │  4. Publish to fwi/provision           │                    │
      │     {serial or inviteCode, playerType} │                    │
      │─────────────────>│────────────────────>│                    │
      │                  │                     │                    │
      │  5. Receive ProvisionedDevicePayload   │                    │
      │     {deviceId, companyId, key,         │                    │
      │      cognitoUserPoolId, cognitoClientId}                    │
      │<─────────────────│<────────────────────│                    │
      │                  │                     │                    │
      │  6. Authenticate with Cognito (decrypt key → password)      │
      │─────────────────────────────────────────────────────────────>
      │                  │                     │                    │
      │  7. Publish to fwi/activate            │                    │
      │     {deviceId, principal, companyId}    │                    │
      │─────────────────>│────────────────────>│                    │
      │                  │                     │                    │
      │  8. Receive {status: "activated"}      │                    │
      │<─────────────────│<────────────────────│                    │
      │                  │                     │                    │
      │  9. Reconnect MQTT (authenticated)     │                    │
      │─────────────────>│                     │                    │
      │                  │                     │                    │
      │  10. Subscribe to device topics        │                    │
      │      Publish device attributes         │                    │
      │      Report shadow state               │                    │
      │─────────────────>│                     │                    │
      │                  │                     │                    │
```

## Data Flow: Channel Download

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Player   │     │  AWS IoT     │     │  Channels    │     │  Content     │
│  Device   │     │  (MQTT)      │     │  API         │     │  CDN (S3)    │
└─────┬────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
      │                  │                     │                    │
      │  1. Shadow delta: {channel: {id: uuid}}│                    │
      │<─────────────────│                     │                    │
      │                  │                     │                    │
      │  2. GET /channels/v1/.../download      │                    │
      │     (with fresh Cognito token)         │                    │
      │────────────────────────────────────────>│                    │
      │                  │                     │                    │
      │  3. Response: {channelUrl, version, name}                   │
      │<────────────────────────────────────────│                    │
      │                  │                     │                    │
      │  4. Download channel ZIP               │                    │
      │─────────────────────────────────────────────────────────────>
      │                  │                     │                    │
      │  5. Extract ZIP locally                │                    │
      │  ┌─────────────────────────────┐       │                    │
      │  │ Parse channel.json          │       │                    │
      │  │   OR Deployment.xml         │       │                    │
      │  └─────────────────────────────┘       │                    │
      │                  │                     │                    │
      │  6. Download each content item         │                    │
      │     (video, image, playlist, etc.)     │                    │
      │─────────────────────────────────────────────────────────────>
      │                  │                     │                    │
      │  7. Write current-channel.json         │                    │
      │  8. Cleanup old channel versions       │                    │
      │                  │                     │                    │
      │  9. Report shadow: {channel: reported} │                    │
      │─────────────────>│                     │                    │
      │                  │                     │                    │
```

## Headless Player Coverage Map

Shows which layers are implemented (✅), partially implemented (⚠️), or missing (❌) in the headless player today.

```
┌─────────────────────────────────────────────────────────────────┐
│                        PLAYER LAYERS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ 1. ACTIVATION LAYER                                        │
│     ✅ System info detection                                   │
│     ✅ Serial + invite code provisioning                       │
│     ✅ Cognito authentication                                  │
│     ✅ BrightSign spoofing                                     │
│     ✅ Device attribute publishing                             │
│                                                                 │
│  ⚠️ 2. MQTT COMMUNICATION LAYER                               │
│     ✅ Connect / subscribe / publish                           │
│     ✅ Message routing (provision, activate, shadow, commands)  │
│     ✅ Shadow delta → channel download trigger                 │
│     ✅ Broadcast channel updates                               │
│     ❌ Full shadow reporting on connect                        │
│     ❌ Command confirmation (wrong topic, missing fields)      │
│     ❌ Token/credential refresh for long-lived connections     │
│                                                                 │
│  ✅ 3. CHANNEL MANAGEMENT                                      │
│     ✅ ZIP download, extract, content fetch                    │
│     ✅ channel.json + Deployment.xml parsing                   │
│     ✅ Playlist support                                        │
│     ✅ All content types                                       │
│     ✅ current-channel.json tracker                            │
│     ✅ Old version cleanup                                     │
│                                                                 │
│  ❌ 4. DEVICE CONFIGURATION                                    │
│     ❌ Shadow config processing (17 settings)                  │
│     ❌ RunScript sub-commands (14 commands)                    │
│     ❌ Local persistence of all settings                       │
│     ❌ Shadow state reporting                                  │
│                                                                 │
│  ❌ 5. LOGGING & MONITORING                                    │
│     ✅ Console logging with prefixes                           │
│     ❌ Device log upload to S3                                 │
│     ❌ Playback log tracking & upload                          │
│     ❌ Screenshot capture & upload                             │
│     ❌ Log level control from cloud                            │
│     ❌ Online/offline detection                                │
│                                                                 │
│  ❌ 6. SCHEDULER / BACKGROUND TASKS                            │
│     ❌ Token refresh scheduling                                │
│     ❌ Daily reboot / SW update / FW update                    │
│     ❌ Display on/off timers                                   │
│     ❌ Log upload intervals                                    │
│     ❌ Connectivity probing                                    │
│                                                                 │
│  ✅ 7. LOCAL STORAGE                                           │
│     ✅ Content directory management                            │
│     ✅ Activation config persistence                           │
│     ❌ Full settings persistence                               │
│                                                                 │
│  N/A 8. RENDERING (External — not part of player)              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints Reference

The player exposes a local HTTP server for integration with rendering apps and management tools.

```
┌─────────────────────────────────────────────────────────────────┐
│                    HTTP Server (port 3001)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GET  /system/info          → Serial, CPU, OS, player type      │
│  GET  /health               → MQTT status, timestamp            │
│  POST /activate             → Activate with invite code         │
│  POST /reset                → Clear device config               │
│  POST /channel/download     → Download channel + content        │
│  POST /channel/save         → Save channel ZIP to disk          │
│  GET  /network/config       → Network config (stub)             │
│  GET  /network/interfaces   → Network interfaces (stub)         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Point: Rendering App

The rendering app is decoupled from the player. It interacts only through the filesystem.

```
┌──────────────────┐                    ┌──────────────────────┐
│                  │   reads            │                      │
│  Headless Player │──────────────────> │  Content Directory   │
│                  │   writes           │                      │
│  • Downloads     │                    │  • current-channel   │
│  • Extracts      │                    │    .json             │
│  • Manages       │                    │  • {id}.{ver}/       │
│                  │                    │    ├── channel.json   │
└──────────────────┘                    │    ├── Deployment.xml │
                                        │    ├── {id}.mp4      │
                                        │    ├── {id}.jpg      │
┌──────────────────┐                    │    ├── {id}.json     │
│                  │   reads            │    └── ...            │
│  Rendering App   │<───────────────────│                      │
│  (Partner)       │   monitors         └──────────────────────┘
│                  │
│  • Watches current-channel.json for changes
│  • Reads content files from channel directory
│  • Renders video, images, playlists, HTML
│  • Manages display output
│
└──────────────────┘
```
