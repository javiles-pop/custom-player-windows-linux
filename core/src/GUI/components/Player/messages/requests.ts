import {
  EXECUTE_COMMAND,
  GET_SCREENSHOT_COMMAND,
  LOAD_SIGN_COMMAND,
  LogLevel,
  PING_COMMAND,
  SET_HOST_COMMAND,
  START_COMMAND,
  STOP_COMMAND,
  UPDATE_LABELS_COMMAND,
  UPLOAD_LOGS_COMMAND,
} from './constants';

export interface SetHostOptions {
  readonly deviceId?: string;
  readonly deviceName?: string;
  readonly platform?: string;
  readonly hostVersion?: string;
  readonly logLevel?: LogLevel;
  readonly time?: number | Date | string;
  readonly enableScreenshot?: boolean;
}

export interface SetHostRequest extends SetHostOptions {
  readonly command: typeof SET_HOST_COMMAND;
  readonly cloudAccessToken: string;
}

export interface PingRequest {
  readonly command: typeof PING_COMMAND;
}

export interface ExecuteCommandRequest {
  readonly command: typeof EXECUTE_COMMAND;
  readonly commandName: string;
  readonly attributes: Record<string, unknown>;
}

export interface LoadSignRequest {
  readonly command: typeof LOAD_SIGN_COMMAND;
  readonly signUrl: string;
  readonly credentials?: string;
}

export interface StartSignRequest {
  readonly command: typeof START_COMMAND;
}

export interface StopSignRequest {
  readonly command: typeof STOP_COMMAND;
}

export interface UpdateLabelsRequest {
  readonly command: typeof UPDATE_LABELS_COMMAND;
}

export interface UploadLogsRequest {
  readonly command: typeof UPLOAD_LOGS_COMMAND;
}

export interface ScreenshotOptions {
  /**
   * An optional height ot use for the screenshot. When this is omitted, it
   * defaults to the current iframe's height.
   */
  readonly height?: number;

  /**
   * An optional width ot use for the screenshot. When this is omitted, it
   * defaults to the current iframe's width.
   */
  readonly width?: number;
}

export interface GetScreenshotRequest extends ScreenshotOptions {
  readonly command: typeof GET_SCREENSHOT_COMMAND;
}

export type MessageRequest =
  | SetHostRequest
  | PingRequest
  | ExecuteCommandRequest
  | GetScreenshotRequest
  | LoadSignRequest
  | StartSignRequest
  | StopSignRequest
  | UpdateLabelsRequest
  | UploadLogsRequest;

export type SendMessage = (message: MessageRequest) => void;

/**
 * This can be used to update the access token to CPWEB. Once this command is
 * sent, the player will respond with the `SetPlayerResponse`.
 */
export function setHost(cloudAccessToken: string, additionalParams?: SetHostOptions): SetHostRequest {
  return { command: SET_HOST_COMMAND, cloudAccessToken, ...additionalParams };
}

/**
 * Pings to player just to check if it is running. The player will respond with
 * the `PingResponse`
 */
export function ping(): PingRequest {
  return { command: PING_COMMAND };
}

/**
 * Tells the player to execute the given player command immediately. The player
 * will respond with the `ExecuteCommandResponse`.
 *
 * Note: You'll generally want to use one of the wrappers in the
 * `commands.ts` file since this should be all _known_ commands and
 * parameters required
 */
export function executeCommand(commandName: string, attributes: Record<string, unknown> = {}): ExecuteCommandRequest {
  return { command: EXECUTE_COMMAND, commandName, attributes };
}

/**
 * Loads a sign from the provided url.
 */
export function loadSign(signUrl: string, credentials?: string): LoadSignRequest {
  return { command: LOAD_SIGN_COMMAND, signUrl, credentials };
}

/**
 * Starts or restarts the current sign.
 */
export function startSign(): StartSignRequest {
  return { command: START_COMMAND };
}

/**
 * Stops the current sign.
 */
export function stopSign(): StopSignRequest {
  return { command: STOP_COMMAND };
}

/**
 * Tells the player to update its set of Cloud labels which is normally fired
 * once a change to a device's labels in FWI Cloud has been applied.
 */
export function updateLabels(): UpdateLabelsRequest {
  return { command: UPDATE_LABELS_COMMAND };
}

/**
 * Tells the player to upload its current logs immediately to FWI Services
 * (assuming valid connection properties have been stated in deployment)
 */
export function uploadLogs(): UploadLogsRequest {
  return { command: UPLOAD_LOGS_COMMAND };
}

/**
 * This requires the `setPlayer` command to be triggered beforehand with the
 * `enableScreenshot` flag enabled.
 *
 * Once the player receives the command, it captures the screenshot and sends it
 * back with the GetScreenshotResponse
 *
 * @param options An optional object of screenshot options to provide
 */
export function getScreenshot(options: ScreenshotOptions = {}): GetScreenshotRequest {
  return { command: GET_SCREENSHOT_COMMAND, ...options };
}
