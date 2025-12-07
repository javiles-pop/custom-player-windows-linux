import { Logger, Time } from '@core/Util';
import { storeExport as store } from '@core/index';
import { cacheBustCurrentDeployment } from '@core/Deployment';
import {
  setCheckForSoftwareUpdate,
  setAccessCode,
  setEnableOnOffTimers,
  setWantReboot,
  setCheckForFirmwareUpdate,
} from '@core/appState/appSetting';
import { defaultDays, BooleanWeekday } from '@core/GUI/components/ShimMenu/ShimMenuPageTimers';
import { OnOff } from '@core/constants';
import {
  handleItemPlayedCommand,
  handleSetPlayerCommand,
  handleCommandResponse,
  handleRunScriptEnableDailyReboot,
  handleRunScriptUpdateSoftwareUrl,
  handleRunScriptUpdateFirmwareUrl,
  handleRunScriptUpdateSoftwareTime,
  handleRunScriptDailyRebootTime,
  handleRunScriptUpdateFirmwareTime,
  handleRunScriptCheckFirmware,
  handleRunScriptConfigureDeployment,
  handleRunScriptAddDisplayTimer,
  handleRunScriptDeleteDisplayTimer,
  handleRunScriptCheckSoftwareNow,
  handleRunScriptSetOrientation,
  handleRunScriptDeleteDisplayTimers,
  normalizeKeys,
  handleRunScriptSetAccessCode,
  handlePlayEvent,
  handlePublishCommand,
} from './RunScriptHandlers';
import { confirmScriptCommand } from './CloudCommandHandlers';
import { setIsFreshBoot } from '@core/appState/deviceState';
import { ObjectKeys } from '@core/Util/Object';

/** Router responsible for all incoming messages from CP Web. */
export async function CPWebMessageRouter(message: CPWebCommand) {
  const { currentChannelContainsVideo } = store.getState().deviceState;
  const { IsFwiCloudPlaylogEnabled } = store.getState().appSettings;

  // these messages aren't worth noting because they happen so frequently.
  if (message.command !== 'log' && message.command !== 'itemPlayed' && typeof message !== 'string') {
    Logger.debug('[CP WEB] Message received from Web Player: ', message);
  }

  // incoming commands:
  if ('command' in message) {
    switch (message.command) {
      case 'log':
        Logger.playerLog(message as logCommand);
        break;

      case 'itemPlayed':
        await handleItemPlayedCommand(message, currentChannelContainsVideo);
        break;

      case 'setPlayer':
        handleSetPlayerCommand(message);
        break;

      case 'executeCommandResponse':
        handleCommandResponse(message);
        break;

      case 'loadSign':
        Logger.info('[CP WEB] Web Player has requested refreshed sign content.');
        cacheBustCurrentDeployment();
        break;

      case 'showConfiguration':
        Logger.info('[CP WEB] Web Player requested the menu to be opened.');
        window.DeviceAPI.showMenu();
        break;

      case 'playEvent':
        if (IsFwiCloudPlaylogEnabled) {
          handlePlayEvent(message);
        }
        break;

      case 'publishCommand':
        handlePublishCommand(message as PublishCommand);
        break;

      case undefined:
      case 'undefined':
        break;

      case 'loaded':
        store.dispatch(setIsFreshBoot(false));
        break;

      default:
        Logger.warn('Unhandled CPWeb Message: ' + message.command);
        break;
    }
  } else if ('funct' in message) {
    // these are functions that need to be executed on the device via CP Web.
    const executeFunct = message as ExecuteFunctResponse;
    executeCustomRunScript(executeFunct);
  }
}

