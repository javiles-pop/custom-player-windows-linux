import {
  getAWSEndpointURL,
  getAWSSettings,
  createInitialAWSConfig,
  getCredentialsFromConfig,
  getUnauthenticatedCognitoIdentity,
  createMQTTConnection,
  provisionWithSerialNumber,
  provisionWithInviteCode,
  getAuthenticatedCognitoSession,
  getAuthenticatedCognitoIdentity,
  sendActivationPayloadWithInviteCode,
  sendActivationPayloadWithSerialNumber,
} from '../MQTT';
import { Logger } from '../Util';
import { storeExport as store } from '@core/index';
import { setAutoProvioning, setAutoActivating, setInviteCodeActivation } from '@core/appState/fwiCloud';
import { setAwsSettings } from '@core/appState/appSetting';
import { ProvisioningStatus } from '@core/constants';
import { CognitoIdentityCredentials } from 'aws-sdk/lib/credentials/cognito_identity_credentials';

export const autoProvisionDevice = async () => {
  Logger.debug('[PROVISIONING] Starting Auto provisioning process...');
  store.dispatch(setAutoProvioning(ProvisioningStatus.inProgress));
  const endpoint = getAWSEndpointURL(process.env.REACT_APP_ENVIRONMENT!, process.env.REACT_APP_CLOUD_ENV!);
  const serial = await window.DeviceAPI?.getSerialNumber();

  // Get Harmony env settings, and a guest user Identity from those settings.
  const AWSSettings = await getAWSSettings(endpoint);
  const config = createInitialAWSConfig(AWSSettings);
  const credentials = await getCredentialsFromConfig(config);
  const unAuthCognito = await getUnauthenticatedCognitoIdentity(credentials);

  //save these to disk because we need them later.
  store.dispatch(setAwsSettings(AWSSettings));
  const mqtt = createMQTTConnection(serial, config, AWSSettings, unAuthCognito);
  if (mqtt) provisionWithSerialNumber(serial, mqtt);

  // FLOW: Next step is to listen for the MQTT message that contains a ProvisionedDevicePayload
  // SEE: @core/MQTT/MessageRouter.ts#ProvisionMessageRouter
};

export const provisionDevice = async (inviteCode: string) => {
  Logger.debug('Starting Manual provisioning process...');
  const endpoint = getAWSEndpointURL(process.env.REACT_APP_ENVIRONMENT!, process.env.REACT_APP_CLOUD_ENV!);

  // Get Harmony env settings, and a guest user Identity from those settings.
  // Retry fetching AWSSetting on failure with 500 milliseconds delay for 5 attempts
  const delay = 500;
  const retryAttempts = 5;
  const AWSSettings = await retryFetchingAWSSettings(delay, retryAttempts, endpoint);

  const config = createInitialAWSConfig(AWSSettings);
  const credentials = await getCredentialsFromConfig(config);
  const unAuthCognito = await getUnauthenticatedCognitoIdentity(credentials);

  store.dispatch(setAwsSettings(AWSSettings));

  // create initial MQTT Connection
  const mqtt = createMQTTConnection(inviteCode, config, AWSSettings, unAuthCognito);
  if (mqtt) provisionWithInviteCode(inviteCode, mqtt);

  // FLOW: Next step is to listen for the MQTT message that contains a ProvisionedDevicePayload
  // SEE: @core/MQTT/MessageRouter.ts#ProvisionMessageRouter
};

export const activateDevice = async (provisionedDevice: ProvisionedDevicePayload, inviteCode = '') => {
  const isActivationUsingInviteCode = Boolean(inviteCode);
  isActivationUsingInviteCode
    ? store.dispatch(setInviteCodeActivation(ProvisioningStatus.inProgress))
    : store.dispatch(setAutoActivating(ProvisioningStatus.inProgress));

  const AWSSettings = store.getState().appSettings.AWSSettings!;
  // const AWSSettings = store.getState().AWSSettings;
  const config = createInitialAWSConfig(AWSSettings);

  // In order to activate with invite code, we need to get a Cognito Identity with higher permission levels.
  // we will use the payload from the provisioned device to authenticate.
  try {
    const [user, session] = await getAuthenticatedCognitoSession(provisionedDevice);
    console.log('Cognito User: ', user);
    console.log('Cognito Session: ', session);

    // get the credentials from this authenticated identity.
    const authenticatedCredentials = (await getAuthenticatedCognitoIdentity(
      session,
      provisionedDevice.cognitoUserPoolId,
      config,
      AWSSettings
    )) as CognitoIdentityCredentials;

    // Inject the credentials into the mqtt connection. this grants us access to more topics.
    window.MQTT?.updateWebSocketCredentials(
      authenticatedCredentials.accessKeyId,
      authenticatedCredentials.secretAccessKey,
      authenticatedCredentials.sessionToken
    );

    // cloud needs this to tie cognito to the deviceId. creates correct policy in IoT Service.
    const identityId = authenticatedCredentials.identityId;

    isActivationUsingInviteCode
      ? sendActivationPayloadWithInviteCode(inviteCode, provisionedDevice, identityId, window.MQTT!)
      : sendActivationPayloadWithSerialNumber(
          await window.DeviceAPI?.getSerialNumber(),
          provisionedDevice,
          identityId,
          window.MQTT!
        );

    // FLOW: Next step is to listen for the MQTT message that contains message: {"status": "activated"}
    // SEE: @core/MQTT/MessageRouter.ts#ActivationMessageRouter
  } catch (error) {
    Logger.error(error.code);
    Logger.error(error.message);
  }
};

export async function retryFetchingAWSSettings(delay: number, times: number, endPoint: string): Promise<AWSSettings> {
  try {
    return await getAWSSettings(endPoint);
  } catch (ex) {
    if (times > 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryFetchingAWSSettings(delay, times - 1, endPoint);
    } else {
      throw ex;
    }
  }
}
