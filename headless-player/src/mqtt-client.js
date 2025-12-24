const AWS = require('aws-sdk');
const { CognitoUserPool, AuthenticationDetails, CognitoUser } = require('amazon-cognito-identity-js');
const fetch = require('node-fetch');
const { mqtt5, iot, auth } = require('aws-iot-device-sdk-v2');
const AES = require('crypto-js/aes');
const Utf8 = require('crypto-js/enc-utf8');

class MQTTClient {
  constructor(deviceManager, channelManager) {
    this.deviceManager = deviceManager;
    this.channelManager = channelManager;
    this.mqtt = null;
    this.isConnectedFlag = false;
    this.provisionedDevice = null;
    this.cognitoSession = null; // Store session for reuse
    this.currentToken = null; // Store fresh token from broadcast
  }

  async connect() {
    try {
      const config = this.deviceManager.loadConfig();
      
      // Check if device is already activated
      if (config.activated) {
        console.log('Device already activated, connecting with saved credentials');
        this.provisionedDevice = config.provisionedDevice;
        try {
          await this.connectAuthenticated();
          return;
        } catch (error) {
          // If authentication fails (user deleted), clear config and restart
          if (error.code === 'UserNotFoundException') {
            console.log('Device user no longer exists in cloud, clearing configuration');
            delete config.provisionedDevice;
            delete config.activated;
            this.deviceManager.saveConfig(config);
            console.log('Configuration cleared. Restarting to re-provision...');
            setTimeout(() => process.exit(0), 1000);
            return;
          }
          throw error;
        }
      }
      
      // Check if device has provisioned info but not activated
      if (config.provisionedDevice) {
        console.log('Found saved device but not activated');
        console.log('\n=== Device needs activation ===');
        console.log('Please activate with invite code using:');
        console.log('POST http://localhost:3001/activate');
        console.log('Body: {"inviteCode": "YOUR_INVITE_CODE"}');
        console.log('\nOr use PowerShell:');
        console.log('irm http://localhost:3001/activate -Method POST -ContentType "application/json" -Body \'{"inviteCode":"YOUR_INVITE_CODE"}\'');
        return;
      }
      
      // No saved device, try auto-provision
      await this.provision();
    } catch (error) {
      console.error('MQTT connection failed:', error);
      throw error;
    }
  }

  async provision() {
    try {
      const awsSettings = await this.getAWSSettings();
      const serialNumber = this.deviceManager.getSerialNumber();
      
      // Set up AWS config like browser version
      AWS.config.region = awsSettings.region;
      AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: awsSettings.cognitoFedPoolId,
      });

      // Get unauthenticated credentials
      const credentials = await new Promise((resolve, reject) => {
        AWS.config.getCredentials((err) => {
          if (err) reject(err);
          else resolve(AWS.config.credentials);
        });
      });

      // Get Cognito Identity credentials
      const cognitoIdentity = new AWS.CognitoIdentity();
      const cognitoCredentials = await new Promise((resolve, reject) => {
        cognitoIdentity.getCredentialsForIdentity(
          { IdentityId: credentials.identityId },
          (err, data) => {
            if (err) reject(err);
            else resolve(data);
          }
        );
      });

      // Create credentials provider
      const credentialsProvider = auth.AwsCredentialsProvider.newStatic(
        cognitoCredentials.Credentials.AccessKeyId,
        cognitoCredentials.Credentials.SecretKey,
        cognitoCredentials.Credentials.SessionToken
      );
      
      // Create MQTT5 client
      const builder = iot.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithSigv4Auth(
        awsSettings.endpointAddress,
        {
          region: awsSettings.region,
          credentialsProvider: credentialsProvider
        }
      );

      builder.withConnectProperties({
        clientId: serialNumber,
        keepAliveIntervalSeconds: 15
      });

      const config = builder.build();
      this.mqtt = new mqtt5.Mqtt5Client(config);

      this.setupMQTTHandlers();
      
      console.log('Starting MQTT5 client for auto-provision...');
      this.mqtt.start();
      