export async function executeCustomRunScript(script: ExecuteFunctResponse): Promise<boolean> {
  let didRunScriptExecutionFail = false;
  const runScript = store?.getState().appSettings.runScript;
  switch (script.funct) {
    //FIXME: extract these into constants.
    case 'turnOffDisplay':
      window.DeviceAPI?.turnDisplayOnOff(OnOff.Off);
      Logger.info('[RUN SCRIPT] Display Turned Off');
      break;

    case 'turnOnDisplay':
      window.DeviceAPI?.turnDisplayOnOff(OnOff.On);
      Logger.info('[RUN SCRIPT] Display Turned On');
      break;

    case 'rebootNow':
      Logger.info('[RUN SCRIPT] Rebooting');
      if (runScript) {
        confirmScriptCommand(runScript, 'CONFIRMED');
        await window.DeviceAPI?.setSetting('pending_reboot', JSON.stringify(runScript));
      }
      window.DeviceAPI?.reboot();
      break;

    case 'restartApp':
      if (script.args.name === 'RestartPlayer') {
        Logger.info('[RUN SCRIPT] Restarting Player');
        window.DeviceAPI?.restartApp();
      }
      break;

    case 'setAccessCode':
      didRunScriptExecutionFail = handleRunScriptSetAccessCode(script, didRunScriptExecutionFail);
      break;

    case 'removeAccessCode':
      store?.dispatch(setAccessCode({ value: '' }));
      Logger.info('[RUN SCRIPT] Access code is removed');
      break;

    case 'enableDisplayTimers':
      store?.dispatch(setEnableOnOffTimers({ value: true }));
      Logger.info('[RUN SCRIPT] Enabled Display Timers');
      break;

    case 'disableDisplayTimers':
      store?.dispatch(setEnableOnOffTimers({ value: false }));
      Logger.info('[RUN SCRIPT] Disabled Display Timers');
      break;

    case 'toggleSoftwareEnable':
      if (script.args.name === 'PlayerCommandEnableCheckForUpdate') {
        store?.dispatch(setCheckForSoftwareUpdate({ value: true }));
        Logger.info('[RUN SCRIPT] Enabled Check for Software Update');
      } else if (script.args.name === 'PlayerCommandDisableCheckForUpdate') {
        Logger.info('[RUN SCRIPT] Disabled Check for Software Update');
        store?.dispatch(setCheckForSoftwareUpdate({ value: false }));
      } else {
        didRunScriptExecutionFail = true;
      }
      break;

    case 'enableDailyReboot':
      didRunScriptExecutionFail = handleRunScriptEnableDailyReboot(script, didRunScriptExecutionFail);
      break;

    case 'disableDailyReboot':
      Logger.info('[RUN SCRIPT] Disabled Daily Reboot');
      store?.dispatch(setWantReboot({ value: false }));
      break;

    case 'enableFirmwareUpdateCheck':
      Logger.info('[RUN SCRIPT] Enabled Firmware update check');
      store?.dispatch(setCheckForFirmwareUpdate({ value: true }));
      break;

    case 'disableFirmwareUpdateCheck':
      Logger.info('[RUN SCRIPT] Disabled Firmware update check');
      store?.dispatch(setCheckForFirmwareUpdate({ value: false }));
      break;

    case 'updateSoftwareUrl':
      didRunScriptExecutionFail = handleRunScriptUpdateSoftwareUrl(script, didRunScriptExecutionFail);
      break;

    case 'updateFirmwareUrl':
      didRunScriptExecutionFail = handleRunScriptUpdateFirmwareUrl(script, didRunScriptExecutionFail);
      break;

    case 'updateSoftwareTime':
      didRunScriptExecutionFail = handleRunScriptUpdateSoftwareTime(script, didRunScriptExecutionFail);
      break;

    case 'setDailyRebootTime':
      didRunScriptExecutionFail = handleRunScriptDailyRebootTime(script, didRunScriptExecutionFail);
      break;

    case 'updateFirmwareTime':
      didRunScriptExecutionFail = handleRunScriptUpdateFirmwareTime(script, didRunScriptExecutionFail);
      break;

    case 'checkFirmware':
      await handleRunScriptCheckFirmware();
      break;

    case 'configureDeployment':
      didRunScriptExecutionFail = await handleRunScriptConfigureDeployment(script, didRunScriptExecutionFail);
      break;

    case 'addDisplayTimer':
      didRunScriptExecutionFail = handleRunScriptAddDisplayTimer(script, didRunScriptExecutionFail);
      break;

    case 'deleteDisplayTimer':
      didRunScriptExecutionFail = handleRunScriptDeleteDisplayTimer(script, didRunScriptExecutionFail);
      break;

    case 'deleteAllDisplayTimers':
      handleRunScriptDeleteDisplayTimers();
      break;

    case 'checkSoftwareNow':
      await handleRunScriptCheckSoftwareNow();
      break;

    case 'setDisplayOrientation':
      didRunScriptExecutionFail = handleRunScriptSetOrientation(script, runScript, didRunScriptExecutionFail);
      break;

    default:
      didRunScriptExecutionFail = true;
      Logger.info('[RUN SCRIPT] This run script is not executable ', script.funct);
      break;
  }
  if (runScript && didRunScriptExecutionFail) {
    confirmScriptCommand(runScript, 'FAIL');
    Logger.error('[SHIM] Failed executing run script');
  }
  return !didRunScriptExecutionFail;
}

export function createOnAndOffTimer(script: ExecuteFunctResponse): onAndOffTimerSetting | undefined {
  const _displayTimer = script.args.attributes.value;
  const displayTimer = normalizeKeys<FunctionAndOffTimer>(_displayTimer);

  if ('days' in displayTimer && 'timeon' in displayTimer && 'timeoff' in displayTimer) {
    const timer = displayTimer as FunctionAndOffTimer;
    // check if time is valid
    const onTime = new Time(timer.timeon);
    const offTime = new Time(timer.timeoff);
    if (onTime.isValid() && offTime.isValid() && timer.days) {
      const selectedDays = daysSelected(timer.days);
      const onAndOfftimer: onAndOffTimerSetting = {
        days: ObjectKeys(selectedDays).filter((key) => selectedDays[key]) as Days[],
        onTime: onTime.to24hString(),
        offTime: offTime.to24hString(),
      };
      return onAndOfftimer;
    } else {
      Logger.error('[RUN SCRIPT]  Invalid on and off times or days');
    }
  }
  return undefined;
}

const daysSelected = (daysString: string): BooleanWeekday => {
  const allDays = { ...defaultDays };
  const days = daysString.split(' ');
  days?.forEach((eachDay) => {
    for (const day in allDays) {
      if (day.startsWith(eachDay.toUpperCase())) {
        allDays[day] = true;
        break;
      }
    }
  });
  return allDays;
};
