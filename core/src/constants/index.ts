export enum UIColor {
  // badges.
  Error = 'error',
  Grey_dark = 'grey_dark',
  Grey_extra_light = 'grey_extra_light',
  Grey_light = 'grey_light',
  Grey_med = 'grey_med',
  Orange = 'orange',
  Pink = 'pink',
  Purple = 'purple',
  Success = 'success',
  Warning = 'warning',
  White = 'white',
  Yellow = 'yellow',
}

export enum Keyboard {
  // Navigation
  UP = 'ArrowUp',
  DOWN = 'ArrowDown',
  LEFT = 'ArrowLeft',
  RIGHT = 'ArrowRight',

  // Primary Action Keys
  TAB = 'Tab',
  ENTER = 'Enter',
  SELECT = 'Select',
  SPACE = ' ',

  // Modifiers
  SHIFT = 'Shift',
  CTRL = 'Control',
  ALT = 'Alt',

  // Page Control
  BACK = 'Back',
  ESC = 'Escape',
  PAGE_UP = 33,
  PAGE_DOWN = 34,
  BACKSPACE = 'Backspace',
  DELETE = 'Delete',
  END = 35,
  EXIT = 'Exit',

  // Remote Control Buttons
  RED = 403,
  GREEN = 404,
  YELLOW = 405,
  BLUE = 406,

  // Alphabetical
  C = 'c',
  D = 'd',
  O = 'o',
  R = 'r',

  //Numeric
  ZERO = '0',
  NINE = '9',

  // Misc
  ALTC = 'ç',
}

// used by Menu bar
export enum TimeFormats {
  DateTime = 'E MMMM d, yyy h:mm a',
}

// Details page constants
export const DEPLOYMENT = 'deployment';
export const LOGGING = 'logging';
export const TIMERS = 'timers';
export const ACCESS_CODE = 'access_code';
export const DISPLAY_ORIENTATION = 'display_orientation';
export const ADVANCED = 'advanced';
export const ABOUT = 'about';
export const UPDATES = 'updates';

// Advanced Page contants
export const REBOOT_WINDOW = process.env.NODE_ENV === 'development' ? 5 : 60;

export enum ProvisioningStatus {
  idle,
  inProgress,
  success,
  error,
  awaitingResponse,
}

export enum BacklightMode {
  HDMISignal,
  HDMICEC,
}

export enum ActivationErrorMessages {
  hardwareNumberError = 'Device could not be found by hardwareNumbers',
  activationError = 'Unable to activate the device',
  inviteCodeError = 'Matching invite code was not found',
  notPendingState = 'Device unable to be provisioned. Device is not in a pending status',
}

export enum activationStatus {
  activated = 'activated',
  deleted = 'deleted',
}

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  TRACE = 'TRACE',
}

export enum DeviceOrientation {
  DEG_0 = 0,
  DEG_90 = 90,
  DEG_180 = 180,
  DEG_270 = 270,
}

export enum Days {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
}

// these are the keys used by localStorage and the BS registry.
export enum DiskKeys {
  CurrentURL = 'current_url',
  AccessCode = 'access_code',
  channel = 'channel',
  SoftwareUpdateURL = 'software_update_url',
  CheckForSoftwareUpdate = 'check_for_software_update',
  CheckForSoftwareUpdateTime = 'check_for_software_update_time',
  WantReboot = 'want_reboot',
  RebootTime = 'reboot_time',
  FirmwareUpdateURL = 'firmware_update_url',
  CheckForFirmwareUpdate = 'check_for_firmware_update',
  CheckForFirmwareUpdateTime = 'check_for_firmware_update_time',
  EnableOnOffTimers = 'enable_on_off_timers',
  OnOffTimers = 'on_off_timers',
  FWIServicesEnabled = 'fwi_services_enabled',
  LogLevel = 'log_level',
  DeviceName = 'devicename',
  WebPlayerURL = 'web_player_url',
  CECEnabled = 'cec_enabled',
  TimeZone = 'time_zone',
  TimeServer = 'time_server',
  Orientation = 'orientation',
  lastSoftwareCheck = 'last_software_check',
  AWSSettings = 'aws_settings',
  ProvisionedDevicePayload = 'provisioned_device',

