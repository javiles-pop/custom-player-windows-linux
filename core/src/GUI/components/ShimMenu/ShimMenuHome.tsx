import React, { useState, useEffect } from 'react';
import ShimMenuRow from './ShimMenuRow';
import channelIcon from '../../assets/icons/channel-icon.svg';
import updatesIcon from '../../assets/icons/updates-icon.svg';
import loggingIcon from '../../assets/icons/logging-icon.svg';
import aboutIcon from '../../assets/icons/about-icon.svg';
import timersIcon from '../../assets/icons/timers-icon.svg';
import accessCodeIcon from '../../assets/icons/access-code-icon.svg';
import displayOrientationIcon from '../../assets/icons/orientation-icon.svg';
import advancedIcon from '../../assets/icons/advanced-icon.svg';
import ShimMenuHeader from './ShimMenuHeader';
import {
  DEPLOYMENT,
  ABOUT,
  LOGGING,
  TIMERS,
  ACCESS_CODE,
  DISPLAY_ORIENTATION,
  ADVANCED,
  UPDATES,
} from '../../../constants';
import { useSelector } from 'react-redux';
import { pluralize, transformURLtoQueryComponentString } from '@core/Util';
import { RootState } from '@core/createStore';
import { capitalize } from '@core/Util';

// Shows the main menu as well as previews of important data regarding configuration of the app.
// Some menu items are not available on all devices.
export default function ShimMenuHome() {
  const {
    currentURL,
    deviceName,
    accessCode,
    logLevel,
    orientation,
    timers,
    timersEnabled,
    softwareUpdateAvailable,
    firmwareUpdateAvailable,
  } = useSelector((state: RootState) => {
    return {
      currentURL: state.appSettings.currentURL,
      deviceName: state.appSettings.deviceName,
      accessCode: state.appSettings.accessCode,
      logLevel: state.appSettings.logLevel,
      orientation: state.deviceSettings.orientation,
      timers: state.appSettings.onOffTimers ?? [],
      timersEnabled: state.appSettings.enableOnOffTimers,
      softwareUpdateAvailable: state.deviceState.softwareUpdateAvailable,
      firmwareUpdateAvailable: state.deviceState.firmwareUpdateAvailable,
    };
  });

  const [serial, setSerial] = useState('--');
  const [displayName, setDisplayName] = useState(deviceName);
  const [channelURL, setChannelURL] = useState('');

  const updateAvailable = softwareUpdateAvailable || firmwareUpdateAvailable;

  useEffect(() => {
    // serial number is not going to change, so there's no need for this to be included in the state.
    if (serial === '--') {
      window.DeviceAPI?.getSerialNumber().then((serial: string) => {
        setSerial(serial);
      });
    }
  }, [serial]);

  useEffect(() => {
    if (deviceName !== displayName) {
      deviceName ? setDisplayName(deviceName) : setDisplayName(serial);
    }
  }, [deviceName, displayName, serial]);

  useEffect(() => {
    // Listen for shadow updates
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SHADOW_UPDATE' && event.data.CurrentURL) {
        setChannelURL(event.data.CurrentURL);
      }
    };

    window.addEventListener('message', handleMessage);
    window.postMessage({ type: 'REQUEST_CHANNEL_URL' }, '*');
    
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <>
      <ShimMenuHeader signName={displayName} />
      <div className="shim-menu-home">
        <ShimMenuRow
          name="Channel"
          iconPath={channelIcon}
          detailText={channelURL || 'Not Configured'}
          textColor={channelURL ? '' : 'error-text'}
          badged={!channelURL}
          onClickNavPath={DEPLOYMENT}
        />
        <ShimMenuRow
          name="Logging"
          iconPath={loggingIcon}
          detailText={'Log Level: ' + capitalize(logLevel)}
          onClickNavPath={LOGGING}
        />
        <ShimMenuRow
          name="Timers"
          iconPath={timersIcon}
          detailText={timersEnabled ? `${timers.length} ${pluralize('Timer', timers.length)}` : 'Disabled'}
          onClickNavPath={TIMERS}
        />
        <ShimMenuRow
          name="Access Code"
          iconPath={accessCodeIcon}
          detailText={accessCode ? '' : 'Not configured'}
          textColor={accessCode ? '' : 'warn-text'}
          onClickNavPath={ACCESS_CODE}
        />

        {window.DeviceAPI.supportsDisplayRotation ? (
          <ShimMenuRow
            name="Display"
            iconPath={displayOrientationIcon}
            detailText={`${orientation}°`}
            onClickNavPath={DISPLAY_ORIENTATION}
          />
        ) : null}

        <ShimMenuRow
          name="Updates"
          iconPath={updatesIcon}
          detailText={updateAvailable ? 'Update Available' : 'Up To Date'}
          textColor={updateAvailable ? 'info-text' : ''}
          badged={updateAvailable}
          onClickNavPath={UPDATES}
        />
        <ShimMenuRow name="Advanced" iconPath={advancedIcon} detailText={''} onClickNavPath={ADVANCED} />
        <ShimMenuRow name="About" iconPath={aboutIcon} detailText={`Serial Number: ${serial}`} onClickNavPath={ABOUT} />
      </div>
    </>
  );
}
