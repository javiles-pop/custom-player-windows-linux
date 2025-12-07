import React, { useState, ChangeEvent, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@core/createStore';
import {
  setCheckForFirmwareUpdate,
  setCheckForFirmwareUpdateTime,
  setCheckForSoftwareUpdate,
  setCheckForSoftwareUpdateTime,
  setFirmwareUpdateURL,
  setSoftwareUpdateURL,
} from '@core/appState/appSetting';
import { isValidURLFormat, Logger, rightNow } from '@core/Util';
import ShimMenuHeader from './ShimMenuHeader';
import TextInputField from '../TextInputField';
import Button from '../Button';
import Checkbox from '../Checkbox';
import TimeInputField from '../TimeInputField';
import { DeviceManufacturer, UIColor } from '@core/constants';
import { setFirmwareUpdateAvailable, setSoftwareUpdateAvailable } from '@core/appState/deviceState';
import classNames from 'classnames';
import { onMount } from '@core/GUI/hooks/onMount';
import { useFeedbackMessage } from '@core/GUI/hooks/useFeedbackMessage';
import { FirmwareDowngradeModal } from './FirmwareDowngradeModal';
import { useToast } from '@core/context/ToastProvider';

export default function ShimMenuUpdates() {
  const dispatch = useDispatch();
  const addToast = useToast();

  const {
    softwareUpdateURL,
    dailySoftwareUpdateCheckEnabled,
    softwareUpdateTime,
    softwareFeedbackMessage,
    softwareUpdateAvailable,
    firmwareUpdateAvailable,
    firmwareUpdateURL,
    dailyfirmwareUpdateCheckEnabled,
    firmwareUpdateTime,
    firmwareFeedbackMessage,
  } = useSelector((state: RootState) => {
    return {
      softwareUpdateURL: state.appSettings.softwareUpdateURL ?? '',
      dailySoftwareUpdateCheckEnabled: state.appSettings.checkForSoftwareUpdate ?? false,
      softwareUpdateTime: state.appSettings.checkForSoftwareUpdateTime ?? '',
      softwareFeedbackMessage: state.deviceState.feedbackMessageForSoftwareUpdate,
      softwareUpdateAvailable: state.deviceState.softwareUpdateAvailable,
      firmwareUpdateAvailable: state.deviceState.firmwareUpdateAvailable,
      firmwareUpdateURL: state.appSettings.firmwareUpdateURL ?? '',
      dailyfirmwareUpdateCheckEnabled: state.appSettings.checkForHardwareUpdate ?? false,
      firmwareUpdateTime: state.appSettings.checkForHardwareUpdateTime ?? '',
      firmwareFeedbackMessage: state.deviceState.feedbackMessageForFirmwareUpdate,
    };
  });
  // Software
  const [tempSoftwareURL, setTempSoftwareURL] = useState(softwareUpdateURL);
  const [lastSoftwareCheckMsg, setLastSoftwareCheckMsg, softwareCheckEl] = useFeedbackMessage({
    persistent: true,
  });
  const [softwareURLhasErrors, setSoftwareURLhasErrors] = useState(false);
  const softwareTextFieldClasses = classNames({
    'has-errors': softwareURLhasErrors,
  });

  // Firmware
  const [tempFirmwareURL, setTempFirmwareURL] = useState(firmwareUpdateURL);
  const [lastFirmwareCheck, setLastFirmwareCheck, firmwareCheckEl] = useFeedbackMessage({
    persistent: true,
  });
  const [showFwDowngradeButton, setShowFwDowngradeButton] = useState(false);
  const [firmwareURLhasErrors, setFirmwareURLhasErrors] = useState(false);
  const firmwareTextFieldClasses = classNames({
    'has-errors': firmwareURLhasErrors,
  });

  onMount(() => {
    const backButton = document.querySelector('.back-button button') as HTMLButtonElement;
    backButton?.focus();
    document.querySelector('.menu-container')?.scrollTo(0, 0);
  });

  // when things change from the shadow
  useEffect(() => {
    setTempSoftwareURL(softwareUpdateURL);
    setTempFirmwareURL(firmwareUpdateURL);

    if (softwareFeedbackMessage) {
      setLastSoftwareCheckMsg(softwareFeedbackMessage);
    }
    if (firmwareFeedbackMessage) {
      setLastFirmwareCheck(firmwareFeedbackMessage);
    }

    if (softwareUpdateAvailable && !softwareFeedbackMessage) {
      // Avoid updating if message haven't changed
      if (lastSoftwareCheckMsg.message !== `A new update is available.`) {
        setLastSoftwareCheckMsg({
          message: `A new update is available.`,
          color: 'info',
        });
      }
    }

    if (firmwareUpdateAvailable && !firmwareFeedbackMessage) {
      // Avoid updating if message haven't changed
      if (lastFirmwareCheck.message !== 'A new update is available.') {
        setLastFirmwareCheck({
          message: 'A new update is available.',
          color: 'info',
        });
      }
    }
  }, [
    softwareUpdateURL,
    firmwareUpdateURL,
    softwareFeedbackMessage,
    firmwareFeedbackMessage,
    softwareUpdateAvailable,
    firmwareUpdateAvailable,
    setLastSoftwareCheckMsg,
    setLastFirmwareCheck,
    lastSoftwareCheckMsg.message,
    lastFirmwareCheck.message,
  ]);

  const onSoftwareUpdateClick = useCallback(async () => {
    Logger.debug('User clicked button to check for software update.');
    if (!softwareUpdateAvailable) {
      dispatch(setSoftwareUpdateURL({ value: tempSoftwareURL }));
      const updateAvailable = await window.DeviceAPI.checkForSoftwareUpdate();
      if (updateAvailable) {
        setLastSoftwareCheckMsg({
          message: `A new update is available.`,
          color: 'info',
        });
        dispatch(setSoftwareUpdateAvailable(true));
      } else {
        setLastSoftwareCheckMsg({
          message: `Last Checked ${rightNow()}`,
          color: 'grey_med',
        });
      }
    } else {
      await window.DeviceAPI.updateSoftware();
    }
  }, [dispatch, setLastSoftwareCheckMsg, softwareUpdateAvailable, tempSoftwareURL]);

  const onFirmwareUpdate = useCallback(async () => {
    if (!firmwareUpdateAvailable) {
      try {
        Logger.info('[FIRMWARE] Checking for new firmware update...');
        dispatch(setFirmwareUpdateURL({ value: tempFirmwareURL }));
        const newUpdateAvailable = await window.DeviceAPI.checkForFirmwareUpdate();
        if (newUpdateAvailable) {
          setLastFirmwareCheck({
            message: 'A new update is available.',
            color: 'info',
          });
          setFirmwareUpdateAvailable(true);
        } else {
          setLastFirmwareCheck({
            message: `Last checked ${rightNow()}`,
            color: 'grey_med',
          });

          // Allow BrightSign to downgrade firmware after hitting the button once.
          if (window.DeviceAPI.getManufacturer() === DeviceManufacturer.BrightSign) {
            setShowFwDowngradeButton(true);
          }
        }
      } catch (error) {
        setLastFirmwareCheck({ message: error.message, color: 'error' });
      }
    } else {
      try {
        await window.DeviceAPI.updateFirmware();
      } catch {
        addToast({
          title: 'Error Downloading Firmware file',
          description: 'Please check the URL and try again.',
          type: 'error',
        });
      }
    }
  }, [addToast, dispatch, firmwareUpdateAvailable, setLastFirmwareCheck, tempFirmwareURL]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Render
  return (
    <>
      <ShimMenuHeader isChildPage={true} childPageTitle="Updates" />
      <div className="shim-menu-updates menu-container" style={{ paddingBottom: '290px' }}>
        <section>
          <h4>Software</h4>
          <div className="indentation-wrapper">
            <TextInputField
              id="software-update-url"
              name="Software Update URL"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                // Reset the error state when user is editing the value
                softwareURLhasErrors ? setSoftwareURLhasErrors(false) : null;
                softwareUpdateAvailable ? dispatch(setSoftwareUpdateAvailable(false)) : null;
                lastSoftwareCheckMsg.message ? setLastSoftwareCheckMsg({ message: ``, color: 'normal' }) : null;

                setTempSoftwareURL(e.target.value);
                if (isValidURLFormat(e.target.value)) {
                  dispatch(setSoftwareUpdateURL({ value: e.target.value }));
                }
                if (e.target.value === '') {
                  dispatch(setSoftwareUpdateURL({ value: '' }));
                  setSoftwareURLhasErrors(false);
                  dispatch(setSoftwareUpdateAvailable(false));
                }
              }}
              validate={(value) => {
                if (value) {
                  setSoftwareURLhasErrors(!value.match(window.DeviceAPI.softwareUpdateValidationPattern));
                }
              }}
              className={softwareTextFieldClasses}
              value={tempSoftwareURL}
            />

            <Checkbox
              checked={dailySoftwareUpdateCheckEnabled}
              name="Check for software updates daily"
              id="daily-software-update-checkbox"
              onChange={() => {
                dispatch(
                  setCheckForSoftwareUpdate({
                    value: !dailySoftwareUpdateCheckEnabled,
                  })
                );
              }}
            />
            <TimeInputField
              id="software-update-time"
              onChange={(isValid, newTime) => {
                if (isValid || newTime === '') {
                  // Fire an action only if new value is set
                  if (newTime !== softwareUpdateTime) {
                    dispatch(setCheckForSoftwareUpdateTime({ value: newTime }));
                  }
                }
              }}
              time={softwareUpdateTime}
            />

            <div className="button-with-feedback">
              <Button
                id="software-update-button__check-now"
                color={UIColor.Purple}
                disabled={!softwareUpdateURL || softwareURLhasErrors}
                onClick={onSoftwareUpdateClick}
              >
                {softwareUpdateAvailable ? 'Update Now' : 'Check For Software Update Now'}
              </Button>

              <span className="user-feedback" ref={softwareCheckEl}>
                {lastSoftwareCheckMsg.message}
              </span>
            </div>
          </div>
        </section>

        <section>
          <h4>Hardware</h4>
          <div className="indentation-wrapper">
            <TextInputField
              name="Firmware update URL"
              id="firmware-update-url"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                // Reset the error state when user is editing the value
                firmwareURLhasErrors ? setFirmwareURLhasErrors(false) : null;
                firmwareUpdateAvailable ? dispatch(setFirmwareUpdateAvailable(false)) : null;
                lastFirmwareCheck.message ? setLastFirmwareCheck({ message: ``, color: 'normal' }) : null;

                setTempFirmwareURL(e.target.value);
                if (isValidURLFormat(e.target.value)) {
                  dispatch(setFirmwareUpdateURL({ value: e.target.value }));
                }
                if (e.target.value === '') {
                  dispatch(setFirmwareUpdateURL({ value: '' }));
                  setFirmwareURLhasErrors(false);
                  dispatch(setFirmwareUpdateAvailable(false));
                }
              }}
              validate={(value) => {
                if (value) {
                  setFirmwareURLhasErrors(!value.match(window.DeviceAPI.firmwareUpdateURLValidationPattern));
                }
              }}
              className={firmwareTextFieldClasses}
              value={tempFirmwareURL}
            />

            <Checkbox
              checked={dailyfirmwareUpdateCheckEnabled}
              name="Check for firmware updates daily"
              id="daily-firmware-update-checkbox"
              onChange={() => {
                dispatch(
                  setCheckForFirmwareUpdate({
                    value: !dailyfirmwareUpdateCheckEnabled,
                  })
                );
              }}
            />
            <TimeInputField
              id="firmware-update-time"
              onChange={(isValid, newTime) => {
                if (isValid || newTime === '') {
                  // Fire an action only if new value is set
                  if (newTime !== firmwareUpdateTime) {
                    dispatch(setCheckForFirmwareUpdateTime({ value: newTime }));
                  }
                }
              }}
              time={firmwareUpdateTime}
            />
            <div className="button-with-feedback">
              <Button
                id="firmware-update-button__check-now"
                color={UIColor.Purple}
                disabled={!firmwareUpdateURL || firmwareURLhasErrors}
                onClick={onFirmwareUpdate}
              >
                {firmwareUpdateAvailable ? 'Update Now' : 'Check For Firmware Update Now'}
              </Button>

              <span className="user-feedback" ref={firmwareCheckEl}>
                {lastFirmwareCheck.message}
              </span>
            </div>

            {showFwDowngradeButton && (
              <>
                <div>
                  <Button
                    id="firmware-update-button__downgrade"
                    color={UIColor.Error}
                    onClick={() => {
                      setIsModalOpen(true);
                    }}
                  >
                    Downgrade Firmware
                  </Button>
                </div>

                <FirmwareDowngradeModal
                  active={isModalOpen}
                  onClose={() => {
                    setIsModalOpen(false);
                  }}
                />
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
