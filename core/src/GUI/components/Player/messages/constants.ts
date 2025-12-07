export const TRACE = 'TRACE';
export const DEBUG = 'DEBUG';
export const INFO = 'INFO';
export const WARN = 'WARN';
export const ERROR = 'ERROR';

export type LogLevel = typeof TRACE | typeof DEBUG | typeof INFO | typeof WARN | typeof ERROR;

export const SET_HOST_COMMAND = 'setHost';
export const PING_COMMAND = 'ping';
export const EXECUTE_COMMAND = 'executeCommand';
export const START_COMMAND = 'start';
export const STOP_COMMAND = 'stop';
export const UPDATE_LABELS_COMMAND = 'updatelabels';
export const UPLOAD_LOGS_COMMAND = 'uploadLogs';
export const GET_SCREENSHOT_COMMAND = 'getScreenshot';
export const SHOW_CONFIG_COMMAND = 'showConfiguration';
export const PLAY_EVENT_COMMAND = 'playEvent';
export const LOADED_COMMAND = 'loaded';

export const LOG_COMMAND = 'log';
export const LOAD_SIGN_COMMAND = 'loadSign';
export const ITEM_PLAYED_COMMAND = 'itemPlayed';
export const ITEM_STALLED_COMMAND = 'itemStalled';
export const SET_PLAYER_COMMAND = 'setPlayer';
export const EXECUTE_COMMAND_RESPONSE = 'executeCommandResponse';
export const GET_SCREENSHOT_RESPONSE = 'getScreenshotResponse';
