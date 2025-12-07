# Version 2.0.0 - Browser Player (BrightSign Spoofing)

## Why Version 2.0.0 and BrightSign?

The browser player uses `playerType: "BrightSign"` and `version: "2.0.0"` to leverage existing cloudFeatures.json configuration without requiring backend changes.

## CloudFeatures.json Overview

The CloudFeatures.json file is the **source of truth** for all player capabilities and features. It's located at:
- **Repository:** https://gitlab.com/poppulo/FWI/development/Cloud/configurations/-/blob/master/cloudFeatures.json
- **S3 Bucket:** `fwi-cloud-player-config-{region}`
- **API Endpoint:** `GET /device-management/v1/companies/:companyId/player-features`

## How It Works

When a device activates and provisions, the server receives:
```javascript
{
  playerType: 'BrightSign',  // Spoofs BrightSign to use existing cloudFeatures.json entry
  playerVersion: '2.0.0',    // Uses existing BrightSign 2.0.0 configuration
  makeModel: 'GenuineIntel Intel(R) Core(TM) Ultra 9 185H',  // Actual system info
  os: 'Windows 11 Home'      // Actual OS
}
```

The backend looks up `cloudFeatures.json[playerType][playerVersion]` to determine:

1. **Supported Commands** - Which cloud commands the device can execute (Reboot, ClearCache, etc.)
2. **Device Configuration** - Which settings are available in the UI
3. **Device Logs** - Whether log viewing is enabled
4. **Channels Supported** - Which channel types can be assigned (standard, simple, daily)
5. **Preview Links** - Environment-specific preview URLs
6. **Mixers Supported** - Which mixer types are available

## CloudFeatures.json Structure

The browser player uses the existing BrightSign entry:

```json
{
  "BrightSign": {
    "2.0.0": {
      "commandsSupported": ["RunScript", "CheckDeployment", "ClearCache", "Reboot"],
      "deviceConfiguration": true,
      "deviceConfigurationUiOrder": [...],
      "deviceLogs": true,
      "channelsSupported": ["standard", "simple", "daily"],
      "previewLinks": {
        "cloudtest1": "https://cloudtest1.fwi-dev.com/cpweb/",
        ...
      },
      "mixersSupported": ["standard"]
    }
  }
}
```

## Why Spoof BrightSign?

1. **No Backend Changes Required** - Uses existing cloudFeatures.json entry
2. **Deployment URL Support** - Can set custom deployment URLs via BrightSign configuration
3. **Feature Compatibility** - Gets all BrightSign features (commands, logs, channels)
4. **Faster Development** - No need to coordinate with DS-Cloud team for new player type
5. **Testing Flexibility** - Can test immediately without waiting for cloudFeatures.json updates

## Feature Compatibility

By using BrightSign 2.0.0, the browser player inherits these features:

### Features from BrightSign 2.0.0:
- ✅ **Commands:** RunScript, CheckDeployment, ClearCache, Reboot
- ✅ **Device Configuration:** Full UI with reboot scheduling, log levels, display settings
- ✅ **Device Logs:** Log viewing enabled in UI
- ✅ **Channels:** Standard, Simple, and Daily channel types
- ✅ **Preview Links:** Environment-specific deployment URLs
- ✅ **Mixers:** Standard mixer support

### What Works Differently:
- **Hardware Features:** Browser player ignores BrightSign-specific hardware features (GPIO, serial ports)
- **System Info:** Reports actual Windows/Linux system info (CPU, OS) instead of BrightSign hardware
- **Network Config:** Uses localhost Node server instead of BrightSign native APIs
- **Content Storage:** Saves to local filesystem via Node server

### UI Impact:
When viewing the browser player in Cloud UI:
- **Device Module:** Shows as "BrightSign" player with version 2.0.0
- **Channel Module:** Device appears in "Add Device" list for all supported channel types
- **Configuration:** Shows BrightSign configuration options (some may not apply)
- **Deployment URL:** Can be set via BrightSign configuration schema

## Version Compatibility Rules

### Semantic Versioning: Major.Minor.Patch

- **Patch updates (6.0.0 → 6.0.1)** - Fully compatible, no cloudFeatures.json update needed
- **Minor updates (6.0.0 → 6.1.0)** - Breaking changes, requires new entry in cloudFeatures.json
- **Major updates (6.0.0 → 7.0.0)** - Breaking changes, requires new entry in cloudFeatures.json

### What Happens with Missing Versions?

If you activate a player with version `6.1.0` but only `6.0.0` exists in cloudFeatures.json:

✅ **Still Works:**
- Device activation succeeds
- Channel assignment via Device Module works
- Basic functionality remains

❌ **Breaks:**
- Device won't appear in Channel Module's "Add Device" list
- Pending devices can't be assigned the new version
- Configuration UI may be missing or incorrect

## Version History Context

- **< 2.0** - Legacy platform-specific implementations
- **2.0.x** - Monorepo with device-specific code
- **Browser Player** - Uses BrightSign 2.0.0 for cloudFeatures.json compatibility

## Important Notes

⚠️ **Do not change playerType or version** without verifying cloudFeatures.json
- Must use `playerType: "BrightSign"` and `version: "2.0.0"`
- Changing these values may cause activation failures or missing features
- Device won't appear in Channel Module if version is missing
- Configuration schemas are tied to specific player types and versions

✅ **Current Configuration**
- `playerType: "BrightSign"` - Spoofs BrightSign for compatibility
- `version: "2.0.0"` - Uses existing BrightSign 2.0.0 cloudFeatures.json entry
- Actual system info (CPU, OS) is still collected and sent for reporting

## Future: Adding Dedicated Player Type

If/when we want to stop spoofing BrightSign and add a dedicated "Windows" or "Browser" player type:

1. **Contact DS-Cloud Team:**
   - Scott Wieseler
   - Qiang Cui
   - Jessica Henning
   - Rachel Koldenhoven

2. **Update cloudFeatures.json:**
   - Add new version entry under "Windows" key
   - Copy/paste existing version and modify as needed
   - Test in lower environments first (cloudtest1, cloudtest2)

3. **Create Configuration Schema:**
   - Add new schema file: `Windows/Settings/6.1.0.json`
   - Defines available configuration options for the version

4. **Deployment Order:**
   - Test environments: Upload manually to S3 for testing
   - Staging/Production: Merge to master in configurations repo
   - Deploy configurations repo pipeline (managed by DevOps)

5. **Timing Considerations:**
   - New versions can be added before GA release for testing
   - Don't update `previewLinks` URLs until CPWeb GA is deployed
   - Schema files should deploy close to Core release dates

## Related Files

### Local Codebase
- `device_browser/src/Browser.ts` - Player type detection (Windows/Linux)
- `core/src/MQTT/Activation.ts` - Sends player info during provisioning
- `device_browser/server.js` - Collects system information
- Environment variable: `VERSION=6.0.0`

### Cloud Configuration
- **cloudFeatures.json** - https://gitlab.com/poppulo/FWI/development/Cloud/configurations/-/blob/master/cloudFeatures.json
- **Configuration Schemas** - `Windows/Settings/{version}.json` in configurations repo
- **S3 Bucket** - `fwi-cloud-player-config-{region}`

## References

- [CloudFeatures.json Documentation](https://poppulo.atlassian.net/wiki/spaces/TT/pages/cloudfeatures) (Internal)
- [Configurations Repository](https://gitlab.com/poppulo/FWI/development/Cloud/configurations)
- [Harmony Signage Player Example](https://gitlab.com/poppulo/FWI/development/Cloud/configurations/-/merge_requests/harmony-example)
