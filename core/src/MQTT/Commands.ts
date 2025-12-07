import { Logger, runTaskAtTime } from '@core/Util';
import { storeExport as store } from '@core/index';
import {
  executeCommand,
  LogLevel as CPWebLogLevel,
  MessageRequest,
  SendMessage,
  SetHostRequest,
} from '@core/GUI/components/Player';
import {
  handleScreenshotCommand,
  handlePlayerCommandRunScript,
  handlePlayerCommandClearCache,
  handlePlayerCommandReboot,
  handlePlayerCommandCheckDeployment,
  handleCloudChannelBroadcast,
  confirmScriptCommand,
  handleLogCommand,
  handleReaderIdCommand,
  handleGenericPlayerCommand,
} from './CloudCommandHandlers';
import { probeForInternetConnectivity } from '@core/Flows/NetworkChangeFlow';
import { MutableRefObject } from 'react';

export function CommandMessageRouter(messageObj: MQTTMessage) {
  switch (messageObj.command) {
    case 'screenshot':
      handleScreenshotCommand(messageObj);
      break;

    case 'log':
      handleLogCommand(messageObj as cloudLogUploadResponse);
      break;

    case 'playerCommand':
      if ('commandName' in messageObj) {
        switch (messageObj.commandName) {
          case 'RunScript':
            handlePlayerCommandRunScript(messageObj);
            break;

          case 'ClearCache':
            handlePlayerCommandClearCache(messageObj);
            break;

          case 'Reboot':
            handlePlayerCommandReboot(messageObj);
            break;

          case 'CheckDeployment':
            handlePlayerCommandCheckDeployment(messageObj);
            break;

          case 'SendReaderId':
          case 'PlayerCommandSendReaderId':
            handleReaderIdCommand(messageObj as ReaderIdCommand);
            break;

          default:
            handleGenericPlayerCommand(messageObj as CloudCommand);
            break;
        }
      } else {
        Logger.error('[COMMAND] Player Command sent no command name to run.', messageObj);
      }
      break;

    case undefined:
      if ('channel' in messageObj) {
        handleCloudChannelBroadcast(messageObj as ChannelUpdateMessage);
      } else {
        // Ignore the following cases
        console.log('undefined command.', messageObj);
      }
      break;

    default:
      Logger.warn(`[COMMAND] Unhandled command ${messageObj.command}`, messageObj);
      break;
  }
}

export function getSetHostPayload(logLevel: CPWebLogLevel) {
  const { deviceID, deviceName, companyID, IsFwiCloudPlaylogEnabled } = store.getState().appSettings;

  return {
    logLevel,
    // logLevel: process.env.NODE_ENV === 'development' ? 'WARN' : logLevel,
    deviceName,
    deviceId: deviceID,
    hostVersion: process.env.REACT_APP_VERSION,
    platform: window.DeviceAPI?.getManufacturer(),
    playLoggingEnabled: IsFwiCloudPlaylogEnabled,
    ptpDomain: companyID,
  };
}

/** Recursive on failure. Allows us to send and receive messages from the CPWeb component. */
export function initCPWebComms(
  sendMessage: (message: MessageRequest) => void,
  setHost: (cloudAccessToken: string, additionalParams?: any | undefined) => SetHostRequest,
  token: string,
  logLevel: CPWebLogLevel,
  attempt = 1
) {
  const now = new Date().getTime();
  // this event is cancelled when the connection is established.
  // See: CPWebCommunications.ts under case 'setPlayer'

  if (attempt >= 36) {
    // if we still can't establish comms with CPWeb after 3 minutes, restart the player.
    Logger.warn('[CP WEB] Failed to establish communication with CP Web after 3 minutes. Restarting player...');
    window.DeviceAPI.restartApp();
  }

  runTaskAtTime(
    () => {
      Logger.info(`[CP WEB] ${attempt}) Establishing communication with CP Web...`);
      sendMessage(setHost(token, getSetHostPayload(logLevel)));
      initCPWebComms(sendMessage, setHost, token, logLevel, attempt + 1);
      probeForInternetConnectivity();
    },
    new Date(now + 5000),
    'web player retry'
  );
}

export function executeCloudCommand(
  cloudCommand: CloudCommand,
  iframe: MutableRefObject<HTMLIFrameElement | null>,
  sendMessage: SendMessage
) {
  try {
    if (iframe.current) {
      setTimeout(() => {
        try {
          Logger.info('[COMMAND] Passing RunScript info to CP Web...');
          sendMessage(executeCommand(cloudCommand.commandName, cloudCommand.attributes));
        } catch (error) {
          Logger.error('[CP WEB] Failed executing run script ', error);
          confirmScriptCommand(cloudCommand, 'FAIL');
        }
      }, 2000);
    } else {
      Logger.error('[CP WEB] Failed executing run script as there is no sign playing currently');
      confirmScriptCommand(cloudCommand, 'FAIL');
    }
  } catch {
    Logger.error('[CP WEB] Failed executing run script due to timeout ');
    confirmScriptCommand(cloudCommand, 'FAIL');
  }
}

/** we save a flag to disk when rebooting remotely. this checks for that flag and lets cloud know when it's finished */
export function checkForPendingReboot() {
  const rebootCommand: RebootCommand | null = window.DeviceAPI.getParsedSetting('pending_reboot');

  if (rebootCommand) {
    Logger.info('[COMMAND] Confirming successful device reboot with Cloud', rebootCommand);
    confirmScriptCommand(rebootCommand, 'SUCCESS');
    window.DeviceAPI.deleteSetting('pending_reboot');
  }
}
