import React, { useEffect, useCallback, useState, MutableRefObject } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@core/createStore';
import { CPWebFrame, useCPWebMessaging, setHost } from '@core/GUI/components/Player';
import ShimMenu from '../ShimMenu/ShimMenu';
import { listenForShimMenuHotKey, isValidURLFormat, extractBaseURL, initSavedTimers, Logger } from '../../../Util';
import { LogLevel, DiskKeys, DeviceManufacturer } from '@core/constants';
import { createMQTTConnectionFromDeviceID, checkActivationStatus } from '@core/MQTT';
import { setMenuStatus } from '@core/appState/shimMenuActive';
import { checkForPendingReboot, CPWebMessageRouter, executeCloudCommand, initCPWebComms } from '@core/MQTT';
import { getFinalSignURL } from '@core/Deployment';
import { setCurrentURL, setLogLevel } from '@core/appState/appSetting';
import AccessCodeModal from '../ShimMenu/AccessCodeModal';
import FirmwareUpdateModal from '../FirmwareUpdateModal';
import { checkActiveNetworkInterface } from '@core/Flows/NetworkChangeFlow';
import 'react-simple-keyboard/build/css/index.css';
import { onMount } from '@core/GUI/hooks/onMount';
import { useBackgroundTasks } from '@core/GUI/hooks/useBackgroundTasks';
import { ResolutionHint } from '../ResolutionHint';
import { Initializing } from './Initializing';

