import { setRunScript } from '@core/appState/appSetting';
import { setMenuStatus, setUserCanAccessMenu } from '@core/appState/shimMenuActive';
import { extractChannelIDFromURL, rotateBlobImage, uploadCloudLogs, uploadPlayLogs } from '@core/Util';
import { storeExport as store } from '@core/index';
import Logger from 'js-logger';
import { cacheBustCurrentDeployment } from '@core/Deployment';
import { ObjectEntries } from '@core/Util/Object';

export function handlePlayerCommandCheckDeployment(messageObj: MQTTMessage) {
  Logger.info('[COMMAND] Received Refresh Channel');
  const refreshChannnelCmd = { ...messageObj } as ClearCacheCommand;
  store.dispatch(setRunScript(refreshChannnelCmd));
}

export function handlePlayerCommandReboot(messageObj: MQTTMessage) {
  Logger.info('[COMMAND] Received Reboot Command');
  const rebootCmd = { ...messageObj } as RebootCommand;
  confirmScriptCommand(rebootCmd, 'CONFIRMED');
  window.DeviceAPI?.setSetting('pending_reboot', JSON.stringify(rebootCmd)).then(() => {
    window.DeviceAPI?.reboot();
  });
}

export function handlePlayerCommandClearCache(messageObj: MQTTMessage) {
  Logger.info('[COMMAND] Received Clear Cache');
  const clearCacheCmd = { ...messageObj } as ClearCacheCommand;
  // If the menu is active and restart is required then hide the menu to avoid video screenshot from hiding the restart.
  if (clearCacheCmd.attributes.RestartPlayer && store.getState().shimMenu.shimMenuActive) {
    hideActiveMenu();
  }
  store.dispatch(setRunScript(clearCacheCmd));
  window.DeviceAPI.clearPlayerCache();
}

export function handlePlayerCommandRunScript(messageObj: MQTTMessage) {
  Logger.info('[COMMAND] Received Run Script');
  const runScriptCmd = { ...messageObj } as RunScriptCommand;
  //If the attributes contain a URL, then encode the URL
  ObjectEntries(runScriptCmd.attributes).forEach(([key, attrString]) => {
    const matches = attrString.match(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi);
    matches?.forEach((urlString) => {
      attrString = attrString.replace(urlString, encodeURIComponent(urlString));
    });

    // If the menu is active and restart is required then hide the menu to avoid video screenshot from hiding the restart.
    const runscript = attrString.replace(/\s+/g, '').toLowerCase();
    if (
      ((runscript.includes('clearcache') && runscript.includes('restartplayer=true')) ||
        runscript.includes('restartplayer')) &&
      store.getState().shimMenu.shimMenuActive
    ) {
      hideActiveMenu();
    }

    runScriptCmd.attributes[Number(key)] = attrString;
  });
  store.dispatch(setRunScript(runScriptCmd));
}

export function handleScreenshotCommand(messageObj: MQTTMessage) {
  Logger.info('[COMMAND] Got request to take screenshot');
  // assert the command to a specified type.
  const cmd = { ...messageObj } as ScreenshotCommand;
  // Call Device API to capture screenshot as blob.
  window.DeviceAPI?.captureScreenshot()
    .then(async (blob) => {
      Logger.debug('[SCREENSHOT] Successfully captured screen.');
      const { orientation } = store.getState().deviceSettings;
      const rotatedBlob = await rotateBlobImage(blob, orientation);
      uploadScreenshot(rotatedBlob, cmd);
    })
    .catch((error) => {
      Logger.error('[SCREENSHOT] Error', error);
    });
}

export function handleCloudChannelBroadcast(msg: ChannelUpdateMessage) {
  // this command is received when any channel in the company is updated or published.
  const { currentURL } = store.getState().appSettings;
  const channelID = extractChannelIDFromURL(currentURL!);
  if (msg.channel === channelID) {
    // cache bust url and reload into window.
    cacheBustCurrentDeployment();
  }
}

export function handleLogCommand(messageObj: cloudLogUploadResponse) {
  if (messageObj.uploadBody.key.includes('PlayerLogs')) {
    uploadCloudLogs(messageObj);
  } else if (messageObj.uploadBody.key.includes('CloudPlaylog')) {
    uploadPlayLogs(messageObj);
  }
}

export function handleReaderIdCommand(messageObj: ReaderIdCommand) {
  window.DeviceAPI.postMessage({ ...messageObj, command: 'executeCommand', commandName: 'SendReaderId' });
}

export function handleGenericPlayerCommand(messageObj: CloudCommand) {
  window.DeviceAPI.postMessage({ ...messageObj, command: 'executeCommand' });
}

export function confirmScriptCommand(msg: CloudCommand | RebootCommand, status: 'CONFIRMED' | 'SUCCESS' | 'FAIL') {
  Logger.info('[COMMAND] Received command from Harmony.');
  const { deviceOnline } = store.getState().deviceState;
  if (window.MQTT) {
    const { provisionedDevicePayload } = store.getState().fwiCloud;
    if (provisionedDevicePayload) {
      const { companyId, deviceId } = provisionedDevicePayload;
      window.MQTT.publish(
        'fwi/' + companyId + '/command',
        JSON.stringify({
          env: process.env.REACT_APP_ENVIRONMENT!,
          companyId: companyId,
          eventId: msg.eventId,
          deviceId: deviceId,
          status: status,
          message: '',
          command: msg.commandName,
          requestId: msg.requestId,
        })
      );
    }
  } else if (!window.MQTT && deviceOnline) {
    Logger.warn('[COMMAND] Tried to send a command before MQTT was established. Trying again in 5 sec');
    setTimeout(() => {
      confirmScriptCommand(msg, status);
    }, 5000);
  }

  store.dispatch(setRunScript(undefined));
}

function hideActiveMenu() {
  store.dispatch(setMenuStatus(false));
  if (store.getState().appSettings.accessCode) {
    store.dispatch(setUserCanAccessMenu(false));
  }
}

async function uploadScreenshot(screenshot: Blob, command: ScreenshotCommand): Promise<void> {
  Logger.info('[SCREENSHOT] Uploading Screenshot to Harmony now.');
  const deviceId = store.getState().fwiCloud.provisionedDevicePayload?.deviceId;

  // build form data with credentials from command.
  const form = new FormData();
  form.append('key', command.uploadBody.key);
  form.append('AWSAccessKeyId', command.uploadBody.AWSAccessKeyId);
  form.append('x-amz-security-token', command.uploadBody['x-amz-security-token']);
  form.append('policy', command.uploadBody.policy);
  form.append('signature', command.uploadBody.signature);
  form.append('file', screenshot, `${deviceId}_thumb.png`);

  // Upload screenshot (blob) to url from the command
  try {
    const res = await fetch(command.uploadUrl as string, {
      method: 'POST',
      body: form,
      mode: 'no-cors',
    });
    if (res.ok || window.DeviceAPI?.deviceType !== 'Browser') {
      Logger.debug('[SCREENSHOT] Screenshot uploaded successfully');
    }
  } catch (error) {
    if (window.DeviceAPI?.deviceType !== 'Browser') {
      Logger.error('[SCREENSHOT] Error uploading screenshot to Harmony. : ', error);
    }
  }
}
