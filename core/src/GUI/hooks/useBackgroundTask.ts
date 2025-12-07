/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import Logger from 'js-logger';

/** Runs single task in the background once when component is mounted */

export const useBackgroundTask = (backgroundTask: () => any) => {
  Logger.debug('Running background task.');
  useEffect(() => {
    backgroundTask();
  }, []);
};
