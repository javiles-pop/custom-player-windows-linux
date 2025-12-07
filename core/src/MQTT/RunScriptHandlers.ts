import {
  setOnOffTimers,
  setCurrentURL,
  setCheckForFirmwareUpdateTime,
  setRebootTime,
  setCheckForSoftwareUpdateTime,
  setFirmwareUpdateURL,
  setSoftwareUpdateURL,
  setWantReboot,
  setLogLevel,
  setAccessCode,
} from '@core/appState/appSetting';
import { storeExport as store } from '@core/index';
import { setCurrentChannelContainsVideo } from '@core/appState/deviceState';
import { setWebPlayerVersion, setChannelName } from '@core/appState/fwiCloud';
import { CloudCommand, CPWebContentType } from '@core/constants';
import { getFinalSignURL } from '@core/Deployment';
import {
  convertStringToDisplayOrientation,
  timerUUID,
  dequeueTaskByName,
  Time,
  isValidURLFormat,
  randomUUID,
} from '@core/Util';
import Logger from 'js-logger';
import { createOnAndOffTimer } from './CPWebCommunications';
import { setDisplayOrientation } from '@core/appState/deviceSettings';
import { confirmScriptCommand } from './CloudCommandHandlers';
import { ObjectKeys } from '@core/Util/Object';

export function handleRunScriptSetOrientation(
  script: ExecuteFunctResponse,
  runScript: RunScriptCommand | ClearCacheCommand | RefreshChannelCommand | null | undefined,
  didRunScriptExecutionFail: boolean
) {
  const _orientationValue = script.args.attributes.value;
  const orientationValue = normalizeKeys<FunctDisplayOrientation>(_orientationValue);
  if ('rotationangle' in orientationValue) {
    const angle = (orientationValue as FunctDisplayOrientation).rotationangle;
    const orientation: DeviceOrientation = convertStringToDisplayOrientation(angle);
    store?.dispatch(setDisplayOrientation({ value: orientation }));
    if (runScript) {
      confirmScriptCommand(runScript, 'SUCCESS');
    }
  } else {
    didRunScriptExecutionFail = true;
  }
  return didRunScriptExecutionFail;
}

export function handleRunScriptSetAccessCode(script: ExecuteFunctResponse, didRunScriptExecutionFail: boolean) {
  const _code = normalizeKeys<ExecuteCommandAttributeValue>(script.args.attributes.value);
  if ('accesscode' in _code) {
    const code = _code.accesscode as string;
    if (code.length && code.match(/^\d{1,7}$/)) {
      Logger.info('[RUN SCRIPT] New Access code set');
      store?.dispatch(setAccessCode({ value: code }));
    } else {
      didRunScriptExecutionFail = true;
      Logger.error('[RUN SCRIPT] Can not set the Access code since its not valid');
    }
  } else {
    didRunScriptExecutionFail = true;
    Logger.error('[RUN SCRIPT] Can not set the Access code since its not valid');
  }
  return didRunScriptExecutionFail;
}

export async function handleRunScriptCheckSoftwareNow() {
  const updateAvailable = await window.DeviceAPI?.checkForSoftwareUpdate();
  if (updateAvailable) {
    Logger.info('[RUN SCRIPT] updating Software now');
    await window.DeviceAPI.updateSoftware();
  }
}

export function handleRunScriptDeleteDisplayTimer(script: ExecuteFunctResponse, didRunScriptExecutionFail: boolean) {
  const onOffTimers = store.getState().appSettings.onOffTimers;
  const deleteOnOffTimer = createOnAndOffTimer(script);
  if (onOffTimers && deleteOnOffTimer) {
    deleteOnOffTimer.timerUUID = timerUUID(deleteOnOffTimer);
    const index = onOffTimers.findIndex((t) => t.timerUUID === deleteOnOffTimer?.timerUUID);
    if (index >= 0) {
      const newTimersArray = [...onOffTimers];
      newTimersArray.splice(index, 1);
      Logger.info('[RUN SCRIPT] on and off timer is removed');
      store.dispatch(setOnOffTimers({ value: newTimersArray }));
    } else {
      didRunScriptExecutionFail = true;
      Logger.error('[RUN SCRIPT]  Can not delete the timer since it is not present');
    }
  } else {
    didRunScriptExecutionFail = true;
  }
  return didRunScriptExecutionFail;
}

