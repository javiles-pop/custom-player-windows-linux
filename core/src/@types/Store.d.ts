interface AppState {
  currentView: CurrentView;
  playState: PlayState;
  WPVersion: string;
  connectedToCloud: boolean;

  appSettings: AppSettings;
  deviceSettings: DeviceSettings;
  deviceState: DeviceState;
  shimMenuActive: ShimMenu;
}

interface AppSettings {
  accessCode?: string;
  activated: boolean;
  AWSSettings?: AWSSettings;
  backlightMode: number;
  cloudEnv?: string;
  companyID?: string;
  cachedURL?: string;
  currentURL?: string;
  deviceID?: string;
  deviceName?: string;
  env?: string;
  firmwareUpdateURL?: string;
  language: string;
  linkAuthRequired: boolean;
  logLevel: LogLevel;
  uploadLogTimeInterval?: string;
  scheduledTasks: ScheduledTask[];
  softwareUpdateURL?: string;
  token?: string;
  webPlayerBaseURL: string;
  checkForSoftwareUpdate: boolean;
  checkForSoftwareUpdateTime?: string;
  wantReboot: boolean;
  rebootTime?: string;
  checkForHardwareUpdate: boolean;
  checkForHardwareUpdateTime?: string;
  enableOnOffTimers: boolean;
  CECEnabled: boolean;
  onOffTimers?: onAndOffTimerSetting[];
  timeZone?: string;
  timeServer?: string;
  logUpdateIntervalId?: LogIntervalId;
  runScript?: ?(RunScriptCommand | ClearCacheCommand | RefreshChannelCommand);
  // idk why, but the linter is moving the "?" from the end of RunScriptCommand to the beginning.
  proxyEnabled?: boolean;
  proxyHost?: string;
  proxyUser?: string;
  proxyPass?: string;
  proxyPort?: string;
  proxyBypassHosts?: string[];
  proxyBypassBSN?: boolean;
  volume?: number;
  IsFwiCloudPlaylogEnabled?: boolean;
  videoWallEnabled?: boolean;
  videoWallBezelComp?: BezelCompensation;
  resolution: ShadowResolution;
  encryptedStorage?: boolean;
}

declare enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  TRACE = 'TRACE',
}
interface ShimMenu {
  shimMenuActive: boolean;
  userCanAccessMenu: boolean;
}

interface DeviceSettings {
  orientation: DeviceOrientation;
}

interface DeviceState {
  deviceConnected: boolean; // this is whether or not the device is connected to some networking device
  deviceOnline: boolean; // this is whether or not the device can reach the internet
  deviceInfo: any;
  feedbackMessageForSoftwareUpdate?: UserFeedbackMessage;
  feedbackMessageForFirmwareUpdate?: UserFeedbackMessage;
  webPlayerRetryID?: number | ReturnType<typeof setTimeout>;
  currentChannelContainsVideo: boolean;
  firmwareUpdateInProgress: boolean;
  firmwareUpdateSize?: number;
  firmwareDownloadProgress?: string;
  lastSoftwareCheck: string;
  firmwareUpdateAvailable: boolean;
  softwareUpdateAvailable: boolean;
  isDisplayOn: boolean;
  feedbackMessageForCloudLogUpload?: UserFeedbackMessage;
  activeNetworkInterface: 'wifi' | 'ethernet' | 'default' | null;
  preferredWifiNetwork?: string;
  touchScreen: boolean;
  isFreshBoot: boolean;
}

interface ScheduledTask {
  id: number | NodeJS.Timeout;
  executionTime: Date;
  name?: string;
  action?: any;
  payload?: any;
}

interface LogIntervalId {
  id: number | ReturnType<typeof setTimeout>;
}

declare enum DeviceOrientation {
  DEG_0 = 0,
  DEG_90 = 90,
  DEG_180 = 180,
  DEG_270 = 270,
}

declare enum PlayState {
  PLAYING,
  SUSPENDED,
  UNINITIALIZED,
  STOPPED,
}

declare enum CurrentView {
  ACTIVATION,
  PLAYER,
  SETTINGS,
  UNKNOWN,
}

interface onAndOffTimerSetting {
  days: Weekday[];
  offTime: string;
  onTime: string;
  timerUUID?: string;
}
interface onAndOffTimerSetting {
  days: Weekday[];
  offTime: string;
  onTime: string;
  timerUUID?: string;
}

type Weekday = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

declare enum Days {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
}

interface updateStateWithString {
  value: string;
  ignoreUpdateToCloud?: boolean;
}

interface updateStateWithBoolean {
  value: boolean;
  ignoreUpdateToCloud?: boolean;
}

interface updateStateWithNumber {
  value: number;
  ignoreUpdateToCloud?: boolean;
}

interface updateStateWithLogLevel {
  value: LogLevel;
  ignoreUpdateToCloud?: boolean;
}

interface updateStateWithOnOffTimers {
  value: onAndOffTimerSetting[];
  ignoreUpdateToCloud?: boolean;
}

interface UpdateStateWithProxyObject {
  value: ShadowProxy;
  ignoreUpdateToCloud: ?boolean;
}

interface updateStateWithOrientation {
  value: DeviceOrientation;
  ignoreUpdateToCloud?: boolean;
}

interface UserFeedbackMessage {
  message: string;
  color: string;
}
interface useFeedbackOptions {
  defaultMessage?: UserFeedbackMessage;
  persistent?: boolean;
}

interface BezelCompensation {
  top: number;
  left: number;
  bottom: number;
  right: number;
}
