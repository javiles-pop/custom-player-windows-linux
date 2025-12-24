# MQTT Architecture - Device Browser

This document outlines how the device_browser uses MQTT for device activation, provisioning, and ongoing management with Poppulo's Harmony cloud platform.

## Overview

The device_browser implements a two-phase MQTT communication system:
1. **Unauthenticated Phase**: Device activation and provisioning
2. **Authenticated Phase**: Ongoing device management and real-time communication

The system uses **AWS IoT Core** as the MQTT broker with **AWS Cognito** for authentication.

## Architecture Components

### Required Dependencies

**AWS SDK Dependencies:**
```json
{
  "amazon-cognito-identity-js": "^4",
  "aws-iot-device-sdk-v2": "^1.21.2",
  "aws-sdk": "^2.656.0"
}
```

**Key Libraries:**
- `aws-iot-device-sdk-v2` - AWS IoT Device SDK v2 with MQTT5 client support
- `amazon-cognito-identity-js` - AWS Cognito authentication for user pool management
- `aws-sdk` - AWS SDK for Cognito Identity Pool and credential management

### Implementation Notes

**Critical Implementation Details:**

1. **Use Correct SDK Version**: Browser uses `aws-iot-device-sdk-browser`, headless uses `aws-iot-device-sdk-v2`
   ```javascript
   // ✅ BROWSER - Browser version
   import { device } from 'aws-iot-device-sdk-browser';
   
   // ✅ HEADLESS - Node.js v2 version
   const { mqtt5, iot, auth } = require('aws-iot-device-sdk-v2');
   
   // ❌ WRONG - Node.js v1 version (incompatible with headless)
   import { device } from 'aws-iot-device-sdk';
   ```

2. **AWS SDK v2 Required**: Must use AWS SDK v2, not v3 (v3 has different API structure)
   ```javascript
   // ✅ CORRECT - v2 syntax
   import * as AWS from 'aws-sdk/global';
   import CognitoIdentity from 'aws-sdk/clients/cognitoidentity';
   
   // ❌ WRONG - v3 syntax (different imports/API)
   import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
   ```

3. **Cognito Identity vs User Pool**: Two different services with different purposes
   ```javascript
   // Cognito Identity Pool (unauthenticated access)
   const config = new AWS.CognitoIdentityCredentials({
     IdentityPoolId: 'us-east-1:pool-id'
   });
   
   // Cognito User Pool (authenticated access)
   const userPool = new CognitoUserPool({
     UserPoolId: 'us-east-1_XXXXXXX',
     ClientId: 'client-id'
   });
   ```

4. **WebSocket Protocol**: MQTT over WebSockets for browser compatibility
   ```javascript
   const options = {
     protocol: 'wss', // WebSocket Secure - required for browsers
     host: 'iot-endpoint.amazonaws.com',
     // ... other options
   };
   ```

