import { ProvisioningStatus, LogLevel, BacklightMode, DeviceOrientation, DiskKeys } from '@core/constants';
import { GlobalLogger } from 'js-logger';
import { getAWSSettingsFromDisk, getDeviceProvisioningFromDisk, timerUUID } from '@core/Util';
import { isOnline } from '@core/Util/isOnline';

export const deviceSettings: DeviceSettings = {
  orientation: DeviceOrientation.DEG_0,
};

export const deviceState: DeviceState = {
  deviceConnected: navigator.onLine,
  deviceOnline: false,
  deviceInfo: '',
  webPlayerRetryID: undefined,
  currentChannelContainsVideo: false,
  firmwareUpdateInProgress: false,
  firmwareUpdateSize: undefined,
  firmwareDownloadProgress: '0%',
  lastSoftwareCheck: new Date(0).toUTCString(),
  softwareUpdateAvailable: false,
  firmwareUpdateAvailable: false,
  isDisplayOn: true,
  activeNetworkInterface: null,
  preferredWifiNetwork: undefined,
  touchScreen: false,
  isFreshBoot: true,
};

export const appSettingsInitialState: AppSettings = {
  activated: false,
  cachedURL: '',
  currentURL: '',
  linkAuthRequired: false,
  env: process.env.REACT_APP_ENVIRONMENT,
  cloudEnv: process.env.REACT_APP_CLOUD_ENV,
  language: '',
  webPlayerBaseURL: '',
  softwareUpdateURL: '',
  firmwareUpdateURL: '',
  accessCode: '',
  backlightMode: BacklightMode.HDMISignal,
  scheduledTasks: [],
  logLevel: LogLevel.DEBUG,
  AWSSettings: undefined,
  deviceID: '',
  companyID: '',
  token: '',
  deviceName: '',
  checkForSoftwareUpdate: false,
  wantReboot: false,
  checkForHardwareUpdate: false,
  enableOnOffTimers: false,
  CECEnabled: false,
  videoWallEnabled: false,
  videoWallBezelComp: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  resolution: 'Auto',
  encryptedStorage: false,
};

export async function getInitialAppSettings(): Promise<AppSettings> {
  let fetchStateFromStorage = {
    accessCode: window.DeviceAPI?.getSetting(DiskKeys.AccessCode),
    activated: window.DeviceAPI.getParsedSetting<boolean>('activated') ?? false,
    AWSSettings: getAWSSettingsFromDisk(),
    CECEnabled: (fecthSettingWithJSONParse(DiskKeys.CECEnabled) as boolean) ?? false,
    checkForHardwareUpdate: (fecthSettingWithJSONParse(DiskKeys.CheckForFirmwareUpdate) as boolean) ?? false,
    checkForHardwareUpdateTime: (fetchSetting(DiskKeys.CheckForFirmwareUpdateTime) as string) ?? undefined,
    checkForSoftwareUpdate: (fecthSettingWithJSONParse(DiskKeys.CheckForSoftwareUpdate) as boolean) ?? false,
    checkForSoftwareUpdateTime: (fetchSetting(DiskKeys.CheckForSoftwareUpdateTime) as string) ?? undefined,
    currentURL: window.DeviceAPI?.getSetting(DiskKeys.CurrentURL),
    deviceID: (fetchSetting('device_id') as string) ?? '',
    deviceName: fetchSetting(DiskKeys.DeviceName) ?? '',
    enableOnOffTimers: (fecthSettingWithJSONParse(DiskKeys.EnableOnOffTimers) as boolean) ?? false,
    firmwareUpdateURL: (fetchSetting(DiskKeys.FirmwareUpdateURL) as string) ?? undefined,
    logLevel: fetchLogLevel(),
    onOffTimers: fetchOnOffTimers(),
    rebootTime: (fetchSetting(DiskKeys.RebootTime) as string) ?? undefined,
    softwareUpdateURL: window.DeviceAPI?.getSetting(DiskKeys.SoftwareUpdateURL),
    resolution: (fetchSetting(DiskKeys.Resolution) as string) ?? 'Auto',
    timeServer: (fetchSetting(DiskKeys.TimeServer) as string) ?? (await window.DeviceAPI.getTimeServer()),
    timeZone: (fetchSetting(DiskKeys.TimeZone) as string) ?? undefined,
    token: fetchSetting('token') ?? '',
    wantReboot: window.DeviceAPI.getParsedSetting<boolean>(DiskKeys.WantReboot) ?? false,
    webPlayerBaseURL: window.DeviceAPI?.getSetting(DiskKeys.WebPlayerURL) ?? '',
    uploadLogTimeInterval: window.DeviceAPI?.getSetting('upload_log_time_interval') ?? '5',
    volume: window.DeviceAPI?.getParsedSetting(DiskKeys.Volume)
      ? Number(window.DeviceAPI?.getParsedSetting(DiskKeys.Volume))
      : undefined,
    IsFwiCloudPlaylogEnabled: window.DeviceAPI?.getParsedSetting<boolean>(DiskKeys.IsFwiCloudPlaylogEnabled) ?? false,
    videoWallEnabled: window.DeviceAPI?.getParsedSetting<boolean>(DiskKeys.VideoWallEnabled) ?? false,
    videoWallBezelComp:
      window.DeviceAPI?.getParsedSetting<BezelCompensation>(DiskKeys.VideoWallBezelComp) ??
      appSettingsInitialState.videoWallBezelComp,
    encryptedStorage: window.DeviceAPI.supportsStorageEncryption
      ? (await window.DeviceAPI.getStorageEncryptionStatus()).encrypted
      : false,
  };

  if (window.DeviceAPI.supportsProxy) {
    fetchStateFromStorage = {
      ...fetchStateFromStorage,
      ...{
        proxyEnabled: fecthSettingWithJSONParse(DiskKeys.UseProxy) ?? false,
        proxyHost: fetchSetting(DiskKeys.ProxyHost) ?? '',
        proxyUser: fetchSetting(DiskKeys.ProxyUser) ?? '',
        proxyPass: fetchSetting(DiskKeys.ProxyPassword) ?? '',
        proxyPort: fetchSetting(DiskKeys.ProxyPort) ?? '',
        proxyBypassBSN: fecthSettingWithJSONParse(DiskKeys.ProxyBypassBSN) ?? false,
        proxyBypassHosts: fecthSettingWithJSONParse(DiskKeys.ProxyBypassDomains) ?? [],
      },
    };
  }
  return {
    ...appSettingsInitialState,
    ...fetchStateFromStorage,
  };
}

