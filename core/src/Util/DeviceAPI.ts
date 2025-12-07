/* eslint-disable @typescript-eslint/no-empty-function */
import { ILogger } from 'js-logger';
import { storeExport as store, storeExport } from '@core/index';
import { setMenuStatus } from '@core/appState/shimMenuActive';
import { semverIsGreater, spoofPausedVideoPlayback } from '.';
import { setFirmwareUpdateAvailable } from '@core/appState/deviceState';
import { DeviceManufacturer, OnOff, STOP_COMMAND } from '@core/constants';
/**
 *  Base class for device functionality. Enforce all return types when adding new methods.
 */
abstract class DeviceAPI {
  backendReady = true;
  firmwareUpdateURLValidationPattern = /.+/;
  knownHosts: string[] = [];
  osVersion = '';
  requiresVideoZIndex = false;
  softwareUpdateValidationPattern = /.+/;
  supportsCECControl = false;
  supportsCustomResolution = false;
  supportsDisplayRotation = true;
  supportsLocalCache = false;
  supportsMonitoring = false;
  supportsProxy = false;
  supportsSofwareUpdate = true;
  supportsTCPConfig = false;
  supportsTimeServer = true;
  supportsTimeZone = true;
  supportsVirtualKeyboard = false;
  supportsWifiConfig = false;
  supportsVideoWall = false;
  supportsStorageEncryption = false;

  logs: Log[];
  playbackLogs: PlayEvent[];
  Logger: ILogger;
  deviceType: string;

  constructor(Logger: ILogger) {
    this.logs = [];
    this.playbackLogs = [];
    this.Logger = Logger;
    this.deviceType = process.env.DEVICE_TYPE!;
    this.afterInitComplete();
  }

