# AWS IoT MQTT Implementation Guide

## Overview

This guide demonstrates how to implement AWS IoT MQTT connectivity using Cognito Identity for anonymous authentication, based on the Poppulo Player implementation.

## Architecture Flow

```
Browser App → Cognito Identity → Temporary Credentials → AWS IoT MQTT
```

## Implementation Steps

### 1. Prerequisites

```bash
npm install aws-sdk
```

### 2. Get Cognito Identity

```javascript
const AWS = require('aws-sdk');

const cognitoIdentity = new AWS.CognitoIdentity({
  region: 'us-west-2'
});

// Step 1: Get Identity ID
const identityParams = {
  IdentityPoolId: 'us-west-2:ce7432a5-d003-47a1-ab20-e2ecbc7fef83'
};

const identity = await cognitoIdentity.getId(identityParams).promise();
const identityId = identity.IdentityId;
```

### 3. Get Temporary Credentials

```javascript
// Step 2: Get credentials for the identity
const credentialsParams = {
  IdentityId: identityId
};

const credentials = await cognitoIdentity.getCredentialsForIdentity(credentialsParams).promise();

const tempCredentials = {
  accessKeyId: credentials.Credentials.AccessKeyId,
  secretAccessKey: credentials.Credentials.SecretKey,
  sessionToken: credentials.Credentials.SessionToken
};
```

### 4. Create Signed WebSocket URL

```javascript
const crypto = require('crypto');

function createSignedUrl(credentials, region, endpoint) {
  const algorithm = 'AWS4-HMAC-SHA256';
  const service = 'iotdevicegateway';
  const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const date = timestamp.substr(0, 8);
  
  const credentialScope = `${date}/${region}/${service}/aws4_request`;
  const canonicalHeaders = `host:${endpoint}\n`;
  const signedHeaders = 'host';
  
  const canonicalRequest = [
    'GET',
    '/mqtt',
    '',
    canonicalHeaders,
    signedHeaders,
    crypto.createHash('sha256').update('').digest('hex')
  ].join('\n');
  
  const stringToSign = [
    algorithm,
    timestamp,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  ].join('\n');
  
  const signingKey = getSignatureKey(credentials.secretAccessKey, date, region, service);
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  
  const params = new URLSearchParams({
    'X-Amz-Algorithm': algorithm,
    'X-Amz-Credential': `${credentials.accessKeyId}/${credentialScope}`,
    'X-Amz-Date': timestamp,
    'X-Amz-SignedHeaders': signedHeaders,
    'X-Amz-Signature': signature,
    'X-Amz-Security-Token': credentials.sessionToken
  });
  
  return `wss://${endpoint}/mqtt?${params.toString()}`;
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = crypto.createHmac('sha256', 'AWS4' + key).update(dateStamp).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(regionName).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(serviceName).digest();
  return crypto.createHmac('sha256', kService).update('aws4_request').digest();
}
```

### 5. Connect to AWS IoT MQTT

```javascript
const WebSocket = require('ws');

const endpoint = 'a1yww2plasi3h9-ats.iot.us-west-2.amazonaws.com';
const signedUrl = createSignedUrl(tempCredentials, 'us-west-2', endpoint);

const ws = new WebSocket(signedUrl, ['mqtt']);

ws.on('open', () => {
  console.log('Connected to AWS IoT');
});

ws.on('message', (data) => {
  console.log('Received:', data);
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

## Complete Implementation

```javascript
class AWSIoTMQTTClient {
  constructor(identityPoolId, region = 'us-west-2') {
    this.identityPoolId = identityPoolId;
    this.region = region;
    this.cognitoIdentity = new AWS.CognitoIdentity({ region });
  }
  
  async connect() {
    try {
      // Get identity
      const identity = await this.cognitoIdentity.getId({
        IdentityPoolId: this.identityPoolId
      }).promise();
      
      // Get credentials
      const credentials = await this.cognitoIdentity.getCredentialsForIdentity({
        IdentityId: identity.IdentityId
      }).promise();
      
      // Create signed URL
      const endpoint = `a1yww2plasi3h9-ats.iot.${this.region}.amazonaws.com`;
      const signedUrl = this.createSignedUrl({
        accessKeyId: credentials.Credentials.AccessKeyId,
        secretAccessKey: credentials.Credentials.SecretKey,
        sessionToken: credentials.Credentials.SessionToken
      }, endpoint);
      
      // Connect WebSocket
      this.ws = new WebSocket(signedUrl, ['mqtt']);
      
      return new Promise((resolve, reject) => {
        this.ws.on('open', () => resolve());
        this.ws.on('error', reject);
      });
      
    } catch (error) {
      throw new Error(`AWS IoT connection failed: ${error.message}`);
    }
  }
  
  createSignedUrl(credentials, endpoint) {
    // Implementation from step 4
  }
}

// Usage
const client = new AWSIoTMQTTClient('us-west-2:ce7432a5-d003-47a1-ab20-e2ecbc7fef83');
await client.connect();
```

## Key Configuration

### Environment Variables
- `ENVIRONMENT`: `dev` | `staging` | `prod` | `prod-ap` | `prod-eu`
- `CLOUD_ENV`: `cloudtest1` | `cloudtest2` (dev only)

### Identity Pool IDs
- **CloudTest1**: `us-west-2:ce7432a5-d003-47a1-ab20-e2ecbc7fef83`
- **Production**: Use production-specific identity pool

### IoT Endpoints
- **CloudTest1**: `a1yww2plasi3h9-ats.iot.us-west-2.amazonaws.com`
- **Production**: Environment-specific endpoints

## Security Best Practices

1. **Use temporary credentials** - Never hardcode AWS keys
2. **Implement credential refresh** - Cognito credentials expire
3. **Validate SSL certificates** - Always use WSS protocol
4. **Handle connection failures** - Implement retry logic
5. **Monitor connection health** - Use ping/pong frames

## Error Handling

```javascript
ws.on('error', (error) => {
  if (error.code === 'ECONNREFUSED') {
    // Retry connection
  } else if (error.message.includes('403')) {
    // Refresh credentials
  }
});
```

## Testing

Use CloudTest1 environment for development:
- Company account: CloudTest1 company
- API endpoint: `https://api-cloudtest1.fwi-dev.com`
- Identity pool: CloudTest1 pool ID

## Troubleshooting

- **403 Forbidden**: Check identity pool permissions
- **Connection timeout**: Verify network connectivity
- **Invalid signature**: Ensure correct timestamp and credentials
- **WebSocket errors**: Check endpoint URL format