      // Wait for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
        this.mqtt.on('connectionSuccess', () => {
          clearTimeout(timeout);
          resolve();
        });
        this.mqtt.on('connectionFailure', (event) => {
          clearTimeout(timeout);
          reject(new Error(`Connection failed: ${event.error}`));
        });
      });

      // Subscribe and publish for auto-provision
      await this.mqtt.subscribe({
        subscriptions: [{
          topicFilter: `fwi/provision/${serialNumber}`,
          qos: mqtt5.QoS.AtLeastOnce
        }]
      });

      const systemInfo = await this.deviceManager.getSystemInfo();
      const provisionPayload = {
        env: process.env.ENVIRONMENT || 'dev',
        hardwareNumbers: [serialNumber],
        playerType: 'BrightSign',
        makeModel: systemInfo.makeModel,
        os: systemInfo.operatingSystem,
        playerVersion: '2.0.0'
      };

      console.log(`Auto-provisioning device with serial: ${serialNumber}`);
      await this.mqtt.publish({
        topicName: 'fwi/provision',
        payload: JSON.stringify(provisionPayload),
        qos: mqtt5.QoS.AtLeastOnce
      });
      
    } catch (error) {
      console.error('Provisioning failed:', error);
      throw error;
    }
  }

  async connectAuthenticated() {
    try {
      const awsSettings = await this.getAWSSettings();
      
      // Get authenticated Cognito session and store it
      const [user, session] = await this.getAuthenticatedCognitoSession(this.provisionedDevice);
      this.cognitoSession = session; // Store for reuse
      console.log('Got authenticated Cognito session');
      
      // Get authenticated credentials
      const authenticatedCredentials = await this.getAuthenticatedCognitoIdentity(
        session,
        this.provisionedDevice.cognitoUserPoolId,
        awsSettings
      );
      
      // Create credentials provider directly from authenticated credentials
      const credentialsProvider = auth.AwsCredentialsProvider.newStatic(
        authenticatedCredentials.accessKeyId,
        authenticatedCredentials.secretAccessKey,
        authenticatedCredentials.sessionToken
      );
      
      // Create MQTT5 client with authenticated credentials
      const builder = iot.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithSigv4Auth(
        awsSettings.endpointAddress,
        {
          region: awsSettings.region,
          credentialsProvider: credentialsProvider
        }
      );

      builder.withConnectProperties({
        clientId: this.provisionedDevice.deviceId,
        keepAliveIntervalSeconds: 15
      });

      const config = builder.build();
      this.mqtt = new mqtt5.Mqtt5Client(config);

      this.setupMQTTHandlers();
      
      console.log('Starting authenticated MQTT5 client...');
      this.mqtt.start();
      
      // Wait for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
        this.mqtt.on('connectionSuccess', () => {
          clearTimeout(timeout);
          resolve();
        });
        this.mqtt.on('connectionFailure', (event) => {
          clearTimeout(timeout);
          reject(new Error(`Connection failed: ${event.error}`));
        });
      });
      
      // Subscribe to device topics and publish attributes
      await this.subscribeToDeviceTopics();
      
      console.log('MQTT connected and authenticated');
      
    } catch (error) {
      console.error('Authenticated connection failed:', error);
      throw error;
    }
  }

  setupMQTTHandlers() {
    this.mqtt.on('connectionSuccess', (event) => {
      console.log('[MQTT] Connection to Harmony established.');
      this.isConnectedFlag = true;
    });

    this.mqtt.on('disconnection', (event) => {
      console.log('[MQTT] Connection to Harmony closed');
      this.isConnectedFlag = false;
    });

    this.mqtt.on('connectionFailure', (event) => {
      console.error('[MQTT] Connection to Harmony Error:', event.error);
      this.isConnectedFlag = false;
    });

    this.mqtt.on('messageReceived', (event) => {
      const message = event.message;
      const payload = message.payload ? Buffer.from(message.payload).toString('utf-8') : '';
      console.log(`[MQTT] Incoming message on topic ${message.topicName}: ${payload}`);
      this.handleMessage(message.topicName, payload);
    });
  }



  async handleMessage(topic, message) {
    try {
      const data = JSON.parse(message);
      
      console.log(`[DEBUG] Topic: ${topic}, Current invite code: ${this.currentInviteCode}`);
      
      if (topic.includes('/shadow/update/delta')) {
        await this.handleShadowDelta(data);
      } else if (topic.includes('/provision/')) {
        console.log(`[PROVISION] MQTT Message: ${message}`);
        await this.handleProvisionResponse(data);
      } else if (topic.includes('/activate/')) {
        console.log(`[ACTIVATION] MQTT Message: ${message}`);
        await this.handleActivationResponse(data);
      } else if (topic.includes('/broadcast') || topic.endsWith(this.provisionedDevice?.deviceId)) {
        // Handle token broadcasts
        if (data.token) {
          console.log('Received fresh token via broadcast');
          this.currentToken = data.token;
        } else {
          await this.handleCommand(data);
        }
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  }

  async handleProvisionResponse(data) {
    if (data.error) {
      console.error('[PROVISION] Provisioning error:', data.error);
      
      // If auto-provision failed, prompt for invite code
      if (data.error.includes('Device could not be found') || data.error.includes('Unable to provision')) {
        console.log('\n=== Auto-provision failed ===');
        console.log('Please activate with invite code using:');
        console.log('POST http://localhost:3001/activate');
        console.log('Body: {"inviteCode": "YOUR_INVITE_CODE"}');
      }
      return;
    }

    console.log('[PROVISION] Device provisioned successfully');
    this.provisionedDevice = data;
    
    // Save provisioned device info
    const config = this.deviceManager.loadConfig();
    config.provisionedDevice = data;
    this.deviceManager.saveConfig(config);

    // Get authenticated session and send activation payload
    try {
      const awsSettings = await this.getAWSSettings();
      const [user, session] = await this.getAuthenticatedCognitoSession(this.provisionedDevice);
      console.log('Got authenticated Cognito session');
      
      const authenticatedCredentials = await this.getAuthenticatedCognitoIdentity(
        session,
        this.provisionedDevice.cognitoUserPoolId,
        awsSettings
      );
      
      const identityId = authenticatedCredentials.identityId;
      const activationPayload = {
        env: process.env.ENVIRONMENT || 'dev',
        inviteCode: this.currentInviteCode,
        deviceId: this.provisionedDevice.deviceId,
        principal: identityId,
        companyId: this.provisionedDevice.companyId
      };
      
      console.log(`[ACTIVATION] sending activation payload: ${JSON.stringify(activationPayload)}`);
      
      await this.mqtt.subscribe({
        subscriptions: [{
          topicFilter: `fwi/activate/${this.currentInviteCode}`,
          qos: mqtt5.QoS.AtLeastOnce
        }]
      });
      
      await this.mqtt.publish({
        topicName: 'fwi/activate',
        payload: JSON.stringify(activationPayload),
        qos: mqtt5.QoS.AtLeastOnce
      });
      
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  }

  async handleActivationResponse(data) {
    if (data.status === 'activated') {
      console.log('Device activated successfully');
      
      // Save activation state
      const config = this.deviceManager.loadConfig();
      config.activated = true;
      this.deviceManager.saveConfig(config);
      
      // Close current connection and reconnect with authenticated credentials
      this.mqtt.stop();
      
      // Wait a moment then reconnect authenticated
      setTimeout(async () => {
        try {
          await this.connectAuthenticated();
        } catch (error) {
          console.error('Failed to reconnect with authenticated credentials:', error);
        }
      }, 1000);
    } else {
      console.error('Activation failed:', data);
    }
  }

  async subscribeToDeviceTopics() {
    try {
      // Subscribe to device-specific topics for ongoing communication
      const deviceId = this.provisionedDevice.deviceId;
      const companyId = this.provisionedDevice.companyId;
      
      const deviceTopics = [
        `$aws/things/${deviceId}/shadow/update/delta`,
        `fwi/${companyId}/broadcast`,
        `fwi/${companyId}/${deviceId}`,
        `$aws/things/${deviceId}/shadow/get/#`
      ];
      
      for (const topic of deviceTopics) {
        await this.mqtt.subscribe({
          subscriptions: [{
            topicFilter: topic,
            qos: mqtt5.QoS.AtLeastOnce
          }]
        });
        console.log(`[MQTT] Subscribed to ${topic}`);
      }
      
      // Publish device attributes
      await this.publishDeviceAttributes();
      
      console.log('Device fully activated and ready for commands');
      
    } catch (error) {
      console.error('Failed to subscribe to device topics:', error);
    }
  }

  async getAuthenticatedCognitoSession(provisionedDevice) {
    return new Promise((resolve, reject) => {
      try {
        const userPool = new CognitoUserPool({
          UserPoolId: provisionedDevice.cognitoUserPoolId,
          ClientId: provisionedDevice.cognitoClientId
        });

        const cognitoUser = new CognitoUser({
          Username: provisionedDevice.deviceId,
          Pool: userPool
        });

        const decryptedKey = this.decrypt(provisionedDevice.key, provisionedDevice.companyId);
        const authDetails = new AuthenticationDetails({
          Username: provisionedDevice.deviceId,
          Password: decryptedKey
        });

        cognitoUser.authenticateUser(authDetails, {
          onSuccess: (session) => resolve([cognitoUser, session]),
          onFailure: (error) => {
            console.error('Cognito authentication failed:', error);
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async getAuthenticatedCognitoIdentity(session, cognitoUserPoolId, AWSSettings) {
    return new Promise((resolve, reject) => {
      try {
        const IDToken = session.getIdToken().getJwtToken();
        
        // Set region before creating credentials
        AWS.config.region = AWSSettings.region;
        
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
          IdentityPoolId: AWSSettings.cognitoFedPoolId,
          Logins: {
            [`cognito-idp.${AWSSettings.region}.amazonaws.com/${cognitoUserPoolId}`]: IDToken
          }
        });

        AWS.config.getCredentials((err) => {
          if (err) {
            reject(err);
          } else {
            resolve(AWS.config.credentials);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async handleShadowDelta(data) {
    console.log('Shadow delta received:', data);
    
    if (data.state?.channel) {
      const { id: channelId } = data.state.channel;
      console.log(`Channel assigned: ${channelId}`);
      
      // Use fresh token from broadcast if available, otherwise get from session
      try {
        let token;
        if (this.currentToken) {
          token = this.currentToken;
        } else {
          if (!this.cognitoSession) {
            const [user, session] = await this.getAuthenticatedCognitoSession(this.provisionedDevice);
            this.cognitoSession = session;
          }
          token = this.cognitoSession.getAccessToken().getJwtToken();
        }
        
        // Make HTTP call to local server like browser version
        const response = await fetch('http://localhost:3001/channel/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId,
            companyId: this.provisionedDevice.companyId,
            token: token
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
          console.log(`Channel downloaded: ${result.name} v${result.version}`);
        } else {
          console.error('Channel download failed:', result.error);
        }
      } catch (error) {
        console.error('Channel download failed:', error);
      }
    }

    // Report updated shadow
    this.reportShadow(data.state);
  }

  async handleCommand(data) {
    // Handle device deletion
    if (data.status === 'deleted') {
      console.log('[ACTIVATION] Device deactivated by cloud');
      this.resetOnDeactivation();
      return;
    }
    
    if (data.command === 'playerCommand') {
      console.log(`Executing command: ${data.commandName}`);
      
      let result = { status: 'SUCCESS' };
      
      try {
        switch (data.commandName) {
          case 'Reboot':
            console.log('Reboot command received');
            setTimeout(() => process.exit(0), 1000);
            break;
          case 'CheckDeployment':
            console.log('Check deployment command received');
            break;
          default:
            result = { status: 'FAIL', message: 'Unknown command' };
        }
      } catch (error) {
        result = { status: 'FAIL', message: error.message };
      }

      // Send command confirmation
      await this.mqtt.publish({
        topicName: `fwi/${this.provisionedDevice.companyId}/attributes`,
        payload: JSON.stringify({
          commandId: data.commandId,
          ...result
        }),
        qos: mqtt5.QoS.AtLeastOnce
      });
    }
  }

  async publishDeviceAttributes() {
    const systemInfo = await this.deviceManager.getSystemInfo();
    const networkInfo = await this.deviceManager.getNetworkInfo();
    
    const attributes = {
      env: process.env.ENVIRONMENT || 'dev',
      deviceId: this.provisionedDevice.deviceId,
      attributes: {
        adapters: {
          [networkInfo.activeAdapter]: {
            description: '',
            ipv4: networkInfo.ip,
            ipv6: '',
            ipv6LinkLocal: '',
            macAddress: networkInfo.macAddress
          }
        },
        ip: networkInfo.ip,
        macAddresses: [networkInfo.macAddress],
        makeModel: systemInfo.makeModel,
        os: systemInfo.operatingSystem,
        playerType: systemInfo.playerType,
        playerVersion: `${systemInfo.playerVersion}.${process.env.BUILD_NUMBER || '1'}`,
        serialNumber: systemInfo.serialNumber
      }
    };

    await this.mqtt.publish({
      topicName: `fwi/${this.provisionedDevice.companyId}/attributes`,
      payload: JSON.stringify(attributes),
      qos: mqtt5.QoS.AtLeastOnce
    });
  }

  reportShadow(state) {
    const shadowUpdate = {
      state: {
        reported: {
          ...state,
          lastUpdated: new Date().toISOString()
        }
      }
    };

    this.mqtt.publish({
      topicName: `$aws/things/${this.provisionedDevice.deviceId}/shadow/update`,
      payload: JSON.stringify(shadowUpdate),
      qos: mqtt5.QoS.AtLeastOnce
    });
  }

  async getAWSSettings() {
    const environment = (process.env.ENVIRONMENT || 'dev').trim();
    const cloudEnv = (process.env.CLOUD_ENV || 'cloudtest1').trim();
    
    let apiURL = 'https://';
    switch (environment) {
      case 'dev':
        apiURL += `api-${cloudEnv.toLowerCase()}.fwi-dev`;
        break;
      case 'staging':
        apiURL += `api-${environment.toLowerCase()}.fwi-dev`;
        break;
      case 'prod-eu':
      case 'prod-ap':
        apiURL += `api.${environment.replace('prod-', '')}1.fwicloud`;
        break;
      default:
        apiURL += 'api.fwicloud';
        break;
    }
    
    const url = `${apiURL}.com/common/v1/endpoints`;
    console.log(`Fetching AWS settings from: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to get AWS settings: HTTP ${response.status}`);
    }
    
    return await response.json();
  }

  decrypt(encryptedKey, companyId) {
    // Use proper AES decryption like browser version
    return AES.decrypt(encryptedKey, companyId).toString(Utf8);
  }

  isConnected() {
    return this.isConnectedFlag;
  }

  resetOnDeactivation() {
    console.log('Resetting device configuration due to deactivation');
    
    // Clear device configuration like browser version
    const config = this.deviceManager.loadConfig();
    delete config.provisionedDevice;
    delete config.activated;
    this.deviceManager.saveConfig(config);
    
    // Close MQTT connection
    if (this.mqtt) {
      this.mqtt.stop();
    }
    
    // Restart the service
    console.log('Device deactivated. Restarting service...');
    setTimeout(() => process.exit(0), 1000);
  }

  async activateWithInviteCode(inviteCode) {
    try {
      this.currentInviteCode = inviteCode;
      const awsSettings = await this.getAWSSettings();
      
      // Set up AWS config like browser version
      AWS.config.region = awsSettings.region;
      AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: awsSettings.cognitoFedPoolId,
      });

      // Get unauthenticated credentials
      const credentials = await new Promise((resolve, reject) => {
        AWS.config.getCredentials((err) => {
          if (err) reject(err);
          else resolve(AWS.config.credentials);
        });
      });

      // Get Cognito Identity credentials like browser version
      const cognitoIdentity = new AWS.CognitoIdentity();
      const cognitoCredentials = await new Promise((resolve, reject) => {
        cognitoIdentity.getCredentialsForIdentity(
          { IdentityId: credentials.identityId },
          (err, data) => {
            if (err) reject(err);
            else resolve(data);
          }
        );
      });

      // Create credentials provider from Cognito credentials
      const credentialsProvider = auth.AwsCredentialsProvider.newStatic(
        cognitoCredentials.Credentials.AccessKeyId,
        cognitoCredentials.Credentials.SecretKey,
        cognitoCredentials.Credentials.SessionToken
      );
      
      // Create MQTT5 client with WebSocket and credentials provider
      const builder = iot.AwsIotMqtt5ClientConfigBuilder.newWebsocketMqttBuilderWithSigv4Auth(
        awsSettings.endpointAddress,
        {
          region: awsSettings.region,
          credentialsProvider: credentialsProvider
        }
      );

      // Use inviteCode as clientId like browser version
      builder.withConnectProperties({
        clientId: inviteCode,
        keepAliveIntervalSeconds: 15
      });

      const config = builder.build();
      this.mqtt = new mqtt5.Mqtt5Client(config);

      this.setupMQTTHandlers();
      
      console.log('Starting MQTT5 client...');
      this.mqtt.start();
      
      // Wait for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
        this.mqtt.on('connectionSuccess', () => {
          clearTimeout(timeout);
          resolve();
        });
        this.mqtt.on('connectionFailure', (event) => {
          clearTimeout(timeout);
          reject(new Error(`Connection failed: ${event.error}`));
        });
      });

      console.log('MQTT5 connected, subscribing and publishing');
      
      // Subscribe to provision topic
      await this.mqtt.subscribe({
        subscriptions: [{
          topicFilter: `fwi/provision/${inviteCode}`,
          qos: mqtt5.QoS.AtLeastOnce
        }]
      });

      const systemInfo = await this.deviceManager.getSystemInfo();
      const provisionPayload = {
        env: process.env.ENVIRONMENT || 'dev',
        inviteCode: inviteCode,
        playerType: 'BrightSign',
        makeModel: systemInfo.makeModel,
        os: systemInfo.operatingSystem,
        playerVersion: '2.0.0'
      };

      console.log(`Publishing provision payload: ${JSON.stringify(provisionPayload)}`);
      await this.mqtt.publish({
        topicName: 'fwi/provision',
        payload: JSON.stringify(provisionPayload),
        qos: mqtt5.QoS.AtLeastOnce
      });
      
    } catch (error) {
      console.error('Invite code activation failed:', error);
      throw error;
    }
  }
}

module.exports = MQTTClient;