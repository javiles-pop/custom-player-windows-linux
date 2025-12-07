import { setActiveNetworkInterface, setDeviceOnline, setPreferredWifiNetwork } from '@core/appState/deviceState';
import { createMQTTConnectionFromDeviceID, teardownMQTTConnection } from '@core/MQTT';
import { storeExport as store } from '@core/index';
import { autoUploadCloudLogs, Logger } from '@core/Util';
import { cacheBustCurrentDeployment } from '@core/Deployment';
import { isOnline } from '@core/Util/isOnline';

export const doOnlineFlow = async () => {
  Logger.info(`[NETWORK] Initiating device's "back-online" flow`);
  // if token expiration has passed, get a new one instead
  const { deviceID } = store.getState().appSettings;
  if (deviceID) {
    // this call will get a new access token, and an updated shadow.
    await createMQTTConnectionFromDeviceID(deviceID);
  }
  // check for new content
  cacheBustCurrentDeployment();

  // get all the logs that occurred while offline.
  const offlineLogs = await window.DeviceAPI.getAllLogsFromDisk();
  window.DeviceAPI.logs = [...offlineLogs, ...window.DeviceAPI.logs];

  // upload logs buffer from when we were offline.
  autoUploadCloudLogs();
};

export const doOfflineFlow = async () => {
  Logger.info(`[NETWORK] Initiating device's "offline-mode" flow`);
  const { currentURL, cachedURL } = store.getState().appSettings;

  // remove mqtt connection.
  teardownMQTTConnection();

  // save cached url if present
  if (cachedURL !== currentURL) {
    Logger.debug('Updating cached url for offline playback.');
    window.DeviceAPI.setSetting('cached_url', currentURL);
  }

  // reset logs buffer
  window.DeviceAPI.logs = [];
};

export const probeForInternetConnectivity = async () => {
  const online = await isOnline();
  const { deviceConnected, deviceOnline } = store.getState().deviceState;

  if (deviceOnline !== online) {
    store.dispatch(setDeviceOnline(online));
    checkActiveNetworkInterface();
  }

  if (deviceConnected && !online) {
    Logger.info(`[NETWORK] Network is up, but can't reach internet. retrying in 10sec.`);
    setTimeout(() => {
      probeForInternetConnectivity();
    }, 10000);
  }
};

export async function checkActiveNetworkInterface() {
  const { deviceConnected } = store.getState().deviceState;

  if (deviceConnected) {
    const activeInterface = await window.DeviceAPI.getActiveNetworkInterface();
    if (activeInterface) {
      if (activeInterface === 'wlan0') {
        store.dispatch(setActiveNetworkInterface('wifi'));
        const { ssid } = await window.DeviceAPI.getWifiStatus();

        store.dispatch(setPreferredWifiNetwork(ssid));
      } else if (activeInterface === 'eth0') {
        store.dispatch(setActiveNetworkInterface('ethernet'));
      } else {
        store.dispatch(setActiveNetworkInterface('default'));
      }
    }
  } else {
    store.dispatch(setActiveNetworkInterface(null));
  }
}