  init = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      resolve();
    });
  };

  postInit = async () => {};

  afterInitComplete = () => {
    this.Logger.debug(`Initialized Device API for ${process.env.DEVICE_TYPE}`);
  };

  getSetting = (key: string): string | undefined => {
    return localStorage.getItem(key) ?? undefined;
  };

  getParsedSetting = <T extends string | number | Record<string, any> | boolean | null | undefined>(key: string): T => {
    const rawValue = this.getSetting(key);
    let parsedValue = rawValue;
    if (rawValue) {
      try {
        parsedValue = JSON.parse(rawValue);
      } catch {
        /* fail silently */
      }
    }
    return parsedValue as T;
  };

  getAllSettings = async () => {
    return new Promise((resolve, _) => {
      resolve(localStorage);
    });
  };

  deleteAllSettings = async () => {
    localStorage.clear();
  };

  setSetting = async (key: string, value: string | boolean | number | string[] | undefined | null): Promise<void> => {
    return new Promise((resolve, _) => {
      localStorage.setItem(key, value ? value.toString() : '');
      resolve();
    });
  };

  deleteSetting = (key: string) => {
    localStorage.removeItem(key);
  };

  captureScreenshot = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {});
  };

  saveCloudLogsToDisk = async (logs: Log[]) => {
    this.Logger.warn('saveCloudLogsToDisk not implemented for this device type');
  };

  savePlaybackLogsToDisk = async (logs: PlayEvent[]) => {
    console.warn('savePlaybackLogsToDisk not implemented for this device type.');
  };

  saveChannelContent = async (blob: Blob, channelId: string, version: string): Promise<void> => {
    console.warn('saveChannelContent not implemented for this device type.');
  };

  uploadCloudLogs = () => {};

  reboot = () => {
    window.location.reload();
  };

  restartApp = () => {
    this.postMessage(STOP_COMMAND);
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  };

  getIPAddress = async (): Promise<string> => {
    return new Promise((resolve, _) => {
      resolve('');
    });
  };

  getMACAddress = async (): Promise<string> => {
    return new Promise((resolve, _) => {
      resolve('');
    });
  };

  getSerialNumber = async (): Promise<string> => {
    return new Promise((resolve, _) => {
      resolve('');
    });
  };

  turnDisplayOnOff = (toggle: OnOff) => {};

  getFirmwareVersion = (): Promise<string> => {
    return new Promise((resolve, _) => {
      resolve('');
    });
  };

  getManufacturer = (): DeviceManufacturer => {
    return DeviceManufacturer.Unknown;
  };

  getModel = async (): Promise<string> => {
    return new Promise((resolve, _) => {
      resolve('None');
    });
  };

  getScreenOrientation = () => {};

  setScreenOrientation = (degrees: 0 | 90 | 180 | 270) => {};

  setVolume = (level: number) => {};

  getVolume = () => {};

  rotateScreen = () => {};

  setLaunchUrlAddress = (url: string) => {};

  checkForSoftwareUpdate = async (): Promise<boolean> => true;

  checkForFirmwareUpdate = async () => {
    this.Logger.info('Checking for firmware update...');
    const { firmwareUpdateURL } = storeExport.getState().appSettings;
    const urlContainsFilename = firmwareUpdateURL?.match(/((\d{1,4}(\.)?){1,5})\.bsfw$/);
    if (urlContainsFilename) {
      const currentVersion = await window.DeviceAPI.getFirmwareVersion();
      const newVersion = urlContainsFilename[0];

      if (semverIsGreater(currentVersion, newVersion)) {
        this.Logger.info('New Firmware Version available');
        store.dispatch(setFirmwareUpdateAvailable(true));
        return true;
      }
      this.Logger.info('Firmware is up to date');
      store.dispatch(setFirmwareUpdateAvailable(false));
      return false;
    }
    throw new Error('Unable to compare firmware versions from provided url.');
  };

  updateSoftware = (): any => {};

  updateFirmware = async () => {};

  cancelSoftwareUpdate = () => {};

  cancelFirmwareUpdate = () => {};

  /** This is purely for interacting with state through the browser console and should not be called directly in any code */
  dispatch = (type: string, payload: any) => {
    if (process.env.ENVIRONMENT !== 'dev') {
      store.dispatch({ type, payload });
    } else {
      this.Logger.warn('dispatch is disabled in non-development environments.');
    }
  };

  getState = () => {
    return store.getState();
  };

  showMenu = () => {
    const state = store.getState();
    const { currentChannelContainsVideo } = state.deviceState;
    const { shimMenuActive } = state.shimMenu;
    // if the current channel contains video, we need to capture a screenshot of the content, hide the iframe, then display the menu to prevent the video from overlapping with UI elements.
    if (!shimMenuActive && currentChannelContainsVideo) {
      spoofPausedVideoPlayback().then(() => {
        store.dispatch(setMenuStatus(true));
      });
    } else {
      store.dispatch(setMenuStatus(true));
    }
  };

  getTimeZoneMap = () => {
    return {
      MST: 'Mountain Standard Time',
    };
  };

  setTimeZone = (key: string) => {
    console.log('[TIMEZONE] timezone selection changed:', key);
  };

  setTimeServer = (timeServer: string) => {};

  getTimeServer = async (): Promise<string> => {
    return '';
  };

  getDisplayStatus = (): OnOff => {
    return OnOff.On;
  };

  checkInternet = () => {};

  applyProxy = () => {};

  inProxyList = (host: string) => this.knownHosts.includes(host);

  getAllLogsFromDisk = async (): Promise<Log[]> => {
    return [];
  };

  getActiveNetworkInterface = async (): Promise<string> => {
    return 'Default Adapter';
  };

  getNetworkInterfaces = async (): Promise<InterfacePresence> => {
    return {
      wifi: {
        present: true,
      },
      ethernet: {
        present: true,
      },
    };
  };

  clearPlayerCache = async (): Promise<boolean> => true;

  downloadAndCacheContent = async (url: string, filename: string): Promise<string> => {
    // Override in device-specific implementations
    return '';
  };

  getCachedContentPath = (filename: string): string => {
    // Override in device-specific implementations
    return '';
  };

  isCached = async (filename: string): Promise<boolean> => {
    // Override in device-specific implementations
    return false;
  };

  getCacheDirectory = (): string => {
    // Override in device-specific implementations
    return '';
  };

  scanNetworks = async (controller?: AbortController): Promise<{ ssid: string; signal: number }[]> => {
    return [];
  };

  connectToWifiNetwork = async (ssid: string, password: string): Promise<boolean> => {
    return false;
  };

  disableWifi = async (): Promise<boolean> => true;

  getWifiStatus = async (): Promise<{
    ssid: string;
    signalStrength: number;
    connected: boolean;
  }> => {
    return {
      ssid: '',
      signalStrength: 0,
      connected: false,
    };
  };
  hasTouchScreen = async (): Promise<boolean> => false;

  getWebSecurity = async (): Promise<'1' | '0'> => '0';

  enableWebSecurity = async (): Promise<void> => {};
  disableWebSecurity = async (): Promise<void> => {};

  postMessage = (messageObj: Record<string, any> | any) => {
    // only to be used outside of React's context. Otherwise use the useCPWMessaging hook.
    const CPWeb = document.getElementById('player-iframe') as HTMLIFrameElement | null;
    CPWeb?.contentWindow?.postMessage(messageObj);
  };

  getResolutions = async (): Promise<{ modes: string[]; active: string; best: string }> => {
    const active = `${window.innerWidth}x${window.innerHeight}@60`;

    return { modes: ['1920x1080@60', active], active, best: active };
  };

  setResolution = async (width: number, height: number, frequency: number): Promise<boolean> => {
    console.log('Custom Resolutions not supported on this device.');
    return false;
  };

  getNetworkConfig = async (): Promise<NetworkInterfaceConfig | null> => {
    return null;
  };

  setNetworkConfig = async (config: Partial<NetworkInterfaceConfig>) => {
    console.log('Setting network config:', config);
  };

  resetNetworkConfig = async () => {
    console.log('Resetting network config');
  };

  async getDisplayConfig(): Promise<VideoModeScreenConfig[] | undefined> {
    return;
  }

  async setDisplayConfig(config: VideoModeScreenConfig[]): Promise<boolean> {
    console.log('Setting display config:');
    console.table(config);

    console.log('Display config set successfully, Restart required: false');
    return false;
  }

  async getStorageEncryptionStatus(): Promise<{
    encrypted: boolean;
    prerequisitesMet: boolean;
  }> {
    return {
      encrypted: false,
      prerequisitesMet: !!storeExport?.getState().appSettings.softwareUpdateURL ?? true,
    };
  }

  async encryptStorage(encrypt: boolean): Promise<{ msg: string; success: boolean }> {
    return { msg: 'Storage encryption not supported on this device.', success: false };
  }
}

export { DeviceAPI };
