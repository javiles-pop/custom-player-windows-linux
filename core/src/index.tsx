import * as React from 'react';
import { Provider } from 'react-redux';
import {
  Logger,
  listenForKonamiCode,
  listenForArrowNavigation,
  listenForOtherKeyboardShortcuts,
  listenForDisplayRotationHotKey,
  DeviceAPI,
  listenForNetworkStatusChange,
  startIntervalBasedTasks,
  listenForDeveloperMode,
} from './Util';
import {
  getInitialAppSettings,
  getInitialCloudState,
  getInitialDeviceSettings,
  getInitialDeviceState,
  getInitialMenuState,
} from './appState/initialState';
import setupStore from './createStore';
import App from './App';
import { DiskKeys } from './constants';
import { ToastProvider } from './context/ToastProvider';

let storeExport: ReturnType<typeof setupStore>;

declare global {
  interface Window {
    DeviceAPI: DeviceAPI;
    MQTT?: MqttClient;
    Cypress: any;
    store: any;
  }
}

const initShimApp = async (deviceAPIWrapper: { new (...args: any[]): DeviceAPI }) => {
  if (process.env.NODE_ENV === 'development') {
    Logger.warn(' ==== App is running in development mode ====');
  }

  window.DeviceAPI = new deviceAPIWrapper(Logger);
  //log startup info
  Logger.info(`Initializing Application version ${process.env.REACT_APP_VERSION}.${process.env.REACT_APP_BUILD}`);
  Logger.debug(
    `Environment: ${process.env.REACT_APP_ENVIRONMENT}${
      process.env.REACT_APP_CLOUD_ENV ? ':' + process.env.REACT_APP_CLOUD_ENV : ''
    }`
  );

  await window.DeviceAPI?.init();
  window.DeviceAPI.setSetting(DiskKeys.LastBoot, new Date().getTime());
  // populate intial state.
  const initialState = {
    appSettings: await getInitialAppSettings(),
    fwiCloud: getInitialCloudState(),
    deviceSettings: getInitialDeviceSettings(),
    shimMenu: getInitialMenuState(),
    deviceState: await getInitialDeviceState(),
  };

  const store = setupStore(initialState);
  storeExport = store;

  // register global listeners.
  listenForKonamiCode();
  listenForArrowNavigation();
  listenForOtherKeyboardShortcuts();
  listenForDisplayRotationHotKey();
  listenForNetworkStatusChange(store.dispatch);
  startIntervalBasedTasks();
  listenForDeveloperMode();

  if (window.Cypress) {
    window.store = store;
  }

  return (
    <Provider store={store}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </Provider>
  );
};

export { initShimApp, DeviceAPI, storeExport };