const ShimApp = () => {
  // setup store items
  const dispatch = useDispatch();
  const {
    currentURL,
    logLevel,
    shimMenuActive,
    provisionedDevice,
    token,
    webPlayerBaseURL,
    userCanAccessMenu,
    runScript,
    firmwareUpdateInProgress,
    deviceOnline,
    deviceName,
    isFwiCloudPlaylogEnabled,
    orientation,
    isFreshBoot,
  } = useSelector((state: RootState) => {
    return {
      currentURL: state.appSettings.currentURL,
      deviceName: state.appSettings.deviceName,
      deviceOnline: state.deviceState.deviceOnline,
      firmwareUpdateInProgress: state.deviceState.firmwareUpdateInProgress,
      isFreshBoot: state.deviceState.isFreshBoot,
      isFwiCloudPlaylogEnabled: state.appSettings.IsFwiCloudPlaylogEnabled,
      logLevel: state.appSettings.logLevel,
      orientation: state.deviceSettings.orientation,
      provisionedDevice: state.fwiCloud.provisionedDevicePayload,
      runScript: state.appSettings.runScript,
      shimMenuActive: state.shimMenu.shimMenuActive,
      token: state.appSettings.token,
      userCanAccessMenu: state.shimMenu.userCanAccessMenu,
      webPlayerBaseURL: state.appSettings.webPlayerBaseURL ?? '',
    };
  });

  /** the web player base url should be treated as readonly on-device. we'll compute this value locally depending
   *  on the current deployment. Since this url is used to construct channels, we need to avoid mutating this
   *  value. This way the user can use channels on separate instances of CPWeb without breaking Cloud channels.
   */
  const [baseURL, setBaseURL] = useState(webPlayerBaseURL);
  const needsInitPlaceholder = isFreshBoot && window.DeviceAPI.getManufacturer() === DeviceManufacturer.SSP;

  // setup background task functions.
  const addShimMenuHotkey = () => {
    listenForShimMenuHotKey();
  };

  const checkMQTTConnection = () => {
    if (!window.MQTT && deviceOnline) {
      const { deviceId } = provisionedDevice!;
      createMQTTConnectionFromDeviceID(deviceId);
    }
  };

  // listen for alt+c, check MQTT Connection, make sure device is still activated
  useBackgroundTasks([
    addShimMenuHotkey,
    checkMQTTConnection,
    checkActivationStatus,
    initSavedTimers,
    checkForPendingReboot,
    checkActiveNetworkInterface,
  ]);

  // Listen for CPWeb Messages
  const [iframe, sendMessage] = useCPWebMessaging(
    baseURL,
    useCallback((message: CPWebCommand) => {
      CPWebMessageRouter(message);
    }, [])
  );

  // This should only be used for messages that are not yet updated in the CPWebFrame package.
  window.DeviceAPI.postMessage = sendMessage;

  // Send CP Web Message to let it know we're SoC device.
  useEffect(() => {
    const computedWebPlayerBaseURL = extractBaseURL(currentURL);
    /** if a base url doesn't exist or is different from the current deployment, we need to set it,
     *  otherwise communication will not work. */
    if ((currentURL && !webPlayerBaseURL) || baseURL !== computedWebPlayerBaseURL) {
      setBaseURL(computedWebPlayerBaseURL);
    }

    if (iframe.current && token && currentURL && baseURL) {
      initCPWebComms(sendMessage, setHost, token, logLevel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    iframe,
    token,
    currentURL,
    logLevel,
    baseURL,
    webPlayerBaseURL,
    sendMessage,
    deviceName,
    isFwiCloudPlaylogEnabled,
  ]);

  // this is in a separate effect so that we don't re-establish CP web comms on every RunScript command.
  useEffect(() => {
    if (runScript) {
      executeCloudCommand(runScript, iframe as MutableRefObject<HTMLIFrameElement>, sendMessage);
    }
  }, [iframe, runScript, sendMessage]);

  onMount(() => {
    //  show menu based on presence of currently playing sign
    if (currentURL && deviceOnline) {
      dispatch(setMenuStatus(false));
      // verify we can still access the sign that we have saved.
      getFinalSignURL(currentURL)
        .then((url) => {
          if (url !== currentURL) {
            dispatch(setCurrentURL({ value: url }));
          }
        })
        .catch((error) => {
          Logger.error(error);
        });
    } else if (currentURL && !deviceOnline) {
      Logger.debug('[DEPLOYMENT] Device is offline. falling back to cached url');
      dispatch(setCurrentURL({ value: currentURL }));
    } else {
      dispatch(setMenuStatus(true));
    }

    // if user has not specified a log level, default to WARN.
    if (!window.DeviceAPI?.getSetting(DiskKeys.LogLevel)) {
      dispatch(setLogLevel({ value: LogLevel.WARN }));
    }
  });

  // If the current url changes, we need to stop the current sign.
  useEffect(() => {
    if (currentURL && deviceOnline && iframe.current && currentURL !== iframe.current.src) {
      sendMessage({ command: 'stop' });
    }
  }, [currentURL, deviceOnline, iframe, sendMessage]);

  // Samsung effect to redeploy channel based on device rotation since it does not require a reboot.
  useEffect(() => {
    if (!currentURL || window.DeviceAPI.getManufacturer() !== DeviceManufacturer.SSP) return;

    try {
      Logger.info('[ORIENTATION] Device orientation has changed the apsect ratio of the channel and must redeploy.');
      // Verify that we aren't going to redeploy with an expired token before we override the width and height params.
      getFinalSignURL(currentURL)
        .then((url) => {
          const deployedChannel = new URL(url);
          const { searchParams } = deployedChannel;
          // Samsung is not consistent with window width and height on non-zero orientations, so we have to manually override the values here.
          switch (orientation) {
            case 0:
            case 180:
              searchParams.set('width', '1920');
              searchParams.set('height', '1080');
              break;
            case 90:
            case 270:
              searchParams.set('width', '1080');
              searchParams.set('height', '1920');
              break;
          }
          dispatch(setCurrentURL({ value: deployedChannel.toString() }));
        })
        .catch((error) => {
          Logger.error(error);
        });
    } catch (error) {
      Logger.error(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orientation]);

  return (
    <>
      {needsInitPlaceholder ? <Initializing /> : null}
      {/* Iframe disabled - using separate rendering service */}
      {/* {isValidURLFormat(currentURL?.toString() ?? '') ? (
        <CPWebFrame
          src={currentURL!}
          id="player-iframe"
          ref={iframe}
          style={{
            opacity: needsInitPlaceholder ? 0 : 1,
          }}
        />
      ) : null} */}

      <AccessCodeModal />
      <ShimMenu active={shimMenuActive && userCanAccessMenu} />

      {firmwareUpdateInProgress ? <FirmwareUpdateModal /> : <></>}
      <ResolutionHint />
    </>
  );
};

export default ShimApp;
