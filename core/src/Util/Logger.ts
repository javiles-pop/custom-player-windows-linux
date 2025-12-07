import Logger, { ILogLevel, GlobalLogger } from 'js-logger';
import format from 'date-fns/format';
import { storeExport as store } from '..';
import { formatISO, getUnixTime } from 'date-fns';
import { bytesToHuman } from '.';
import { setFeedbackMessageForCloudLogUpload } from '@core/appState/deviceState';
import { LogUploadTimeIntervals } from '@core/constants';
import { ObjectKeys } from './Object';

interface IContext extends Record<string, any> {
  level: ILogLevel;
  name?: string;
}

/**
 * This file contains the configuration for the custom logger in the app.
 * It extends the console object and adds a better api for log formatting,
 * and handling when separating device vs player logs and timestamps.
 *
 */

interface FWILogger extends GlobalLogger {
  [key: string]: any;
  playerLog: (message: logCommand) => void;
}

const customLogFormatter = (messages: any[], context: IContext) => {
  messages.unshift(`${context.level.name} | ${format(new Date(), 'yyyy-MM-dd HH:mm:ss O')} | DeviceLog |`);
};

const customLogHandler = (messages: any[], context: IContext, playerLog = false) => {
  // add to on-screen debugging log.
  const container = document.getElementById('on-screen-logs-container');
  let message = '';
  if (messages[0] && !(messages[0].toString() === '[object Object]')) {
    message = messages[0];
  }
  if (container) {
    container.innerHTML += `<div class="log-message ${context.level.name.toLowerCase()} ${playerLog ? 'player' : ''}">
        ${message}
      </div>`;

    // always scroll to the bottom.
    container.scrollTop = container.scrollHeight;

    // limit # of nodes so we don't tank the page performance with thousands of log entries in HTML.
    if (container.children.length >= 100) {
      container.removeChild(container.children[0]);
    }
  }

  // save logs in memory
  if (!playerLog && window.DeviceAPI) {
    const date = new Date();
    window.DeviceAPI?.logs.push({
      logLevel: context.level.name,
      message: message.toString(),
      posixTime: getUnixTime(date),
      offset: date.getTimezoneOffset(),
      timestamp: formatISO(date),
      logType: 'DeviceLog',
    } as Log);

    checkLogSize();
  }
};

const defaultHandler = Logger.createDefaultHandler({
  formatter: customLogFormatter,
});

Logger.useDefaults({
  formatter: customLogFormatter,
});

Logger.setHandler((messages, context) => {
  defaultHandler(messages, context);
  customLogHandler(messages, context);
});

// Takes messages from CPWeb and saves them to memory for upload later.
const playerLog = (message: logCommand) => {
  const date = new Date(message.date);
  window.DeviceAPI?.logs.push({
    logLevel: message.level,
    message: message.message,
    posixTime: getUnixTime(date),
    offset: date.getTimezoneOffset(),
    timestamp: formatISO(date),
    logType: 'PlayerLog',
  } as Log);

  checkLogSize();

  customLogHandler(
    [message.message],
    {
      level: {
        value: window.DeviceAPI?.Logger[message.level].value,
        name: message.level,
      },
    },
    true
  );
};

// combine the CPWeb logger and the shim logger into 1 export.
const fwiCustomLogger: FWILogger = {
  ...Logger,
  ...{
    playerLog,
  },
};

/**
 * In order to get the upload url for cloud logs, we have to publish info about device and company to an mqtt topic.
 * We'll get a response message that contains all the necessary info to upload a json file to an s3 bucket,
 * which cloud will parse into the UI.
 */
export const autoUploadCloudLogs = async () => {
  if (store.getState().appSettings.activated) {
    if (window.MQTT) {
      const state = store.getState();
      const payload = {
        env: process.env.REACT_APP_ENVIRONMENT!,
        playerType: window.DeviceAPI?.getManufacturer().toLowerCase(),
        companyId: state.fwiCloud.provisionedDevicePayload?.companyId,
        deviceId: state.fwiCloud.provisionedDevicePayload?.deviceId,
        filename: `PlayerLogs_${Math.floor(new Date().getTime() / 1000)}.json`,
      };

      Logger.debug('[LOGS] Getting log upload location from Cloud...');
      window.MQTT.publish(`fwi/${state.fwiCloud.provisionedDevicePayload?.companyId}/logs`, JSON.stringify(payload));
      // See Commands.ts#CommandMessageRouter for next steps.
    } else {
      setTimeout(() => {
        autoUploadCloudLogs();
      }, 5000);
    }
  }
};

