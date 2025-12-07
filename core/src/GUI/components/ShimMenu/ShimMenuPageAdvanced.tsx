import React, { ChangeEvent, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@core/createStore';
import { setRebootTime, setTimeServer, setTimeZone, setWantReboot } from '@core/appState/appSetting';
import { isValidURLFormat, Time } from '@core/Util';
import ShimMenuHeader from './ShimMenuHeader';
import TextInputField from '../TextInputField';
import Button from '../Button';
import Checkbox from '../Checkbox';
import TimeInputField from '../TimeInputField';
import { REBOOT_WINDOW, UIColor } from '@core/constants';
import TimeZoneDropdown from '../TimeZoneDropdown';
import ProxySection from './ShimMenuSectionProxy';
import CacheSection from './ShimMenuSectionCache';
import { onMount } from '@core/GUI/hooks/onMount';
import { useFeedbackMessage } from '@core/GUI/hooks/useFeedbackMessage';
import { useTextFieldErrors } from '@core/GUI/hooks/useTextFieldErrors';
import { SectionStorageEncryption } from './SectionStorageEncryption';

export default function ShimMenuAdvanced() {
  const dispatch = useDispatch();
  const [message, setMessage, rebootMessageRef] = useFeedbackMessage({ persistent: true });

  // Hardware
  const { rebootDaily, rebootTime, timeZone, timeServer } = useSelector((state: RootState) => {
    return {
      rebootDaily: state.appSettings.wantReboot ?? false,
      rebootTime: state.appSettings.rebootTime ?? '',
      timeZone: state.appSettings.timeZone ?? 'MST',
      timeServer: state.appSettings.timeServer,
    };
  });

  const [timeServerErrorClasses, setTimeServerHasErrors] = useTextFieldErrors();

  onMount(() => {
    const backButton = document.querySelector('.back-button button') as HTMLButtonElement;
    backButton?.focus();
    document.querySelector('.menu-container')?.scrollTo(0, 0);
  });

  const showRebootMessage = useCallback(
    (newTime: string) => {
      if (newTime) {
        const t = new Time(newTime);
        const windowEnd = new Time(t.addMinutes(REBOOT_WINDOW)!);
        setMessage({
          message: `Device will reboot daily between ${t.toFormat('h:mm a')} and ${windowEnd.toFormat('h:mm a')}`,
          color: UIColor.Grey_extra_light,
        });
      }
    },
    [setMessage]
  );

  useEffect(() => {
    if (rebootDaily && rebootTime && !message.message) {
      showRebootMessage(rebootTime);
    }
    if (!rebootDaily && message.message) {
      setMessage({ message: '', color: UIColor.Grey_extra_light });
    }
    if (rebootDaily && !rebootTime && message.message) {
      setMessage({ message: '', color: UIColor.Grey_extra_light });
    }
  }, [message.message, rebootDaily, rebootTime, setMessage, showRebootMessage]);

  // // Show web security section if firmware is BS v8.5 or greater
  // useEffect(() => {
  //   if (window.DeviceAPI.getManufacturer() === DeviceManufacturer.BrightSign) {
  //     window.DeviceAPI.getFirmwareVersion().then((version) => {
  //       if (!semverIsGreater(version, '8.5.0')) {
  //         setShouldShowWebSecurity(true);
  //       }
  //     });
  //   }
  // }, []);

  // Render
  return (
    <>
      <ShimMenuHeader isChildPage={true} childPageTitle="Advanced" />
      <div className="shim-menu-advanced menu-container">
        <section>
          <h4>Hardware</h4>
          <div className="indentation-wrapper">
            <Checkbox
              checked={rebootDaily}
              name="Reboot daily at a random time starting at"
              id="daily-reboot-checkbox"
              onChange={() => {
                dispatch(setWantReboot({ value: !rebootDaily }));
              }}
            />
            <TimeInputField
              id="daily-reboot-time"
              onChange={(isValid, newTime) => {
                if (isValid || newTime === '') {
                  // Fire an action only if new value is set
                  if (newTime !== rebootTime) {
                    showRebootMessage(newTime);
                    dispatch(setRebootTime({ value: newTime }));
                  }
                }
              }}
              time={rebootTime}
            />

            <span className="indent helper" ref={rebootMessageRef}>
              {message.message}
            </span>
            <br />
            <Button id="reboot-now-button" color={UIColor.Purple} onClick={window.DeviceAPI?.reboot}>
              Reboot Now
            </Button>

            {window.DeviceAPI.supportsTimeZone ? (
              <TimeZoneDropdown
                options={window.DeviceAPI.getTimeZoneMap()}
                defaultOption={timeZone}
                id="timezone-select"
                onChange={(newTimeZone) => {
                  if (timeZone !== newTimeZone) {
                    dispatch(setTimeZone({ value: newTimeZone }));
                  }
                }}
              />
            ) : null}

            {window.DeviceAPI.supportsTimeServer ? (
              <TextInputField
                id="time-server-url"
                name="Time Server URL"
                value={timeServer}
                className={timeServerErrorClasses}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  dispatch(setTimeServer({ value: e.target.value ?? '' }));
                }}
                validate={(value) => {
                  if (value) {
                    setTimeServerHasErrors(!isValidURLFormat(value));
                  } else {
                    setTimeServerHasErrors(false);
                  }
                }}
              />
            ) : null}
          </div>
        </section>

        {window.DeviceAPI.supportsProxy ? <ProxySection /> : null}

        {window.DeviceAPI.supportsLocalCache ? <CacheSection /> : null}

        {window.DeviceAPI.supportsStorageEncryption ? <SectionStorageEncryption /> : null}

        {/* {shouldShowWebSecurity ? <ShimMenuSectionSecurity /> : null} */}
      </div>
    </>
  );
}