function fetchSetting(key: string): any {
  return window.DeviceAPI.getSetting(key);
}

function fecthSettingWithJSONParse(key: string): any {
  return window.DeviceAPI.getParsedSetting(key);
}

export function fetchLogLevel(): LogLevel {
  const logLevel = window.DeviceAPI.getSetting(DiskKeys.LogLevel) as LogLevel;
  if (logLevel) {
    initializeLogLevel(logLevel);
  }
  switch (logLevel) {
    case 'ERROR':
      return LogLevel.ERROR;
    case 'DEBUG':
      return LogLevel.DEBUG;
    case 'INFO':
      return LogLevel.INFO;
    case 'TRACE':
      return LogLevel.TRACE;
    case 'WARN':
      return LogLevel.WARN;
    default:
      return LogLevel.DEBUG;
  }
}

function fetchOnOffTimers(): onAndOffTimerSetting[] | undefined {
  const timers = (fecthSettingWithJSONParse(DiskKeys.OnOffTimers) as onAndOffTimerSetting[]) ?? undefined;
  if (timers) {
    const newTimers = setTimersUUID(timers);
    return newTimers;
  }
  return timers;
}

export function setTimersUUID(timers: onAndOffTimerSetting[]): onAndOffTimerSetting[] {
  const onOffTimers: onAndOffTimerSetting[] = [];
  for (const timer of timers) {
    if (timer.timerUUID) {
      return timers;
    } else {
      timer.timerUUID = timerUUID(timer);
      onOffTimers.push(timer);
    }
  }
  // Write the new UUID's to storage.
  window.DeviceAPI?.setSetting(DiskKeys.OnOffTimers, JSON.stringify(onOffTimers));
  return onOffTimers;
}

export function initializeLogLevel(logLevel: LogLevel) {
  const logger = window.DeviceAPI?.Logger as GlobalLogger;
  if (logger) {
    logger.setLevel(logger[logLevel.toUpperCase() as LogLevel]);

    //@ts-expect-error Element implicitly has an 'any' type because type 'GlobalLogger' has no index signature.
    logger[logLevel.toLowerCase()](`Log level changed to: ${logger.getLevel().name}`);
  }
}

export const shimMenuInitialState: ShimMenu = {
  shimMenuActive: false,
  userCanAccessMenu: false,
};

export const provisioningInitialState: Provisioning = {
  autoProvisioning: ProvisioningStatus.idle,
  autoActivating: ProvisioningStatus.idle,
  inviteCodeProvisioning: ProvisioningStatus.idle,
  inviteCodeActivating: ProvisioningStatus.idle,
};

export const cloudInitialState: Cloud = {
  provisioning: provisioningInitialState,
  inviteCode: undefined,
  provisionedDevicePayload: undefined,
  connected: false,
};

export function getInitialCloudState(): Cloud {
  const getCloudSettingsFromStorage = {
    inviteCode: window.DeviceAPI?.getSetting('invite_code'),
    provisionedDevicePayload: getDeviceProvisioningFromDisk(),
  };
  return {
    ...cloudInitialState,
    ...getCloudSettingsFromStorage,
  };
}

export function getInitialDeviceSettings(): DeviceSettings {
  return {
    ...deviceSettings,
    ...{
      orientation: window.DeviceAPI?.getParsedSetting(DiskKeys.Orientation) ?? DeviceOrientation.DEG_0,
    },
  };
}

export const getInitialDeviceState = async (): Promise<DeviceState> => {
  const deviceOnline = await isOnline();
  const lastSoftwareCheck = window.DeviceAPI.getSetting(DiskKeys.lastSoftwareCheck) ?? new Date(0).toUTCString();
  return {
    ...deviceState,
    ...{ deviceOnline, lastSoftwareCheck },
  };
};

export function getInitialMenuState(): ShimMenu {
  return {
    shimMenuActive: false,
    userCanAccessMenu: !window.DeviceAPI?.getSetting(DiskKeys.AccessCode),
  };
}
