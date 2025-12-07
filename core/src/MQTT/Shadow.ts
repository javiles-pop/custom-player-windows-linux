import { Logger, mapDeviceTimezonetoShadow, mapShadowTimezoneToDevice } from '@core/Util';
import { storeExport as store } from '@core/index';
import {
  setCurrentURL,
  setWebPlayerURL,
  AppSettingsActions,
  setProxy,
  setResolution,
  setDeviceName,
} from '@core/appState/appSetting';
import { setDisplayOrientation } from '@core/appState/deviceSettings';
import { getFinalSignURL } from '@core/Deployment';
import { setMenuStatus, setUserCanAccessMenu } from '@core/appState/shimMenuActive';
import { LogLevel, Shadow, LogUploadTimeIntervals } from '@core/constants';
import { convertStringToDisplayOrientation } from '@core/Util/Converter';
import { deepEqual } from '@core/Util/deepEqual';
import { ObjectEntries, ObjectKeys } from '@core/Util/Object';

export const ShadowMessageRouter = (topic: string, messageObj: MQTTMessage) => {
  const deviceID = store.getState().fwiCloud.provisionedDevicePayload?.deviceId;

  switch (true) {
    case topic.includes('/get'):
      getShadowHandler(messageObj);
      Logger.info('[SHADOW] Recieved initial device shadow from Cloud.');
      // dont need this subscription anymore.
      window.MQTT?.unsubscribe(`$aws/things/${deviceID}/shadow/get/#`);
      break;

    case topic.includes('delta'):
      Logger.info('[SHADOW] Recieved shadow delta from Cloud.');
      handleShadowDelta(messageObj as ShadowDelta);
      break;

    default:
      Logger.debug(`[SHADOW] Got message on ${topic}: ${JSON.stringify(messageObj)}`, messageObj);

      break;
  }
};

const getShadowHandler = (message: MQTTMessage) => {
  const shadow = message as ShadowSnapshot;
  if (shadow.state?.desired) {
    handleShadowDelta({ state: shadow.state.desired, metadata: {} });
  }
};