  UseProxy = 'proxy_enabled',
  ProxyHost = 'proxy_host',
  ProxyUser = 'proxy_user',
  ProxyPassword = 'proxy_pass',
  ProxyPort = 'proxy_port',
  ProxyBypassDomains = 'proxy_bypass_list',
  ProxyBypassBSN = 'bsn_proxy_enabled',
  Volume = 'Volume',
  LastBoot = 'last_boot',
  Resolution = 'resolution',
  IsFwiCloudPlaylogEnabled = 'is_fwi_cloud_playlog_enabled',
  VideoWallEnabled = 'video_wall_enabled',
  VideoWallBezelComp = 'video_wall_bezel_comp',
  EncryptedStorage = 'encrypted_storage',
}

// Used by Harmony in the shadow. Defined in
// https://bitbucket.fourwindsinteractive.com/projects/SVC/repos/configurations/browse
export enum Shadow {
  CurrentURL = 'CurrentURL',
  AccessCode = 'AccessCode',
  channel = 'channel',
  SoftwareUpdateURL = 'SoftwareUpdateURL',
  CheckForSoftwareUpdate = 'CheckForSoftwareUpdate',
  CheckForSoftwareUpdateTime = 'CheckForSoftwareUpdateTime',
  WantReboot = 'WantReboot',
  RebootTime = 'RebootTime',
  FirmwareUpdateURL = 'FirmwareUpdateURL',
  CheckForFirmwareUpdate = 'CheckForFirmwareUpdate',
  CheckForFirmwareUpdateTime = 'CheckForFirmwareUpdateTime',
  EnableOnOffTimers = 'EnableOnOffTimers',
  OnOffTimers = 'OnOffTimers',
  FWIServicesEnabled = 'FWIServicesEnabled',
  LogLevel = 'LogLevel',
  name = 'name',
  WebPlayerURL = 'WebPlayerURL',
  CECEnabled = 'CECEnabled',
  TimeZone = 'TimeZone',
  TimeServer = 'TimeServer',
  Orientation = 'Orientation',
  UploadLogTimeInterval = 'UploadLogTimeInterval',
  Volume = 'Volume',
  Resolution = 'Resolution',
  EncryptedStorage = 'EncryptedStorage',
}

export enum LogUploadTimeIntervals {
  fiveMinutes = '5 Minutes',
  fifteenMinutes = '15 Minutes',
  hour = 'Hour',
  sixHours = '6 Hours',
  twelveHours = '12 Hours',
  day = 'Day',
}

export enum TaskName {
  UploadLogs12h = 'Upload logs every 12 hours',
  UploadLogs24h = 'Upload logs every 24 hours',
}

export enum DeviceManufacturer {
  BrightSign = 'BrightSign',
  SSP = 'Samsung',
  LG = 'LGE',
  Windows = 'Windows',
  Linux = 'Linux',
  Unknown = 'n/a',
}

export enum TimerType {
  Custom = 'custom',
  Daily = 'daily',
}

export enum CPWebContentType {
  DynamicMedia = 'DynamicMedia',
  HtmlContent = 'HtmlContent',
  VideoContent = 'VideoContent',
}

export enum CloudCommand {
  CheckDeployment = 'CheckDeployment',
  ClearCache = 'ClearCache',
  RunScript = 'RunScript',
}

export enum OnOff {
  On = 'on',
  Off = 'off',
}

export enum ShadowResolution {
  AUTO = 'Auto',
  UHD = '4K',
  FHD = '1080p',
  HD = '720p',
  '1024x768' = '1024x768',
  CUSTOM = 'Custom',
}

export const STOP_COMMAND = { command: 'stop' };
