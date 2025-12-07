import * as AWS from 'aws-sdk/global';
import { Logger, decrypt } from '../Util';
import { MessageRouter } from './MessageRouter';
import CognitoIdentity from 'aws-sdk/clients/cognitoidentity';
import { device } from 'aws-iot-device-sdk-browser';
import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserSession } from 'amazon-cognito-identity-js';
import { CognitoIdentityCredentials, Credentials } from 'aws-sdk/global';
import { getCredentialsFromConfig, teardownMQTTConnection } from '.';
import { storeExport as store } from '..';
import { setConnectedToCloud, setInviteCodeProvisioning } from '@core/appState/fwiCloud';
import { ProvisioningStatus } from '@core/constants';
import { checkActiveNetworkInterface } from '@core/Flows/NetworkChangeFlow';

// get aws endpoint
export function getAWSEndpointURL(env: string, cloudEnv?: string) {
  let apiURL = 'https://';

  switch (env) {
    case 'dev':
      apiURL += `api-${cloudEnv?.toLowerCase()}.fwi-dev`;
      break;

    case 'staging':
      apiURL += `api-${env?.toLowerCase()}.fwi-dev`;
      break;

    case 'prod-eu':
    case 'prod-ap':
      apiURL += `api.${env.replace('prod-', '')}1.fwicloud`;
      break;

    default:
      apiURL += 'api.fwicloud';
      break;
  }
  return `${apiURL}.com/common/v1/endpoints`;
}

// create unauthenticated cognito identity?
export async function getUnauthenticatedCognitoIdentity(
  credentials: Credentials
): Promise<CognitoIdentity.Types.GetCredentialsForIdentityResponse> {
  return new Promise((resolve, reject) => {
    // @ts-expect-error Property 'data' does not exist on type 'Credentials'
    const IdentityId = credentials.data.IdentityId;
    const cognitoIdentity = new CognitoIdentity();

    cognitoIdentity.getCredentialsForIdentity(
      { IdentityId },
      (err, data: CognitoIdentity.Types.GetCredentialsForIdentityResponse) => {
        if (err) {
          Logger.error(err);
          reject(err);
        } else {
          // Logger.debug(data);
          Logger.debug('Got credentials for unauthenticated Cognito Identity');
          resolve(data);
        }
      }
    );
  });
}

/**
 *  NOTES: these credentials come from the unauthenticaed MQTT connection. it publishes a message to
 * 'fwi/provision', and gets a payload back that contains cognitoUserPoolId, cognitoClientId, deviceId?
 * ,key (needs to be decrypted).
 *
 */
export async function getAuthenticatedCognitoSession(
  provisionedPayload: ProvisionedDevicePayload
): Promise<[CognitoUser, CognitoUserSession]> {
  Logger.info('[ACTIVATION] Attempting to get Authenticated Connection to Harmony.');
  return new Promise((resolve, reject) => {
    try {
      const userPool = new CognitoUserPool({
        UserPoolId: provisionedPayload.cognitoUserPoolId!,
        ClientId: provisionedPayload.cognitoClientId!,
      });

      const cognitoUser = new CognitoUser({
        Username: provisionedPayload.deviceId,
        Pool: userPool,
      });

      // key (password) is encrpyted from cloud's lambda.
      const decryptedKey = decrypt(provisionedPayload.key, provisionedPayload.companyId);
      const authDetails = new AuthenticationDetails({
        Username: provisionedPayload.deviceId,
        Password: decryptedKey,
      });

      // login
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session: CognitoUserSession) => {
          resolve([cognitoUser, session]);
        },

        onFailure: (error) => {
          Logger.error(`[ACTIVATION] Failed to get Cognito Session because ${error.message}`);
          if (error.code === 'UserNotFoundException') {
            window.DeviceAPI.deleteAllSettings();
            window.DeviceAPI.restartApp();
          }
          reject(error);
        },
      });
    } catch (error) {
      Logger.error('getAuthenticatedCognitoSession error', error);
      reject(error);
    }
  });
}

