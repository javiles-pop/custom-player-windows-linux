import {
  EXECUTE_COMMAND_RESPONSE,
  GET_SCREENSHOT_RESPONSE,
  ITEM_PLAYED_COMMAND,
  ITEM_STALLED_COMMAND,
  LOADED_COMMAND,
  LOAD_SIGN_COMMAND,
  LogLevel,
  LOG_COMMAND,
  PING_COMMAND,
  PLAY_EVENT_COMMAND,
  SET_PLAYER_COMMAND,
  SHOW_CONFIG_COMMAND,
} from './constants';
import { SendMessage } from './requests';

/**
 * Tells the host that a message has been logged by the player and the specific
 * details that were logged.
 */
export interface LogResponse {
  readonly command: typeof LOG_COMMAND;
  readonly date: string;
  readonly message: string;
  readonly level: LogLevel;
}

/**
 * Asks the host to load or re-load a sign with the provided url.
 */
export interface LoadSignResponse {
  readonly command: typeof LOAD_SIGN_COMMAND;
  readonly signUrl: string;
}

export interface Item {
  readonly id: string;
  readonly name: string;
  readonly type: string;
}

/**
 * Tells the host about the top item played.
 */
export interface ItemPlayedResponse extends Item {
  readonly command: typeof ITEM_PLAYED_COMMAND;
  readonly parent: Item | null;
  readonly subItems: readonly string[];
  readonly totalRows?: number;
  readonly pageRowCount?: number;
  readonly pageStartRowIndex?: number;
  readonly label?: string;
}

/**
 * Tells the host about the top item has stalled and CPWEB should be restarted.
 */
export interface ItemStalledResponse extends Item {
  readonly command: typeof ITEM_STALLED_COMMAND;
  readonly parent: Item | null;
  readonly subItems: readonly string[];
}

/**
 * Tells the host about the current version of CPWEB. This message will be sent
 * after the `SetHostRequest` command.
 */
export interface SetPlayerResponse {
  readonly command: typeof SET_PLAYER_COMMAND;
  readonly version: string;
  readonly deploymentId: string;
  readonly playerName: string;
  readonly logLevel: LogLevel;
  readonly url: string;
}

/**
 * Tells the host whether a execute command request was successful or a failure.
 * This will be sent after the `ExecuteCommandRequest`.
 */
export interface ExecuteCommandResponse {
  readonly command: typeof EXECUTE_COMMAND_RESPONSE;
  readonly success: string;
  readonly error: string;
}

export interface GetScreenshotResponse {
  readonly command: typeof GET_SCREENSHOT_RESPONSE;

  /**
   * This will be a base64 image data string that can be converted into a real
   * `.png`
   */
  readonly image: string;
}

/**
 * Tells the host that the ping request was successful.
 */
export interface PingResponse {
  readonly command: typeof PING_COMMAND;
}

export interface ExecuteFunctResponse {
  funct: string;
  args: {
    name: string;
    attributes: {
      value: Record<string, unknown>;
    };
  };
}

export type MessageResponse =
  | LogResponse
  | LoadSignResponse
  | ItemPlayedResponse
  | ItemStalledResponse
  | SetPlayerResponse
  | ExecuteCommandResponse
  | GetScreenshotResponse
  | PingResponse;

export type ReceiveMessageCallback = (
  message: MessageResponse | ExecuteFunctResponse,
  sendMessage: SendMessage
) => void;

export const RESPONSE_COMMANDS = [
  PING_COMMAND,
  EXECUTE_COMMAND_RESPONSE,
  SET_PLAYER_COMMAND,
  GET_SCREENSHOT_RESPONSE,
  ITEM_PLAYED_COMMAND,
  ITEM_STALLED_COMMAND,
  LOAD_SIGN_COMMAND,
  LOG_COMMAND,
  SHOW_CONFIG_COMMAND,
  PLAY_EVENT_COMMAND,
  LOADED_COMMAND,
] as const;