const handleShadowDelta = async ({ state }: ShadowDelta) => {
  let updatedShimDelta: DeviceShadow = {};
  let desiredDelta: DeviceShadow = {};
  Logger.debug('[SHADOW] delta state received: ', state);
  const actions = Object.keys(AppSettingsActions);

  if ('WebPlayerURL' in state) {
    Logger.info('[SHADOW] setting new web player url from shadow.');
    updatedShimDelta = {
      ...updatedShimDelta,
      ...{ [Shadow.WebPlayerURL]: state.WebPlayerURL },
    };
    store.dispatch(setWebPlayerURL({ value: state.WebPlayerURL!, ignoreUpdateToCloud: true }));
    delete state.WebPlayerURL;
  }

  if ('channel' in state) {
    Logger.info('[SHADOW] setting new channel from shadow.');
    updatedShimDelta = {
      ...updatedShimDelta,
      ...{ [Shadow.channel]: state.channel },
    };
    try {
      let webUrl = store.getState().appSettings.webPlayerBaseURL;
      if (webUrl) {
        const url = new URL(webUrl);
        url.searchParams.set('channel', state.channel!.id);

        if (state.channel!.channelType === 'cloud') {
          url.searchParams.set('width', document.body.clientWidth.toString());
          url.searchParams.set('height', document.body.clientHeight.toString());
        }

        webUrl = url.toString();
        webUrl = await getFinalSignURL(webUrl);
        store.dispatch(setCurrentURL({ value: webUrl }));
        store.dispatch(setMenuStatus(false));
        if (store.getState().appSettings.accessCode) {
          store.dispatch(setUserCanAccessMenu(false));
        }
        
        const channelURL = `https://cloudtest1.fwi-dev.com/channels/${state.channel!.id}`;
        window.postMessage({ type: 'SHADOW_UPDATE', CurrentURL: channelURL }, '*');
        
        const companyId = store.getState().fwiCloud.provisionedDevicePayload?.companyId;
        window.postMessage({ 
          type: 'CHANNEL_ASSIGNED', 
          channel: state.channel, 
          companyId 
        }, '*');
      } else {
        Logger.warn('There is no base url configured for CPWEB. Channels cannot function without this value.');
      }
    } catch (error) {
      Logger.error('[SHADOW] new channel url from shadow encountered an error');
    }
    delete state.channel;
  }

  if ('Proxy' in state) {
    const { proxyEnabled, proxyUser, proxyPass, proxyHost, proxyBypassBSN, proxyPort, proxyBypassHosts } =
      store.getState().appSettings;

    if (
      deepEqual(state.Proxy, {
        proxyEnabled,
        proxyHost,
        proxyUser,
        proxyPass,
        proxyPort,
        proxyBypassBSN,
        proxyBypassHosts,
      })
    ) {
      delete state.Proxy;
    } else {
      store.dispatch(setProxy({ value: state.Proxy, ignoreUpdateToCloud: true }));
    }
  }

  if ('Resolution' in state && state.Resolution) {
    Logger.info('[SHADOW] Setting resolution from shadow.');
    updatedShimDelta = {
      ...updatedShimDelta,
      ...{ [Shadow.Resolution]: state.Resolution },
    };
    store.dispatch(setResolution({ value: state.Resolution, ignoreUpdateToCloud: true }));
    delete state.Resolution;
  }

  if ('checkLabels' in state) {
    Logger.debug('[SHADOW] Asking Web Player to update labels...');
    (document.getElementById('player-iframe') as HTMLIFrameElement)?.contentWindow?.postMessage(
      { command: 'updateLabels' },
      store.getState().appSettings.webPlayerBaseURL
    );
    delete state.checkLabels;
  }

  ObjectEntries(AppSettingsActions).map(([key]) => {
    actions.push(key);
  });

  for (const key in state) {
    const value = state[key];
    updatedShimDelta = { ...updatedShimDelta, ...{ [key]: value } };
    const action = 'set' + key;

    if (key === Shadow.name) {
      store.dispatch(setDeviceName(state.name!));
      delete state.name;
    }

    if (key === Shadow.Orientation) {
      const angle: string = value.toLowerCase().replace(' degrees', '');
      if (Number(store.getState().deviceSettings.orientation) !== Number(angle)) {
        store.dispatch(
          setDisplayOrientation({
            value: convertStringToDisplayOrientation(angle),
            ignoreUpdateToCloud: true,
          })
        );
      }
    }

    if (actions.includes(action)) {
      let newValue = state[key];

      if (key === Shadow.TimeZone) {
        newValue = mapShadowTimezoneToDevice(state.TimeZone!);
      }

      if (key === Shadow.LogLevel) {
        newValue = getLogLevel(state.LogLevel!);
      }

      if (key === Shadow.CurrentURL) {
        if (value && typeof value === 'string') {
          // Extract and post channel URL immediately
          let channelURL = value;
          try {
            if (value.includes('cloudtest1.fwi-dev.com/channels/')) {
              channelURL = value;
            } else {
              const urlObj = new URL(value);
              const channelId = urlObj.searchParams.get('channel');
              if (channelId) {
                channelURL = `https://cloudtest1.fwi-dev.com/channels/${channelId}`;
              }
            }
            window.postMessage({ type: 'SHADOW_UPDATE', CurrentURL: channelURL }, '*');
          } catch (e) {
            Logger.error('[SHADOW] Failed to process channel URL:', e);
          }
          
          // Skip validation for cloudtest1 URLs - they're for display only
          if (value.includes('cloudtest1.fwi-dev.com/channels/')) {
            newValue = value;
          } else {
            newValue = await getFinalSignURL(value);
          }
        } else {
          newValue = '';
        }
      }

      if (key === Shadow.UploadLogTimeInterval) {
        newValue = uploadLogAtInterval(value as string);
      }

      try {
        store.dispatch(
          // @ts-expect-error Element implicitly has an 'any' type because expression of type 'string' can't be used to index type
          AppSettingsActions[action]({
            value: newValue,
            ignoreUpdateToCloud: true,
          })
        );
      } catch (error) {
        Logger.error(`Error executing action ${action}. ${error}`);
      }
    } else {
      if (action === 'setDeploymentURL') {
        // I have no idea how this action is still coming from cloud, but it is, and we don't care about it anymore.
      } else {
        Logger.warn('Action not found ' + action);
      }

      desiredDelta = { ...desiredDelta, ...{ [key]: value } };
    }

    Logger.debug(`[SHADOW] setting ${key.replace(/_/g, ' ')} from shadow`);
  }

  if (ObjectKeys(updatedShimDelta).length !== 0) {
    const deviceId = store.getState().appSettings.deviceID;

    window.MQTT?.publish(
      '$aws/things/' + deviceId + '/shadow/update',
      JSON.stringify({
        state: {
          reported: updatedShimDelta,
          desired: ObjectKeys(desiredDelta).length === 0 ? null : state,
        },
      })
    );
  }
};

const getLogLevel = (logLevel: string): LogLevel => {
  switch (logLevel) {
    case 'ERROR':
      return LogLevel.ERROR;
    case 'WARN':
      return LogLevel.WARN;
    case 'INFO':
      return LogLevel.INFO;
    case 'DEBUG':
      return LogLevel.DEBUG;
    case 'TRACE':
      return LogLevel.TRACE;
    default:
      return LogLevel.WARN;
  }
};

