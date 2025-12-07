import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ShimMenuHeader from './ShimMenuHeader';
import { LogLevel, UIColor, LogUploadTimeIntervals } from '@core/constants';
import UILogLevel from '@core/GUI/components/UILogLevel';
import errorIcon from '../../assets/icons/error-colored.svg';
import warnIcon from '../../assets/icons/warn-colored.svg';
import infoIcon from '../../assets/icons/info-colored.svg';
import debugIcon from '../../assets/icons/debug-colored.svg';
import traceIcon from '../../assets/icons/trace-colored.svg';
import Button from '../Button';
import Dropdown from '../Dropdown';
import { setUploadLogTimeInterval } from '@core/appState/appSetting';
import { autoUploadCloudLogs, autoUploadPlayLogs, Logger, timeIntervalOption } from '@core/Util';
import { RootState } from '@core/createStore';
import { setFeedbackMessageForCloudLogUpload } from '@core/appState/deviceState';
import { useFeedbackMessage } from '@core/GUI/hooks/useFeedbackMessage';
import { ObjectValues } from '@core/Util/Object';

export default function ShimMenuLogging() {
  const dispatch = useDispatch();
  const [isDropDownSelected, setIsDropDownSelected] = useState(false);
  const { logUpdateTimeInterval, logUploadFeedbackMessage, isPlaybackLoggingEnabled } = useSelector(
    (state: RootState) => ({
      logUpdateTimeInterval: state.appSettings.uploadLogTimeInterval,
      logUploadFeedbackMessage: state.deviceState.feedbackMessageForCloudLogUpload,
      isPlaybackLoggingEnabled: state.appSettings.IsFwiCloudPlaylogEnabled,
    })
  );
  const [logUploadMessage, setLogUploadMessage, logMessageRef] = useFeedbackMessage({
    defaultMessage: logUploadFeedbackMessage,
  });

  useEffect(() => {
    if (logUploadFeedbackMessage && logUploadFeedbackMessage.message !== logUploadMessage.message) {
      setLogUploadMessage(logUploadFeedbackMessage);

      // we need to manually set this one back to "blank", otherwise it will show up when the page loads every time.
      setTimeout(() => {
        dispatch(setFeedbackMessageForCloudLogUpload({ message: '', color: 'normal' }));
      }, 3000);
    }
  }, [dispatch, logUploadFeedbackMessage, logUploadMessage.message, setLogUploadMessage]);

  const [onScreenLogCount, setOnScreenLogCount] = useState(0);

  // when using OSK, add a method to show on screen logs.
  const onTapLoggingHeader = useCallback(() => {
    setOnScreenLogCount(onScreenLogCount + 1);
    if (onScreenLogCount >= 5) {
      setOnScreenLogCount(0);
      document.getElementById('on-screen-logs-container')?.classList.toggle('hidden');
      document.getElementById('resolution-hint')?.classList.toggle('hidden');
    }
  }, [onScreenLogCount]);

  return (
    <>
      <ShimMenuHeader isChildPage={true} childPageTitle="Logging" />
      <div className="shim-menu-logging menu-container">
        <section className="logging-level">
          <h4 onClick={onTapLoggingHeader}>LOGGING LEVEL</h4>
          {isPlaybackLoggingEnabled && <p className="helper">Playback logging is enabled</p>}
          <div className="levels">
            <UILogLevel
              level={LogLevel.ERROR}
              icon={errorIcon}
              id={`log-level-selector__${LogLevel.ERROR.toLowerCase()}`}
              first={true}
            />
            <UILogLevel
              level={LogLevel.WARN}
              icon={warnIcon}
              id={`log-level-selector__${LogLevel.WARN.toLowerCase()}`}
            />
            <UILogLevel
              level={LogLevel.INFO}
              icon={infoIcon}
              id={`log-level-selector__${LogLevel.INFO.toLowerCase()}`}
            />
            <UILogLevel
              level={LogLevel.DEBUG}
              icon={debugIcon}
              id={`log-level-selector__${LogLevel.DEBUG.toLowerCase()}`}
            />
            <UILogLevel
              level={LogLevel.TRACE}
              icon={traceIcon}
              id={`log-level-selector__${LogLevel.TRACE.toLowerCase()}`}
              last={true}
            />
          </div>
        </section>

        <section>
          <h4>Harmony</h4>
          <div className="indentation-wrapper">
            <label className="helper">Automatically upload logs every</label>
            <Dropdown
              id="log-upload-interval-dropdown"
              options={ObjectValues(LogUploadTimeIntervals).map((value) => ({ value }))}
              defaultOption={timeIntervalOption(logUpdateTimeInterval ?? '5')}
              onChange={(selection, isOpen) => {
                isOpen ? setIsDropDownSelected(true) : setIsDropDownSelected(false);
                if (timeIntervalOption(logUpdateTimeInterval) !== selection) {
                  Logger.debug('[LOGGING] setting new log update time interval');
                  switch (selection) {
                    case LogUploadTimeIntervals.fiveMinutes:
                      dispatch(setUploadLogTimeInterval({ value: '5' }));
                      break;
                    case LogUploadTimeIntervals.fifteenMinutes:
                      dispatch(setUploadLogTimeInterval({ value: '15' }));
                      break;
                    case LogUploadTimeIntervals.hour:
                      dispatch(setUploadLogTimeInterval({ value: '60' }));
                      break;
                    case LogUploadTimeIntervals.sixHours:
                      dispatch(setUploadLogTimeInterval({ value: '360' }));
                      break;
                    case LogUploadTimeIntervals.twelveHours:
                      dispatch(setUploadLogTimeInterval({ value: '720' }));
                      break;
                    case LogUploadTimeIntervals.day:
                      dispatch(setUploadLogTimeInterval({ value: '1440' }));
                      break;
                  }
                }
              }}
            />
            <div className="button-with-feedback">
              <Button
                id="button__upload-cloud-logs-now"
                color={UIColor.Purple}
                disabled={isDropDownSelected}
                onClick={() => {
                  autoUploadCloudLogs();
                  autoUploadPlayLogs();
                }}
              >
                Upload Logs Now
              </Button>

              <span className="user-feedback" ref={logMessageRef}>
                {logUploadMessage.message}
              </span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
