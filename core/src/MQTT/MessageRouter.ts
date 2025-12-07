import { Logger } from '@core/Util';
import { storeExport as store } from '@core/index';
import {
  setAutoProvioning,
  setAutoActivating,
  setInviteCodeProvisioning,
  setInviteCodeActivation,
  setProvisionedDevicePayload,
  resetDeviceProvisioning,
} from '@core/appState/fwiCloud';
import { ProvisioningStatus } from '@core/constants';
import { activateDevice } from '@core/Flows';
import { ShadowMessageRouter } from './Shadow';
import { CommandMessageRouter } from './Commands';
import { setActivated, setDeviceID, setCompanyID, resetAppSettings } from '@core/appState/appSetting';
import { ActivationErrorMessages as errorMessages, activationStatus } from '@core/constants';
import { resetDeviceSettings } from '@core/appState/deviceState';
import { resetShimMenu } from '@core/appState/shimMenuActive';
import { teardownMQTTConnection } from '.';

/** Base Message Router. All incoming MQTT messages flow through this function and may be sent to a sub-router. */
export const MessageRouter = (topic: string, message?: string) => {
  const messageObj: MQTTMessage = message ? JSON.parse(message) : {};
  Logger.debug('[MQTT] Incoming MQTT message on topic ' + topic, messageObj);

  switch (true) {
    /* =============================*
     *        Route by Topic        *
     * =============================*/

    case topic.includes('provision'):
      ProvisionMessageRouter(messageObj);
      break;

    case topic.includes('activate'):
      ActivationMessageRouter(messageObj);
      break;

    case topic.includes('shadow'):
      ShadowMessageRouter(topic, messageObj);
      break;

    /* =============================*
     *       Route by Message       *
     * =============================*/

    case 'command' in messageObj:
    case 'log' in messageObj:
      CommandMessageRouter(messageObj);
      break;

    case 'channel' in messageObj && 'version' in messageObj && 'url' in messageObj:
      const channelUpdate = messageObj as ChannelUpdateMessage;
      window.postMessage({ 
        type: 'CHANNEL_UPDATE', 
        channel: channelUpdate.channel, 
        version: channelUpdate.version,
        url: channelUpdate.url,
        name: channelUpdate.name
      }, '*');
      break;

    case 'channel' in messageObj:
      CommandMessageRouter(messageObj);
      break;

    case 'status' in messageObj:
      ActivationMessageRouter(messageObj);
      break;

    //======  Safe-to-ignore   ======//
    case 'token' in messageObj: // CPWin only
    case 'processed' in messageObj: //logs
    case messageObj === undefined:
      break;

    default:
      Logger.warn(`[MQTT] Unhandled case for MQTT Topic: ${topic}`);
      Logger.debug(`[MQTT] Unhandled message: `, messageObj);
      break;
  }
};

const ProvisionMessageRouter = (messageObj: MQTTMessage) => {
  Logger.debug(`[PROVISION] MQTT Message: ${JSON.stringify(messageObj)}`, messageObj);
  if (messageObj.error) {
    switch (messageObj.error) {
      case errorMessages.hardwareNumberError:
        store.dispatch(setAutoProvioning(ProvisioningStatus.error));
        teardownMQTTConnection();
        break;

      case errorMessages.inviteCodeError:
        store.dispatch(setInviteCodeProvisioning(ProvisioningStatus.error));
        teardownMQTTConnection();
        break;

      case errorMessages.notPendingState:
        store.dispatch(setAutoProvioning(ProvisioningStatus.error));

        break;

      default:
        break;
    }
  } else {
    if (isProvisionedDevice(messageObj)) {
      store.dispatch(setProvisionedDevicePayload(messageObj));
      store.dispatch(setDeviceID(messageObj.deviceId));
      store.dispatch(setCompanyID(messageObj.companyId));
      const inviteCodeActivationStatus = store.getState().fwiCloud.provisioning.inviteCodeProvisioning;
      const inviteCode = store.getState().fwiCloud.inviteCode;
      if (inviteCode && inviteCodeActivationStatus == ProvisioningStatus.awaitingResponse) {
        store.dispatch(setInviteCodeProvisioning(ProvisioningStatus.success));
        activateDevice(messageObj, inviteCode!);
      } else {
        store.dispatch(setAutoProvioning(ProvisioningStatus.success));
        activateDevice(messageObj);
      }
    }
  }
};

const ActivationMessageRouter = (messageObj: MQTTMessage) => {
  Logger.debug(`[ACTIVATION] MQTT Message: ${JSON.stringify(messageObj)}`, messageObj);
  if (messageObj.error) {
    switch (messageObj.error) {
      case errorMessages.activationError:
        store.dispatch(setInviteCodeProvisioning(ProvisioningStatus.error));
        store.dispatch(setAutoActivating(ProvisioningStatus.error));
        break;
      default:
        Logger.warn('Unhandled activation error message');
        break;
    }
  } else {
    if (messageObj.status) {
      switch (messageObj.status) {
        case activationStatus.activated:
          store.dispatch(setAutoActivating(ProvisioningStatus.success));
          store.dispatch(setInviteCodeActivation(ProvisioningStatus.success));
          // allow time for the LaunchScreen to show the successful state of activation
          setTimeout(() => {
            store.dispatch(setActivated(true));
            window.DeviceAPI?.setSetting('activated', true);
          }, 750);

          teardownMQTTConnection();
          break;

        case activationStatus.deleted:
          Logger.info('[ACTIVATION] Device deactivated.');
          resetStoreOnDeactivation();
          break;

        default:
          break;
      }
    }
  }
};

const isProvisionedDevice = (object: any): object is ProvisionedDevicePayload => {
  return 'deviceId' in object;
};

const resetStoreOnDeactivation = () => {
  store.dispatch(resetAppSettings());
  store.dispatch(resetDeviceProvisioning());
  store.dispatch(resetDeviceSettings());
  store.dispatch(resetShimMenu());
  window.DeviceAPI?.deleteAllSettings();
  window.postMessage({ type: 'SHADOW_UPDATE', CurrentURL: '' }, '*');
  setTimeout(() => window.DeviceAPI?.restartApp(), 100);
};