export function handleRunScriptAddDisplayTimer(script: ExecuteFunctResponse, didRunScriptExecutionFail: boolean) {
  const onOffTimers = store.getState().appSettings.onOffTimers;
  const addOnOffTimer = createOnAndOffTimer(script);
  if (addOnOffTimer) {
    addOnOffTimer.timerUUID = timerUUID(addOnOffTimer);
    if (onOffTimers) {
      if (onOffTimers.some((t) => t.timerUUID === addOnOffTimer?.timerUUID)) {
        // duplicate timer
        didRunScriptExecutionFail = true;
        Logger.error('[RUN SCRIPT]  Timer with these values already exists');
      } else {
        Logger.info('[RUN SCRIPT] new on and off timer is set');
        store.dispatch(setOnOffTimers({ value: [...onOffTimers, addOnOffTimer] }));
      }
    } else {
      Logger.info('[RUN SCRIPT] new on and off timer is set');
      store.dispatch(setOnOffTimers({ value: [addOnOffTimer] }));
    }
  } else {
    didRunScriptExecutionFail = true;
  }
  return didRunScriptExecutionFail;
}

export async function handleRunScriptConfigureDeployment(
  script: ExecuteFunctResponse,
  didRunScriptExecutionFail: boolean
) {
  const signUrl = extractUrlFromScript(script);
  if (signUrl) {
    const finalURL = await getFinalSignURL(signUrl);
    if (finalURL) {
      Logger.info('[RUN SCRIPT] channel url is set');
      store.dispatch(setCurrentURL({ value: finalURL }));
    } else {
      Logger.error('[RUN SCRIPT] Invalid channel url');
      didRunScriptExecutionFail = true;
    }
  } else {
    didRunScriptExecutionFail = true;
  }
  return didRunScriptExecutionFail;
}

export async function handleRunScriptCheckFirmware() {
  const newUpdateAvailable = await window.DeviceAPI?.checkForFirmwareUpdate();
  if (newUpdateAvailable) {
    Logger.info('[RUN SCRIPT] updating Firmware now');
    window.DeviceAPI?.updateFirmware();
  }
}

export function handleRunScriptUpdateFirmwareTime(script: ExecuteFunctResponse, didRunScriptExecutionFail: boolean) {
  const firmwareTime = setTimeFromScript(script);
  if (firmwareTime) {
    Logger.info('[RUN SCRIPT] Firmware update time is set');
    store?.dispatch(setCheckForFirmwareUpdateTime({ value: firmwareTime }));
  } else {
    didRunScriptExecutionFail = true;
  }
  return didRunScriptExecutionFail;
}

export function handleRunScriptDailyRebootTime(script: ExecuteFunctResponse, didRunScriptExecutionFail: boolean) {
  const rebootTime = setTimeFromScript(script);
  if (rebootTime) {
    Logger.info('[RUN SCRIPT] reboot update time is set');
    store?.dispatch(setRebootTime({ value: rebootTime }));
  } else {
    didRunScriptExecutionFail = true;
  }
  return didRunScriptExecutionFail;
}

export function handleRunScriptUpdateSoftwareTime(script: ExecuteFunctResponse, didRunScriptExecutionFail: boolean) {
  const softwareTime = setTimeFromScript(script);
  if (softwareTime) {
    Logger.info('[RUN SCRIPT] Software update time is set');
    store?.dispatch(setCheckForSoftwareUpdateTime({ value: softwareTime }));
  } else {
    didRunScriptExecutionFail = true;
  }
  return didRunScriptExecutionFail;
}

