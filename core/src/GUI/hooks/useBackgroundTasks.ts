/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import Logger from 'js-logger';

/** Runs array of tasks in the background once when component is mounted */
export function useBackgroundTasks(backgroundTasks: Array<() => any>) {
  useEffect(() => {
    Logger.debug('Running background tasks...');
    backgroundTasks.map((task) => {
      if (typeof task === 'function') {
        task();
      }
    });
  }, []);
}
