import { Logger, autoUploadCloudLogs, autoUploadPlayLogs } from './Logger';
import formatDistance from 'date-fns/formatDistance';
import { capitalize } from '@core/Util';
import { addDays, addMinutes, format, isPast } from 'date-fns';
import { setScheduledTasks, setLogUpdateIntervalId } from '@core/appState/appSetting';
import { storeExport as store } from '..';
import { Time } from '.';
import {
  currentlyWithinTimerWindow,
  getNextOccurrenceOfWeekday,
  getRandomTimeWindow,
  isSameTimeTodayOrTomorrow,
} from './TimeUtils';
import { createMQTTConnectionFromDeviceID } from '@core/MQTT';
import { rightNow, isValidURLFormat } from '@core/Util';
import { setFeedbackMessageForSoftwareUpdate, setFeedbackMessageForFirmwareUpdate } from '@core/appState/deviceState';
import { OnOff } from '@core/constants';

const oneMinute = 60 * 1000;

/**
 *  All of timers are wrapped in Promises to prevent handlers from blocking the main thread when they eventually run.
 */

export const uploadLogsAtRegularInterval = (interval: string): Promise<void> => {
  return new Promise((resolve, _) => {
    // make sure old timers get cleared out.
    dequeueTaskByName('Upload logs every 12 hours');
    dequeueTaskByName('Upload logs every 24 hours');

    if (interval === '1440' || interval === '720') {
      // schedule for these specific times instead of using setInterval in case a reboot happens in the window.
      checkForLongLogUploadTask();
      resolve();
    } else {
      localStorage.removeItem('logUploadTime');
      const intervalId = setInterval(() => {
        const { deviceOnline } = store.getState().deviceState;
        const { activated } = store.getState().appSettings;
        // might have issues with nested pass-by-reference object here.
        if (deviceOnline && activated) {
          Logger.debug(`[TIMER] Running tasks scheduled for every ${interval} minutes`);
          autoUploadCloudLogs();
          autoUploadPlayLogs();
          if (!window.MQTT) {
            createMQTTConnectionFromDeviceID(store.getState().appSettings.deviceID!);
          }
        }
      }, Number(interval) * oneMinute);
      store.dispatch(setLogUpdateIntervalId({ id: intervalId }));
    }
    resolve();
  });
};

export const deactivateLogTimer = (interval?: LogIntervalId) => {
  if (interval) {
    clearInterval(interval.id as unknown as number);
  }
};

/** schedule a function to run at a specific time using setTimeout. */
export const runTaskAtTime = (task: () => void, time: Date, taskName?: string): Promise<void> => {
  return new Promise((resolve, _) => {
    const tasks = [...store.getState().appSettings.scheduledTasks];

    // if the incoming task already exists with same name and execution time (today or tomorrow), exit early.
    if (
      tasks.find(
        (existingTask) => existingTask.name === taskName && isSameTimeTodayOrTomorrow(time, existingTask.executionTime)
      )
    ) {
      resolve();
      return;
    }

    // check if task of same name already exists. If it does, remove from the list immediately
    // to prioritize the timing of the new incoming task.
    const duplicates = tasks.filter((task) => task.name === taskName);
    if (duplicates.length > 0) {
      duplicates.map((oldTask) => {
        // delete that one from the queue.
        dequeueTask(oldTask);
      });
    }

    // did this time already pass?
    const now = new Date().getTime();
    if (isPast(time)) {
      time = addDays(time, 1);
    }

    const msUntilTime = time.getTime() - now;

    if (msUntilTime > 0) {
      Logger.debug(
        `[TIMER] ${capitalize(taskName) ?? 'Task'} will run in ${formatDistance(now, time, {
          includeSeconds: true,
        })}`
      );

      const timerID = setTimeout(() => {
        // run task
        task();
        // remove from list upon completion
        dequeueTask({ id: timerID } as ScheduledTask);
        resolve();
      }, msUntilTime);

      const tasks = [...store.getState().appSettings.scheduledTasks];
      tasks.push({
        id: timerID,
        executionTime: time,
        name: taskName,
      } as ScheduledTask);

      store.dispatch(setScheduledTasks(tasks));
    } else {
      resolve();
    }
  });
};

/** run the task at specified time and also setup a timer for tomorrow at same time. */
export const runDailyTaskAtTime = async (task: () => void, time: Date, taskName?: string) => {
  await runTaskAtTime(task, time, taskName);
  runTaskAtTime(task, new Time(format(time, 'HH:mm')).nextOccurrence()!, taskName);
};

/** Remove a task from being scheduled to run */
export const dequeueTask = (task: ScheduledTask) => {
  // remove from redux.
  const tasks = [...store.getState().appSettings.scheduledTasks];
  const idx = tasks.findIndex((item) => item.id === task.id);
  if (idx >= 0) {
    Logger.info(`[TIMER] Removing Scheduled Task: ${tasks[idx].name}`);
    tasks.splice(idx, 1);
    store.dispatch(setScheduledTasks(tasks));
    // remove from runtime.
    clearTimeout(task.id as number);
  }
};