**Common Pitfalls:**
- Using Node.js SDK in browser environment (causes build failures)
- Mixing AWS SDK v2 and v3 syntax (incompatible APIs)
- Forgetting WebSocket protocol (browsers can't use raw TCP)
- Incorrect Cognito service usage (Identity Pool vs User Pool confusion)

### Core Files
- `core/src/MQTT/index.ts` - Main MQTT connection management
- `core/src/MQTT/Activation.ts` - Device activation and provisioning
- `core/src/MQTT/MessageRouter.ts` - Message routing and handling
- `core/src/MQTT/Shadow.ts` - Device shadow management
- `core/src/MQTT/Commands.ts` - Remote command execution
- `device_browser/src/Browser.ts` - Device API implementation
- `device_browser/server.js` - Node server for channel downloads

## Phase 1: Device Activation & Provisioning

### Initial Connection Setup

```javascript
// Create unauthenticated MQTT connection
const config = createInitialAWSConfig(AWSSettings);
const credentials = await getUnauthenticatedCognitoIdentity(config.credentials);
const mqtt = createMQTTConnection(clientID, config, AWSSettings, credentials);
```

### Auto-Activation (Serial Number)

**Process:**
1. Device detects system serial number
2. Publishes provisioning request to `fwi/provision`
3. Subscribes to `fwi/provision/${serialNumber}` for response

**Payload:**
```json
{
  "env": "dev|staging|prod",
  "hardwareNumbers": ["SERIAL123"],
  "playerType": "BrightSign",
  "makeModel": "Intel Core i7",
  "os": "Windows 11",
  "playerVersion": "2.0.0"
}
```

### Manual Activation (Invite Code)

**Process:**
1. User enters invite code in UI
2. Publishes provisioning request with invite code
3. Subscribes to `fwi/provision/${inviteCode}` for response

**Payload:**
```json
{
  "env": "dev|staging|prod",
  "inviteCode": "ABC123",
  "playerType": "BrightSign",
  "makeModel": "Intel Core i7",
  "os": "Windows 11",
  "playerVersion": "2.0.0"
}
```

### Provisioning Response

**Success Response:**
```json
{
  "deviceId": "device-uuid",
  "companyId": "company-uuid",
  "cognitoUserPoolId": "us-east-1_XXXXXXX",
  "cognitoClientId": "client-id",
  "key": "encrypted-password"
}
```

**Error Response:**
```json
{
  "error": "HARDWARE_NUMBER_ERROR|INVITE_CODE_ERROR|NOT_PENDING_STATE"
}
```

## Phase 2: Authenticated Connection

### Cognito Authentication

```javascript
// Create Cognito user pool connection
const userPool = new CognitoUserPool({
  UserPoolId: provisionedPayload.cognitoUserPoolId,
  ClientId: provisionedPayload.cognitoClientId
});

// Authenticate with decrypted password
const decryptedKey = decrypt(provisionedPayload.key, provisionedPayload.companyId);
const authDetails = new AuthenticationDetails({
  Username: provisionedPayload.deviceId,
  Password: decryptedKey
});

cognitoUser.authenticateUser(authDetails, {
  onSuccess: (session) => {
    // Create authenticated MQTT connection
    const mqtt = createMQTTConnection(deviceId, config, AWSSettings, credentials);
  }
});
```

### Topic Subscriptions

Once authenticated, the device subscribes to:

| Topic | Purpose |
|-------|---------|
| `$aws/things/${deviceId}/shadow/update/delta` | Configuration changes |
| `fwi/${companyId}/broadcast` | Company-wide messages |
| `fwi/${companyId}/${deviceId}` | Device-specific commands |
| `$aws/things/${deviceId}/shadow/get/#` | Initial shadow state |

## Device Shadow Management

### Reporting Current State

The device regularly reports its current configuration to the cloud:

```javascript
mqtt.publish(`$aws/things/${deviceId}/shadow/update`, {
  state: {
    reported: {
      CurrentURL: "https://cloudtest1.fwi-dev.com/channels/uuid",
      AccessCode: "1234",
      Resolution: "1920x1080@60",
      Orientation: "0 Degrees",
      LogLevel: "WARN",
      WebPlayerURL: "https://cpweb.fwicloud.com",
      TimeZone: "MST",
      CECEnabled: false,
      EnableOnOffTimers: false,
      // ... additional settings
    }
  }
});
```

### Receiving Configuration Updates

Cloud sends configuration changes via shadow deltas:

```javascript
// Example delta message
{
  "state": {
    "CurrentURL": "https://cloudtest1.fwi-dev.com/channels/new-uuid",
    "Resolution": "1280x720@60",
    "LogLevel": "DEBUG"
  }
}
```

**Handled Settings:**
- `CurrentURL` - Channel assignment
- `WebPlayerURL` - CP Web base URL
- `Resolution` - Display resolution
- `Orientation` - Screen rotation
- `LogLevel` - Logging verbosity
- `AccessCode` - Menu access code
- `Proxy` - Network proxy settings
- `TimeZone` - Device timezone
- `CECEnabled` - CEC control
- `EnableOnOffTimers` - Power scheduling

## Channel Management

### Channel Assignment

Channels are assigned via shadow updates:

```javascript
// Shadow delta with new channel
{
  "state": {
    "channel": {
      "id": "channel-uuid",
      "channelType": "cloud"
    }
  }
}
```

### Download Process

1. **MQTT Trigger**: Shadow update triggers channel assignment
2. **Browser Message**: Posts message to Node server
3. **API Call**: Server fetches channel download URL
4. **Content Download**: Downloads and extracts channel ZIP
5. **Asset Processing**: Downloads all referenced media files
6. **Cleanup**: Removes old channel versions
7. **Tracker Update**: Creates `current-channel.json`

```javascript
// Channel download API call
POST /channel/download
{
  "channelId": "channel-uuid",
  "companyId": "company-uuid", 
  "token": "bearer-token"
}
```

### Content Types Supported

- **Simple Channels**: Single video/image content
- **Daily Channels**: Multiple content items in sequence
- **Content Experience Builder**: Full design tool with playlists
- **Playlists**: JSON playlists with referenced media
- **Multi-format**: Videos, images, audio, documents, fonts, .dsapp

## Remote Command Execution

### Command Structure

```javascript
{
  "command": "playerCommand",
  "commandName": "CommandType",
  "commandId": "unique-id",
  "attributes": {
    // Command-specific parameters
  }
}
```

### Supported Commands

| Command | Description | Response |
|---------|-------------|----------|
| `Reboot` | Restart device | SUCCESS/FAIL |
| `RunScript` | Execute custom script | SUCCESS/FAIL |
| `ClearCache` | Clear local cache | SUCCESS/FAIL |
| `CheckDeployment` | Refresh channel | SUCCESS/FAIL |
| `SendReaderId` | Update device info | Device attributes |
| `screenshot` | Capture screen | Image upload |

### Command Confirmation

```javascript
// Command confirmation response
mqtt.publish(`fwi/${companyId}/attributes`, {
  commandId: "cmd-123",
  status: "SUCCESS|FAIL",
  message: "Optional error message"
});
```

## Device Attributes Publishing

### Regular Status Updates

```javascript
mqtt.publish(`fwi/${companyId}/attributes`, {
  env: "dev|staging|prod",
  deviceId: "device-uuid",
  attributes: {
    adapters: {
      "eth0": {
        description: "",
        ipv4: "192.168.1.100",
        ipv6: "",
        ipv6LinkLocal: "",
        macAddress: "00:11:22:33:44:55"
      }
    },
    ip: "192.168.1.100",
    macAddresses: ["00:11:22:33:44:55"],
    makeModel: "Intel Core i7-8700K",
    os: "Windows 11 Pro",
    playerType: "BrightSign",
    playerVersion: "2.0.0.1",
    serialNumber: "SERIAL123"
  }
});
```

## Connection Management

### Event Handling

```javascript
mqtt.on('connect', () => {
  Logger.debug('[MQTT] Connection to Harmony established.');
  store.dispatch(setConnectedToCloud(true));
});

mqtt.on('close', () => {
  Logger.warn('[MQTT] Connection to Harmony closed');
  store.dispatch(setConnectedToCloud(false));
  teardownMQTTConnection();
});

mqtt.on('message', (topic, message) => {
  MessageRouter(topic, message);
});

mqtt.on('error', (error) => {
  Logger.error('[MQTT] Connection error:', error);
  teardownMQTTConnection();
});
```

### Token Management

```javascript
// Automatic token refresh (5 minutes before expiration)
runTaskAtTime(() => {
  refreshAccessToken(user, session);
}, fromUnixTime(exp - 300), 'Refresh Token');
```

### Connection Recovery

- **Automatic Reconnection**: Built-in reconnection with exponential backoff
- **Network Change Detection**: Monitors network interface changes
- **Graceful Degradation**: Continues operation during temporary disconnections

## BrightSign Compatibility

### Player Type Spoofing

The device reports as `playerType: "BrightSign"` to maintain compatibility with existing cloud infrastructure:

```javascript
getManufacturer() {
  return DeviceManufacturer.BrightSign;
}
```

**Benefits:**
- Access to all BrightSign cloudFeatures.json configurations
- Compatibility with existing device management workflows
- No backend changes required for deployment

### Version Reporting

- **Player Version**: Always reports as "2.0.0" for consistency
- **Build Number**: Incremented for tracking (dev/staging/prod)

## Environment Configuration

### Development Setup

**CloudTest1 (Primary Development):**
```bash
export ENVIRONMENT=dev
export CLOUD_ENV=cloudtest1
export VERSION=2.0.0
export BUILD_NUMBER=dev
```

**CloudTest2 (Secondary Development):**
```bash
export ENVIRONMENT=dev
export CLOUD_ENV=cloudtest2
export VERSION=2.0.0
export BUILD_NUMBER=dev
```

**Other Development Environments:**
```bash
# Contributor
export ENVIRONMENT=dev
export CLOUD_ENV=contributor

# Admin
export ENVIRONMENT=dev
export CLOUD_ENV=admin

# Network
export ENVIRONMENT=dev
export CLOUD_ENV=network
```

### Staging Setup

```bash
export ENVIRONMENT=staging
export VERSION=2.0.0
export BUILD_NUMBER=staging
```

### Production Setup

**US Production:**
```bash
export ENVIRONMENT=prod
export VERSION=2.0.0
export BUILD_NUMBER=1
```

**EU Production:**
```bash
export ENVIRONMENT=prod-eu
export VERSION=2.0.0
export BUILD_NUMBER=1
```

**AP Production:**
```bash
export ENVIRONMENT=prod-ap
export VERSION=2.0.0
export BUILD_NUMBER=1
```

### Environment Endpoints

| Environment Key | Environment ID | API Base URL | Whitelist Domain |
|----------------|----------------|--------------|------------------|
| `test` | `test` | `https://api-test.fwi-dev.com` | `api-test.fwi-dev.com` |
| `staging` | `staging` | `https://api-staging.fwi-dev.com` | `api-staging.fwi-dev.com` |
| `us` | `prod` | `https://api.fwicloud.com` | `api.fwicloud.com` |
| `eu` | `prod-eu` | `https://api.eu1.fwicloud.com` | `api.eu1.fwicloud.com` |
| `ap` | `prod-ap` | `https://api.ap1.fwicloud.com` | `api.ap1.fwicloud.com` |
| `pen` | `pentest` | `https://pentest-api.fwicloud.com` | `pentest-api.fwicloud.com` |
| `contributor` | `dev` | `https://api-contributor.fwi-dev.com` | `api-contributor.fwi-dev.com` |
| `admin` | `dev` | `https://api-admin.fwi-dev.com` | `api-admin.fwi-dev.com` |
| `lighthouse` | `dev` | `https://api-lighthouse.fwi-dev.com` | `api-lighthouse.fwi-dev.com` |
| `network` | `dev` | `https://api-network.fwi-dev.com` | `api-network.fwi-dev.com` |
| `cloudtest1` / `ct1` | `dev` | `https://api-cloudtest1.fwi-dev.com` | `api-cloudtest1.fwi-dev.com` |
| `cloudtest2` / `ct2` | `dev` | `https://api-cloudtest2.fwi-dev.com` | `api-cloudtest2.fwi-dev.com` |

### Environment Categories

**Production Environments:**
- `us` - Production US (default production)
- `eu` - Production Europe (Ireland)
- `ap` - Production Asia-Pacific (Singapore)

**Development Environments:**
- `cloudtest1` / `ct1` - Primary development testing
- `cloudtest2` / `ct2` - Secondary development testing
- `contributor` - Contributor development
- `admin` - Admin development
- `lighthouse` - Lighthouse development
- `network` - Network development

**Testing Environments:**
- `test` - General testing
- `staging` - Pre-production staging
- `pen` - Penetration testing

## Security Considerations

### Authentication Flow
1. **Unauthenticated**: Temporary Cognito Identity credentials
2. **Provisioning**: Device registration with cloud validation
3. **Authenticated**: Full Cognito User Pool authentication
4. **Encrypted Communication**: All MQTT traffic over WSS (WebSocket Secure)

### Key Management
- **Device Password**: Encrypted with company-specific key
- **Token Refresh**: Automatic renewal before expiration
- **Credential Rotation**: Handled by AWS Cognito

## Troubleshooting

### Common Issues

**Connection Failures:**
- Verify environment variables are set correctly
- Check network connectivity and firewall settings
- Ensure correct company type (CloudTest vs Production)

**Activation Errors:**
- `HARDWARE_NUMBER_ERROR`: Serial number not registered
- `INVITE_CODE_ERROR`: Invalid or expired invite code
- `NOT_PENDING_STATE`: Device already activated

**Channel Download Issues:**
- Check bearer token validity
- Verify channel permissions
- Monitor Node server logs for download errors

### Debug Mode

Enable debug logging in development:
```javascript
const options = {
  // ... other options
  debug: process.env.NODE_ENV === 'development'
};
```

### Log Analysis

Key log patterns to monitor:
- `[MQTT] Connection to Harmony established` - Successful connection
- `[ACTIVATION] Device deactivated` - Remote deactivation
- `[SHADOW] Received shadow delta` - Configuration updates
- `[COMMAND] Executing command` - Remote command execution

## Performance Considerations

### Connection Optimization
- **Keep-Alive**: 15-second intervals
- **Reconnection**: 2-second initial delay, 30-second maximum
- **Message Batching**: Shadow updates batched when possible

### Resource Management
- **Memory**: MQTT client cleanup on disconnection
- **Storage**: Automatic cleanup of old channel versions
- **Network**: Efficient delta-only shadow updates

## Future Enhancements

### Planned Features
- **Offline Mode**: Local operation during network outages
- **Bandwidth Optimization**: Compressed message payloads
- **Enhanced Security**: Certificate-based authentication
- **Monitoring**: Real-time performance metrics via MQTT

### API Evolution
- **Message Versioning**: Backward-compatible message formats
- **Feature Flags**: Dynamic feature enablement via shadow
- **A/B Testing**: Configuration experiments via cloud control