export function handleRunScriptUpdateFirmwareUrl(script: ExecuteFunctResponse, didRunScriptExecutionFail: boolean) {
  const firmwareUrl = extractUrlFromScript(script);
  if (firmwareUrl) {
    Logger.info('[RUN SCRIPT] Firmware update URL is set');
    store?.dispatch(setFirmwareUpdateURL({ value: firmwareUrl }));
  } else {
    didRunScriptExecutionFail = true;
  }
  return didRunScriptExecutionFail;
}

export function handleRunScriptUpdateSoftwareUrl(script: ExecuteFunctResponse, didRunScriptExecutionFail: boolean) {
  const softwareUrl = extractUrlFromScript(script);
  if (softwareUrl) {
    Logger.info('[RUN SCRIPT] Software update URL is set');
    store?.dispatch(setSoftwareUpdateURL({ value: softwareUrl }));
  } else {
    didRunScriptExecutionFail = true;
  }
  return didRunScriptExecutionFail;
}

export function handleRunScriptEnableDailyReboot(script: ExecuteFunctResponse, didRunScriptExecutionFail: boolean) {
  const dailyRebootTime = setTimeFromScript(script);
  if (dailyRebootTime) {
    Logger.info('[RUN SCRIPT] Enabled Daily Reboot');
    store?.dispatch(setWantReboot({ value: true }));
    store?.dispatch(setRebootTime({ value: dailyRebootTime }));
  } else {
    didRunScriptExecutionFail = true;
  }
  return didRunScriptExecutionFail;
}

export function handleRunScriptDeleteDisplayTimers() {
  const onOffTimers = store?.getState().appSettings.onOffTimers;
  if (onOffTimers) {
    Logger.info('[RUN SCRIPT] on and off timers are removed');
    store.dispatch(setOnOffTimers({ value: [] }));
  }
}

export function handleCommandResponse(message: CPWebCommand) {
  const cmd = message as executeCommandResponse;
  if (
    cmd.commandName === CloudCommand.RunScript ||
    cmd.commandName === CloudCommand.ClearCache ||
    cmd.commandName === CloudCommand.CheckDeployment
  ) {
    const script = store.getState().appSettings.runScript;
    if (cmd.success && script) {
      confirmScriptCommand(script, 'SUCCESS');
      Logger.info('[CP WEB] Successfully executed run script');
    } else if (cmd.error && script) {
      confirmScriptCommand(script, 'FAIL');
      Logger.error('[CP WEB] Failed executing run script');
    } else if (script) {
      confirmScriptCommand(script, 'CONFIRMED');
    }
  }
}

export function handleSetPlayerCommand(message: CPWebCommand) {
  const command = message as setPlayerCommand;
  if (command.logLevel && command.logLevel !== store.getState().appSettings.logLevel) {
    if (['DEBUG', 'INFO', 'WARN', 'ERROR', 'TRACE'].includes(command.logLevel)) {
      store.dispatch(setLogLevel({ value: command.logLevel }));
    } else {
      Logger.warn(`"${command.logLevel}" is not a supported value for WebLogLevel.`);
      store.dispatch(setLogLevel({ value: 'WARN' as LogLevel }));
    }
  }
  store.dispatch(setWebPlayerVersion(command.version));
  store.dispatch(setChannelName(command.playerName));
  Logger.info('[CP WEB] Successfully set iframe host.');
  dequeueTaskByName('web player retry');
}

export async function handleItemPlayedCommand(_message: CPWebCommand, currentChannelContainsVideo: boolean) {
  const message = _message as itemPlayedCommand;

  if (message.type === CPWebContentType.VideoContent && !currentChannelContainsVideo) {
    store.dispatch(setCurrentChannelContainsVideo(true));
  }

  if (
    (message.type === CPWebContentType.HtmlContent && !currentChannelContainsVideo) ||
    (message.type === CPWebContentType.DynamicMedia && !currentChannelContainsVideo)
  ) {
    if (await HTMLContentContainsVideoTag()) {
      store.dispatch(setCurrentChannelContainsVideo(true));
    }
  }

  // Sometimes a video can be played as ImageContent, but we don't want to scan the DOM for every single image. So we'll only scan if the filename contains .mp4 for performance reasons.
  if (message.name.includes('.mp4') && !currentChannelContainsVideo) {
    store.dispatch(setCurrentChannelContainsVideo(true));
  }
}