/** Remove a task from the queue by it's name */
export const dequeueTaskByName = (taskName: string) => {
  // remove from redux.
  const tasks = [...store.getState().appSettings.scheduledTasks];
  const idx = tasks.findIndex((item) => item.name === taskName);
  if (idx >= 0) {
    const task = tasks[idx];
    Logger.info(`[TIMER] Removing Scheduled Task: ${task.name}`);

    tasks.splice(idx, 1);
    store.dispatch(setScheduledTasks(tasks));
    // remove from runtime.
    clearTimeout(task.id as number);
  }
};

/** Checks the disk for any saved timers and then schedules them again */
export const initSavedTimers = () => {
  const state = store.getState();
  Logger.info('[TIMER] Setting up timers from saved settings.');
  const { checkForSoftwareUpdate, checkForHardwareUpdate, wantReboot, enableOnOffTimers } = state.appSettings;

  if (checkForSoftwareUpdate) {
    const { checkForSoftwareUpdateTime } = state.appSettings;
    runTaskAtTime(
      window.DeviceAPI.checkForSoftwareUpdate,
      new Time(checkForSoftwareUpdateTime!).nextOccurrence()!,
      'Daily check for software update'
    );
  }

  if (checkForHardwareUpdate) {
    const { checkForHardwareUpdateTime } = state.appSettings;
    runTaskAtTime(
      window.DeviceAPI.checkForFirmwareUpdate,
      new Time(checkForHardwareUpdateTime!).nextOccurrence()!,
      'Daily check for firmware update'
    );
  }

  if (wantReboot) {
    const { rebootTime } = state.appSettings;
    const targetDate = getRandomTimeWindow(rebootTime!);
    runTaskAtTime(window.DeviceAPI.reboot, targetDate, 'Daily reboot');
  }

  if (enableOnOffTimers) {
    const { onOffTimers } = state.appSettings;
    scheduleOnOffTimers(onOffTimers);
  }

  checkForLongLogUploadTask();
};

export const scheduleSoftwareUpdate = () => {
  const { checkForSoftwareUpdateTime, softwareUpdateURL, checkForSoftwareUpdate } = store.getState().appSettings;
  if (checkForSoftwareUpdate && checkForSoftwareUpdateTime && isValidURLFormat(softwareUpdateURL)) {
    runDailyTaskAtTime(
      async () => {
        const hasUpdate = await window.DeviceAPI.checkForSoftwareUpdate();

        if (hasUpdate) {
          store.dispatch(
            setFeedbackMessageForSoftwareUpdate({
              message: `A new update is available.`,
              color: 'success',
            })
          );
          await window.DeviceAPI.updateSoftware();
        } else {
          store.dispatch(
            setFeedbackMessageForSoftwareUpdate({
              message: `Last Checked ${rightNow()}`,
              color: 'grey_med',
            })
          );
        }
      },
      new Time(checkForSoftwareUpdateTime).nextOccurrence()!,
      'Daily check for software update'
    );
  } else {
    dequeueTaskByName('Daily check for software update');
  }
};

export const scheduleFirmwareUpdate = () => {
  const { checkForHardwareUpdate, checkForHardwareUpdateTime, firmwareUpdateURL } = store.getState().appSettings;
  if (checkForHardwareUpdate && checkForHardwareUpdateTime && isValidURLFormat(firmwareUpdateURL ?? '')) {
    runDailyTaskAtTime(
      async () => {
        const hasUpdate = await window.DeviceAPI.checkForFirmwareUpdate();
        if (hasUpdate) {
          setFeedbackMessageForFirmwareUpdate({
            message: `A new update is available.`,
            color: 'success',
          });
          await window.DeviceAPI.updateFirmware();
        } else {
          store.dispatch(
            setFeedbackMessageForFirmwareUpdate({
              message: `Last Checked ${rightNow()}`,
              color: 'grey_med',
            })
          );
        }
      },
      new Time(checkForHardwareUpdateTime).asDate()!,
      'Daily check for firmware update'
    );
  } else {
    dequeueTaskByName('Daily check for firmware update');
  }
};

/** Schedules a reboot to fall at a random time within the hour set in the UI for the sake of
 * network congestion when multiple devices are all configured in the same physical location
 */
export const scheduleRebootUpdate = () => {
  const { wantReboot, rebootTime } = store.getState().appSettings;
  if (wantReboot && rebootTime) {
    const targetDate = getRandomTimeWindow(rebootTime);
    runDailyTaskAtTime(window.DeviceAPI.reboot, targetDate, 'Daily reboot');
  } else {
    dequeueTaskByName('Daily reboot');
  }
};

// Temporary until we know that the device (BrightSign) events work reliably.
//TODO: is this fixed yet?
const everyMinute = () => {
  setInterval(() => {
    window.DeviceAPI?.checkInternet();
  }, oneMinute);
};

const everyFiveMinutes = () => {
  setInterval(() => {
    window.DeviceAPI.savePlaybackLogsToDisk(window.DeviceAPI.playbackLogs);
  }, 5 * oneMinute);
};