export const getReportedShadowSettings = () => {
  const { appSettings, deviceSettings } = store.getState();
  const reported: DeviceShadow = {
    CurrentURL: appSettings.currentURL,
    AccessCode: appSettings.accessCode,
    SoftwareUpdateURL: appSettings.softwareUpdateURL,
    CheckForSoftwareUpdate: appSettings.checkForSoftwareUpdate,
    CheckForSoftwareUpdateTime: appSettings.checkForSoftwareUpdateTime,
    WantReboot: appSettings.wantReboot,
    RebootTime: appSettings.rebootTime,
    FirmwareUpdateURL: appSettings.firmwareUpdateURL,
    CheckForFirmwareUpdate: appSettings.checkForHardwareUpdate,
    CheckForFirmwareUpdateTime: appSettings.checkForHardwareUpdateTime,
    EnableOnOffTimers: appSettings.enableOnOffTimers,
    CECEnabled: appSettings.CECEnabled,
    OnOffTimers: appSettings.onOffTimers,
    Orientation: `${deviceSettings.orientation} Degrees`,
    Resolution: appSettings.resolution,
    TimeZone: mapDeviceTimezonetoShadow(appSettings.timeZone ?? 'MST'),
    TimeServer: appSettings.timeServer,
    LogLevel: appSettings.logLevel,
    WebPlayerURL: appSettings.webPlayerBaseURL,
    name: appSettings.deviceName,
    IsFwiCloudPlaylogEnabled: appSettings.IsFwiCloudPlaylogEnabled,
    EncryptedStorage: appSettings.encryptedStorage,
  };

  if (window.DeviceAPI.supportsTimeServer) {
    reported.TimeServer = appSettings.timeServer;
  }

  if (window.DeviceAPI.supportsProxy) {
    reported.Proxy = {
      UseProxy: appSettings.proxyEnabled ?? false,
      ProxyHost: appSettings.proxyHost ?? '',
      ProxyUser: appSettings.proxyUser ?? '',
      ProxyPassword: appSettings.proxyPass ?? '',
      ProxyPort: appSettings.proxyPort ? Number(appSettings.proxyPort) : '',
      ProxyBypassGroup: {
        BypassBSN: appSettings.proxyBypassBSN ?? false,
        ProxyBypassDomains:
          appSettings.proxyBypassHosts?.filter((entry) => !window.DeviceAPI.knownHosts.includes(entry)) ?? [],
      },
    };
  }

  console.log('reported shadow: ', reported);

  return reported;
};

export const reportCurrentShadow = () => {
  Logger.info('[SHADOW] Reporting current device settings to Cloud.');
  const deviceId = store.getState().appSettings.deviceID;
  const reported = getReportedShadowSettings();
  
  // Post message for display on initial load
  if (reported.CurrentURL) {
    try {
      if (reported.CurrentURL.includes('cloudtest1.fwi-dev.com/channels/')) {
        window.postMessage({ type: 'SHADOW_UPDATE', CurrentURL: reported.CurrentURL }, '*');
      } else {
        const urlObj = new URL(reported.CurrentURL);
        const channelId = urlObj.searchParams.get('channel');
        if (channelId) {
          const channelURL = `https://cloudtest1.fwi-dev.com/channels/${channelId}`;
          window.postMessage({ type: 'SHADOW_UPDATE', CurrentURL: channelURL }, '*');
        }
      }
    } catch (e) {
      Logger.error('[SHADOW] Failed to post initial channel URL:', e);
    }
  }
  
  if (window.MQTT) {
    window.MQTT?.publish(
      '$aws/things/' + deviceId + '/shadow/update',
      JSON.stringify({
        state: {
          reported,
        },
      })
    );
  } else {
    console.error('no mqtt connection yet.');
  }
};

const uploadLogAtInterval = (interval?: string): string => {
  let logInterval = '5';
  switch (interval ?? LogUploadTimeIntervals.fiveMinutes) {
    case LogUploadTimeIntervals.fifteenMinutes:
      logInterval = '15';
      break;
    case LogUploadTimeIntervals.hour:
      logInterval = '60';
      break;
    case LogUploadTimeIntervals.sixHours:
      logInterval = '360';
      break;
    case LogUploadTimeIntervals.twelveHours:
      logInterval = '720';
      break;
    case LogUploadTimeIntervals.day:
      logInterval = '1440';
      break;
    default:
      break;
  }
  return logInterval;
};

export function updateShadow(key: keyof AppSettings, value: any) {
  const appSettings = store.getState().appSettings;
  // check for key validity and value equality
  if (key in appSettings && appSettings[key] !== value) {
    window.MQTT?.publish(
      `$aws/things/${appSettings.deviceID}/shadow/update`,
      JSON.stringify({
        state: {
          desired: { key: value },
        },
      })
    );
  }
}