export function handlePlayEvent(_message: CPWebCommand) {
  const message = _message as PlayEventCommand;
  // console.debug(`[CP WEB] Received playback event: ${JSON.stringify(message.event, null, 2)}`);

  // additionally, we save the logs in raw format.
  window.DeviceAPI.playbackLogs.push(message.event);
}

export function handlePublishCommand(message: PublishCommand) {
  const { provisionedDevicePayload } = store.getState().fwiCloud;

  window.MQTT?.publish(
    `fwi/${provisionedDevicePayload?.companyId}/p2p`,
    JSON.stringify({
      deviceId: provisionedDevicePayload?.deviceId,
      companyId: provisionedDevicePayload?.companyId,
      command: 'playerCommandByName',
      commandName: message.commandName.replace('PlayerCommand', ''),
      eventId: randomUUID(),
      requestId: randomUUID(),
      attributes: message.attributes,
      deviceNames: message.deviceNames,
    })
  );
}

const extractUrlFromScript = (script: ExecuteFunctResponse): string | undefined => {
  const _functScript = script.args.attributes.value as FunctUrl;
  const functScript = normalizeKeys<FunctUrl>(_functScript);
  if (functScript.url) {
    if (isValidURLFormat(functScript.url)) {
      return functScript.url;
    } else {
      Logger.error('[RUN SCRIPT]  Can not extract the url since its not valid');
    }
  }
};

const setTimeFromScript = (script: ExecuteFunctResponse): string | undefined => {
  const _softwareTime = script.args.attributes.value;
  const softwareTime = normalizeKeys<CheckTime | FunctRebootTime>(_softwareTime);
  let time;

  // CPW v6
  if ('checktime' in softwareTime) {
    time = softwareTime.checktime;
  } else if ('reboottime' in softwareTime) {
    time = softwareTime.reboottime;
  }

  if (time) {
    const t = new Time(time);
    if (t.isValid()) {
      return t.to24hString();
    } else {
      Logger.error('[RUN SCRIPT]  Invalid time');
    }
  }
  return undefined;
};
/**
 * Sometimes the only way to play certain video types is though HTML with an embedded iframe.
 * if this is the case, we need to traverse the DOM of the iframe and check for a <video> element
 * on the page. This waits for 1 second to ensure the element has been added to the child DOM
 * and then searches for the presence of that tag. Returns true if it finds a matching element.
 */
const HTMLContentContainsVideoTag = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const root = document.getElementById('player-iframe') as HTMLIFrameElement;
    if (root) {
      resolve(recursiveIframeCheck(root));
    } else {
      resolve(false);
    }
  });
};

function recursiveIframeCheck(root: HTMLIFrameElement): boolean {
  //recursively search the dom for iframes
  const iframes = root.contentWindow?.document.querySelectorAll('iframe');
  const video = root.contentWindow?.document.querySelectorAll('video');
  if (video) {
    return true;
  }

  if (iframes?.length) {
    console.log(`found ${iframes.length} frames`);
    for (const frame of iframes) {
      console.log(`checking ${frame.src}`);
      const videoElement = frame.contentWindow?.document.querySelector('video');
      if (videoElement) {
        console.log(`found video element on ${frame.src}`);
        store.dispatch(setCurrentChannelContainsVideo(true));
        return true;
      } else {
        if (frame.contentWindow?.document) {
          return recursiveIframeCheck(frame);
        }
      }
    }
  }
  return false;
}

export function normalizeKeys<T>(attributesValue: Record<string, any>) {
  const normalizedAttributes: Record<string, any> = {};
  ObjectKeys(attributesValue).forEach((key) => {
    normalizedAttributes[key.toLowerCase()] = attributesValue[key];
  });
  return normalizedAttributes as T;
}