export const startIntervalBasedTasks = () => {
  uploadLogsAtRegularInterval(store.getState().appSettings.uploadLogTimeInterval ?? '5');
  everyMinute();
  everyFiveMinutes();
};

export const scheduleOnOffTimers = (timers?: onAndOffTimerSetting[]) => {
  if (!timers) {
    timers = store.getState().appSettings.onOffTimers;
  }

  timers?.forEach((timer) => {
    // transform to date.
    timer.days.forEach((day) => {
      const offTime = getNextOccurrenceOfWeekday(day, timer.offTime);
      runTaskAtTime(
        () => {
          window.DeviceAPI.turnDisplayOnOff(OnOff.Off);
          scheduleOnOffTimers(timers);
        },
        offTime,
        `turn display off ${timer.offTime}-${day}`
      );

      const onTime = getNextOccurrenceOfWeekday(day, timer.onTime);
      runTaskAtTime(
        () => {
          window.DeviceAPI.turnDisplayOnOff(OnOff.On);
          scheduleOnOffTimers(timers);
        },
        onTime,
        `turn display on ${timer.onTime}-${day}`
      );

      if (currentlyWithinTimerWindow(timer)) {
        //TODO: this is weird because the on/off windows are sometimes"off" today and "on" the next day.
        // Logger.info('[TIMER] Device is currently inside a time frame where the display should be "off".')
        // window.DeviceAPI.turnDisplayOnOff(OnOff.Off);
      }
    });
  });
};

export const unscheduleOnOffTimers = () => {
  const timers = store.getState().appSettings.scheduledTasks;

  timers.map((timer) => {
    if (timer.name?.includes('turn display')) {
      dequeueTaskByName(timer.name);
    }
  });
};

export const createNewOnOffTimers = (timers?: onAndOffTimerSetting[]) => {
  if (timers) {
    const scheduledTimersNames = store
      .getState()
      .appSettings.scheduledTasks?.map((scheduledTimer) => scheduledTimer.name)
      .filter((name) => name?.includes('turn display'));
    const existingTimersNames: string[] = [];
    timers?.map((timer) => {
      timer.days.map((day) => {
        const offTimerName = `turn display off ${timer.offTime}-${day}`;
        const onTimerName = `turn display on ${timer.onTime}-${day}`;

        //Check if offTimerName is already scheduled
        if (scheduledTimersNames.some((name) => name === offTimerName)) {
          // Timer is already scheduled.
          existingTimersNames.push(offTimerName);
        } else {
          const offTime = getNextOccurrenceOfWeekday(day, timer.offTime);
          //Schedule the timer
          runTaskAtTime(
            () => {
              window.DeviceAPI.turnDisplayOnOff(OnOff.Off);
              scheduleOnOffTimers(timers);
            },
            offTime,
            offTimerName
          );
        }

        //Check if onTimerName is already scheduled
        if (scheduledTimersNames.some((name) => name === onTimerName)) {
          // Timer is already scheduled.
          existingTimersNames.push(onTimerName);
        } else {
          const onTime = getNextOccurrenceOfWeekday(day, timer.onTime);
          //Schedule the timer
          runTaskAtTime(
            () => {
              window.DeviceAPI.turnDisplayOnOff(OnOff.On);
              scheduleOnOffTimers(timers);
            },
            onTime,
            onTimerName
          );
        }
      });
    });
    // Removing deleted onOffTimers from queue
    const timersToUnschedule = scheduledTimersNames.filter((name) => {
      if (name) return !existingTimersNames.includes(name);
    });
    timersToUnschedule?.map((name) => {
      if (name) {
        dequeueTaskByName(name);
      }
    });
  }
};

export const scheduleLongLogUploadInterval = (executionTime: Date) => {
  // safe to store this in localstorage instead of the registry because it's ephemeral by nature.
  localStorage.setItem('logUploadTime', executionTime.toString());
  const { uploadLogTimeInterval } = store.getState().appSettings;

  // schedule for these specific times instead of using setInterval in case a reboot happens in the window.
  runTaskAtTime(
    () => {
      autoUploadCloudLogs();
      autoUploadPlayLogs();
      scheduleLongLogUploadInterval(addMinutes(new Date(), Number(uploadLogTimeInterval)));
    },
    executionTime,
    `Upload logs every ${Number(uploadLogTimeInterval) / 60} hours`
  );
};

export const checkForLongLogUploadTask = () => {
  const uploadTime = localStorage.getItem('logUploadTime');
  const { uploadLogTimeInterval } = store.getState().appSettings;

  if (Number(uploadLogTimeInterval) >= 720) {
    if (uploadTime && !isPast(new Date(uploadTime))) {
      // schedule for time from localstorage in the future
      scheduleLongLogUploadInterval(new Date(uploadTime));
    } else {
      // schedule for now + whatever interval
      scheduleLongLogUploadInterval(addMinutes(new Date(), Number(uploadLogTimeInterval)));
    }
  } else {
    localStorage.removeItem('logUploadTime');
  }
};