export async function getAuthenticatedCognitoIdentity(
  session: CognitoUserSession,
  cognitoUserPoolId: string,
  config: AWS.Config,
  AWSSettings: AWSSettings
): Promise<Credentials> {
  return new Promise((resolve, reject) => {
    try {
      const IDToken = session.getIdToken().getJwtToken();
      config.credentials = new CognitoIdentityCredentials({
        IdentityPoolId: AWSSettings.cognitoFedPoolId!,
        Logins: {
          [`cognito-idp.${AWSSettings.region}.amazonaws.com/${cognitoUserPoolId}`]: IDToken,
        },
      });

      getCredentialsFromConfig(config).then((authenticaedCredentials) => {
        resolve(authenticaedCredentials);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// auto-activation
export async function provisionWithSerialNumber(serial: string, mqtt: MqttClient) {
  const playerType = window.DeviceAPI?.getManufacturer();
  const makeModel = await window.DeviceAPI?.getModel();
  const os = await window.DeviceAPI?.getFirmwareVersion();

  const payload = JSON.stringify({
    env: process.env.REACT_APP_ENVIRONMENT,
    hardwareNumbers: [serial],
    playerType,
    makeModel,
    os,
    playerVersion: process.env.REACT_APP_VERSION,
  });

  Logger.info(`Attempting auto activation with payload: ${JSON.stringify(payload)}`);
  mqtt.subscribe(`fwi/provision/${serial}`);
  mqtt.publish(`fwi/provision`, payload);
}

export async function provisionWithInviteCode(inviteCode: string, mqtt: MqttClient) {
  Logger.info(`Provisioning device from invite code :${inviteCode}`);
  const makeModel = await window.DeviceAPI.getModel();
  const os = await window.DeviceAPI.getFirmwareVersion();

  const payload = JSON.stringify({
    env: process.env.REACT_APP_ENVIRONMENT,
    inviteCode,
    playerType: window.DeviceAPI.getManufacturer(),
    makeModel,
    os,
    playerVersion: process.env.REACT_APP_VERSION,
  });

  Logger.debug(`subscribing to fwi/provision/${inviteCode}`);
  mqtt.subscribe(`fwi/provision/${inviteCode}`);
  mqtt.publish(`fwi/provision`, payload);
  store.dispatch(setInviteCodeProvisioning(ProvisioningStatus.awaitingResponse));
}

export function sendActivationPayloadWithInviteCode(
  inviteCode: string,
  provisionedDevice: ProvisionedDevicePayload,
  identityId: string,
  mqtt: MqttClient
) {
  // subscribe to private activation topic.
  mqtt.subscribe(`fwi/activate/${inviteCode}`);

  const payload: ActivationRequestPayload = {
    env: process.env.REACT_APP_ENVIRONMENT!,
    inviteCode,
    deviceId: provisionedDevice.deviceId,
    principal: identityId,
    companyId: provisionedDevice.companyId,
  };

  Logger.debug(`sending activation payload to fwi/activate: ${JSON.stringify(payload)}`);

  mqtt.publish(`fwi/activate`, JSON.stringify(payload));
  // NEXT STEP: see MessageRouter.ts#ActivationMessageRouter
}

export function sendActivationPayloadWithSerialNumber(
  serialNumber: string,
  provisionedDevice: ProvisionedDevicePayload,
  identityId: string,
  mqtt: MqttClient
) {
  mqtt.subscribe(`fwi/activate/${serialNumber}`);

  const payload: ActivationRequestPayload = {
    env: process.env.REACT_APP_ENVIRONMENT!,
    topicId: serialNumber,
    deviceId: provisionedDevice.deviceId,
    principal: identityId,
    companyId: provisionedDevice.companyId,
  };

  Logger.debug(`sending activation payload to fwi/activate: ${JSON.stringify(payload)}`);

  mqtt.publish(`fwi/activate`, JSON.stringify(payload));
  // NEXT STEP: see MessageRouter.ts#ActivationMessageRouter
}

/** Base function for creating any mqtt connection to cloud.  */
export function createMQTTConnection(
  clientID: string,
  AWSConfig: AWS.Config,
  AWSSettings: any,
  cognito: CognitoIdentity.Types.GetCredentialsForIdentityResponse
): MqttClient | undefined {
  if (!window.MQTT) {
    const options = {
      region: AWSConfig.region,
      host: AWSSettings.endpointAddress,
      clientId: clientID,
      protocol: 'wss',
      maximumReconnectTimeMs: 30000,
      reconnectPeriod: 2000,
      debug: false,
      accessKeyId: cognito.Credentials?.AccessKeyId,
      secretKey: cognito.Credentials?.SecretKey,
      sessionToken: cognito.Credentials?.SessionToken,
      keepalive: 15,
    };

    try {
      const mqtt: MqttClient = new device(options);
      if (mqtt) {
        registerEvents(mqtt);
        window.MQTT = mqtt;
        return mqtt;
      }
      throw new Error('Failed to create mqtt client.');
    } catch (error) {
      teardownMQTTConnection();
      Logger.error(error, options);
    }
  }
  return window.MQTT;
}

export function registerEvents(mqtt: MqttClient) {
  mqtt.on('connect', () => {
    Logger.debug('[MQTT] Connection to Harmony established.');
    const { appSettings, deviceState } = store.getState();
    if (deviceState.deviceOnline && appSettings.activated && appSettings.deviceID) {
      store.dispatch(setConnectedToCloud(true));
    }
  });

  mqtt.on('close', () => {
    Logger.warn('[MQTT] Connection to Harmony closed');
    store.dispatch(setConnectedToCloud(false));
    teardownMQTTConnection();
    checkActiveNetworkInterface();
  });

  mqtt.on('message', (topic: string, message: string | undefined) => {
    MessageRouter(topic, message);
  });

  mqtt.on('error', (error: unknown) => {
    Logger.error(`[MQTT] Connection to Harmony Error: `, error);
    teardownMQTTConnection();
  });
}

export async function checkActivationStatus() {
  // TODO: not sure how to do this yet.
}
