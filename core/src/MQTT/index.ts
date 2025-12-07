import * as AWS from 'aws-sdk/global';
import { Logger, runTaskAtTime } from '@core/Util';
import { createMQTTConnection, getAuthenticatedCognitoSession, getAuthenticatedCognitoIdentity } from './Activation';
import { CognitoIdentityCredentials, Credentials } from 'aws-sdk/global';
import { CognitoIdentity } from 'aws-sdk/clients/all';
import { storeExport as store } from '..';
import { setToken } from '@core/appState/appSetting';
import { fromUnixTime } from 'date-fns';
import { refreshAccessToken } from '@core/Deployment';
import { reportCurrentShadow } from './Shadow';

// get aws settings payload
//TODO: this is just a fetch call. the name is misleading.
export const getAWSSettings = async (url: string): Promise<AWSSettings> => {
  try {
    const data = await fetch(url);
    const json = await data.json();
    return json;
  } catch (error) {
    Logger.error(error);
    throw error;
  }
};

export const createInitialAWSConfig = (settings: any): AWS.Config => {
  const config = AWS.config;
  config.region = settings.region;
  config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: settings.cognitoFedPoolId,
  });
  return config;
};

export const getCredentialsFromConfig = async (AwsConfig: AWS.Config): Promise<Credentials> => {
  return new Promise((resolve, reject) => {
    AwsConfig.getCredentials((err) => {
      if (err) {
        Logger.error(err);
        reject(err);
      } else {
        resolve(AwsConfig.credentials as Credentials);
      }
    });
  });
};

export const createMQTTConnectionFromDeviceID = async (deviceID: string) => {
  try {
    const AWSSettings = store.getState().appSettings.AWSSettings!;
    const config = createInitialAWSConfig(AWSSettings);
    const provisionedDevice = store.getState().fwiCloud.provisionedDevicePayload;
    if (!provisionedDevice) throw new Error('Missing provisioned device information.');
    const [user, session] = await getAuthenticatedCognitoSession(provisionedDevice);

    // token stuff
    const accessToken = session.getAccessToken();
    const token = accessToken.getJwtToken();
    const exp = accessToken.getExpiration();

    runTaskAtTime(
      () => {
        refreshAccessToken(user, session);
      },
      // 5 minutes before expiration
      fromUnixTime(exp - 300),
      'Refresh initial Token'
    );

    store.dispatch(setToken(token));

    const authenticatedCredentials = (await getAuthenticatedCognitoIdentity(
      session,
      provisionedDevice.cognitoUserPoolId,
      config,
      AWSSettings
    )) as CognitoIdentityCredentials;

    if (
      !authenticatedCredentials.accessKeyId ||
      !authenticatedCredentials.secretAccessKey ||
      !authenticatedCredentials.sessionToken
    ) {
      throw new Error('Authenticated Credentials are missing required properties');
    }

    // Amazon apparently uses different casing in their library, so we have to transform it here.
    const wsCredentials: CognitoIdentity.Types.GetCredentialsForIdentityResponse = {
      Credentials: {
        AccessKeyId: authenticatedCredentials.accessKeyId,
        SecretKey: authenticatedCredentials.secretAccessKey,
        SessionToken: authenticatedCredentials.sessionToken,
      },
    };

    const mqtt = createMQTTConnection(deviceID, config, AWSSettings, wsCredentials);
    if (mqtt) {
      mqtt.subscribe(`$aws/things/${deviceID}/shadow/update/delta`);
      mqtt.subscribe(`fwi/${provisionedDevice.companyId}/broadcast`);
      mqtt.subscribe(`fwi/${provisionedDevice.companyId}/${deviceID}`);
      if (process.env.NODE_ENV === 'development') {
        mqtt.subscribe(`$aws/things/${deviceID}/shadow/rejected/#`);
        mqtt.subscribe(`$aws/things/${deviceID}/shadow/accepted/#`);
      }

      // get the initial shadow.
      mqtt.subscribe(`$aws/things/${deviceID}/shadow/get/#`);
      mqtt.publish(`$aws/things/${deviceID}/shadow/get`, '{}');
      publishDeviceAttributes(mqtt, provisionedDevice);
      reportCurrentShadow();
    } else {
      window.MQTT = window.MQTT ? createMQTTConnection(deviceID, config, AWSSettings, wsCredentials) : undefined;
    }
  } catch (error) {
    teardownMQTTConnection();
    throw new Error(`[MQTT] Failed to create connection from device ID. ${error}`);
  }
};

export const publishDeviceAttributes = async (mqtt: MqttClient, provisionedDevice: ProvisionedDevicePayload) => {
  const [os, serialNumber, makeModel, ip, macAddress, activeAdapter] = await Promise.all([
    window.DeviceAPI.getFirmwareVersion(),
    window.DeviceAPI.getSerialNumber(),
    window.DeviceAPI.getModel(),
    window.DeviceAPI.getIPAddress(),
    window.DeviceAPI.getMACAddress(),
    window.DeviceAPI.getActiveNetworkInterface(),
  ]);

  const { companyId, deviceId } = provisionedDevice;

  Logger.debug('[MQTT] Sending device attributes to cloud.');

  mqtt.publish(
    `fwi/${companyId}/attributes`,
    JSON.stringify({
      env: process.env.REACT_APP_ENVIRONMENT,
      deviceId,
      attributes: {
        adapters: {
          [activeAdapter]: {
            description: '',
            ipv4: ip,
            ipv6: '',
            ipv6LinkLocal: '',
            macAddress: macAddress,
          },
        },
        ip,
        macAddresses: [macAddress],
        makeModel,
        os,
        playerType: window.DeviceAPI.getManufacturer(),
        playerVersion: `${process.env.REACT_APP_VERSION}.${process.env.REACT_APP_BUILD}`,
        serialNumber,
      },
    })
  );
};

export const teardownMQTTConnection = () => {
  // remove mqtt connection.
  Logger.debug('[MQTT] Tearing down MQTT connection');
  if (window.MQTT) {
    window.MQTT?.end();
    window.MQTT = undefined;
  }
};

export * from './Activation';
export * from './CPWebCommunications';
export * from './Commands';