export const autoUploadPlayLogs = async () => {
  if (store.getState().appSettings.activated && store.getState().appSettings.IsFwiCloudPlaylogEnabled) {
    if (window.MQTT) {
      const state = store.getState();
      const payload = {
        env: process.env.REACT_APP_ENVIRONMENT!,
        playerType: window.DeviceAPI?.getManufacturer().toLowerCase(),
        companyId: state.fwiCloud.provisionedDevicePayload?.companyId,
        deviceId: state.fwiCloud.provisionedDevicePayload?.deviceId,
        filename: `CloudPlaylog_${Math.floor(new Date().getTime() / 1000)}.json`,
      };

      Logger.debug('[LOGS] Getting play log upload location from Cloud...');
      window.MQTT.publish(`fwi/${state.fwiCloud.provisionedDevicePayload?.companyId}/logs`, JSON.stringify(payload));
      // See Commands.ts#CommandMessageRouter for next steps.
    } else {
      setTimeout(() => {
        autoUploadCloudLogs();
      }, 5000);
    }
  }
};

/**
 * Takes the logs from memory and saves them to a JSON file. then uploads them to cloud based on credentials
 * from an MQTT message.
 */
export const uploadCloudLogs = async (uploadInfo: cloudLogUploadResponse) => {
  Logger.info('[LOGS] Uploading logs to Harmony now.');

  try {
    // make a blob with the current log messages in memory.
    const logBlob = [JSON.stringify([...window.DeviceAPI.logs, ...window.DeviceAPI.playbackLogs])];
    const logFile = new File(logBlob, uploadInfo.uploadBody.key.split('/')[4]);
    // make an upload form.
    const form = new FormData();

    // add headers to the form
    ObjectKeys(uploadInfo.uploadBody).map((key) => {
      form.append(key.toString(), uploadInfo.uploadBody[key]);
    });

    // attach the log file.
    form.append('file', logFile);

    // upload
    try {
      const response = await fetch(uploadInfo.uploadUrl, {
        method: 'POST',
        body: form,
        mode: process.env.NODE_ENV === 'development' ? 'no-cors' : 'cors',
      });

      // cors prevents browsers from viewing the response, so we just assume it worked in development mode.
      if (response.ok || process.env.NODE_ENV === 'development') {
        window.DeviceAPI.logs = [];
      }

      store.dispatch(
        setFeedbackMessageForCloudLogUpload({
          message: 'Logs uploaded',
          color: 'success',
        })
      );
    } catch (error) {
      Logger.error(`Failed to upload latest cloud logs. ${error}`);
      store.dispatch(
        setFeedbackMessageForCloudLogUpload({
          message: 'Log upload Failed',
          color: 'error',
        })
      );
    }
  } catch (error) {
    Logger.error(`Could not parse logs into a usable format for cloud. ${error}`);
    store.dispatch(
      setFeedbackMessageForCloudLogUpload({
        message: 'Log upload Failed',
        color: 'error',
      })
    );
  }
};

export const uploadPlayLogs = async (uploadInfo: cloudLogUploadResponse) => {
  Logger.info('[LOGS] Uploading play logs to Harmony now.');

  try {
    // make a blob with the current log messages in memory.
    const logBlob = [JSON.stringify(window.DeviceAPI.playbackLogs)];
    const logFile = new File(logBlob, uploadInfo.uploadBody.key.split('/')[4]);
    // make an upload form.
    const form = new FormData();

    // add headers to the form
    ObjectKeys(uploadInfo.uploadBody).map((key) => {
      form.append(key.toString(), uploadInfo.uploadBody[key]);
    });

    // attach the log file.
    form.append('file', logFile);

    // upload
    try {
      const response = await fetch(uploadInfo.uploadUrl, {
        method: 'POST',
        body: form,
        mode: process.env.NODE_ENV === 'development' ? 'no-cors' : 'cors',
      });

      // cors prevents browsers from viewing the response, so we just assume it worked in development mode.
      if (response.ok || process.env.NODE_ENV === 'development') {
        window.DeviceAPI.playbackLogs = [];
      }
    } catch (error) {
      Logger.error(`Failed to upload latest play logs. ${error}`);
    }
  } catch (error) {
    Logger.error(`Could not parse play logs into a usable format for cloud. ${error}`);
  }
};

export const saveLogsToDisk = async () => {
  await window.DeviceAPI.saveCloudLogsToDisk(window.DeviceAPI.logs);
};

/** saves logs to the disk only while offline in chunks of about 100kb each. */
const checkLogSize = () => {
  if (window.DeviceAPI.logs.length >= 250 && !store.getState().deviceState.deviceOnline) {
    // this should be about 100kb
    console.log('current log size: ', bytesToHuman(JSON.stringify(window.DeviceAPI.logs).length));
    saveLogsToDisk();
  }
};

export const timeIntervalOption = (intervalOption?: string) => {
  switch (intervalOption ?? '5') {
    case '5':
      return LogUploadTimeIntervals.fiveMinutes;
    case '15':
      return LogUploadTimeIntervals.fifteenMinutes;
    case '60':
      return LogUploadTimeIntervals.hour;
    case '360':
      return LogUploadTimeIntervals.sixHours;
    case '720':
      return LogUploadTimeIntervals.twelveHours;
    case '1440':
      return LogUploadTimeIntervals.day;
    default:
      return LogUploadTimeIntervals.fiveMinutes;
  }
};

export { fwiCustomLogger as Logger };
