import { takeEvery, fork, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { Shadow, DiskKeys, STOP_COMMAND } from '@core/constants';
import { storeExport as store } from '@core/index';
import { redeployCurrentSignWithNewBase, removeTokenFromUrl } from '@core/Deployment';
import { initializeLogLevel } from '@core/appState/initialState';
import {
  scheduleSoftwareUpdate,
  scheduleFirmwareUpdate,
  scheduleRebootUpdate,
  scheduleOnOffTimers,
  unscheduleOnOffTimers,
  createNewOnOffTimers,
} from '@core/Util/Scheduler';
import { setMenuStatus, setUserCanAccessMenu } from '@core/appState/shimMenuActive';
import { setCurrentChannelContainsVideo } from '@core/appState/deviceState';
import { isValidURLFormat, Logger, mapDeviceTimezonetoShadow } from '@core/Util';
import { uploadLogsAtRegularInterval, deactivateLogTimer } from '@core/Util/Scheduler';
import { timeIntervalOption } from '@core/Util';
import { mapShadowResolutionToDevice } from '@core/Util/ResolutionUtils';

export function* saveChangeToCloud() {
  yield takeEvery(
    [
      'appSettings/setCurrentURL',
      'appSettings/setAccessCode',
      'appSettings/setFirmwareUpdateURL',
      'appSettings/setSoftwareUpdateURL',
      'appSettings/setWebPlayerURL',
      'appSettings/setCheckForSoftwareUpdateTime',
      'appSettings/setRebootTime',
      'appSettings/setCheckForFirmwareUpdateTime',
      'appSettings/setTimeZone',
      'appSettings/setTimePure',
      'appSettings/setTimeServer',
      'appSettings/setUploadLogTimeInterval',
    ],

    function* execute({ type, payload }: PayloadAction<updateStateWithString>) {
      switch (type) {
        case 'appSettings/setCurrentURL':
          // if a channel value exists, send the stop command

          window.DeviceAPI.setSetting(DiskKeys.CurrentURL, payload.value);
          payload.value = removeTokenFromUrl(payload.value);
          yield updateShadow(Shadow.CurrentURL, payload);
          yield runChannelURLSaga();
          if (store.getState().appSettings.currentURL) {
            try {
              window.DeviceAPI.postMessage(STOP_COMMAND);
            } catch (error) {
              // fail silently
            }
          }
          break;

        case 'appSettings/setAccessCode':
          window.DeviceAPI?.setSetting(DiskKeys.AccessCode, payload.value);
          yield updateShadow(Shadow.AccessCode, payload);
          yield runAccessCodeSaga(payload.value);
          break;

        case 'appSettings/setFirmwareUpdateURL':
          window.DeviceAPI?.setSetting(DiskKeys.FirmwareUpdateURL, payload.value);
          yield updateShadow(Shadow.FirmwareUpdateURL, payload);
          scheduleFirmwareUpdate();
          break;

        case 'appSettings/setSoftwareUpdateURL':
          window.DeviceAPI?.setSetting(DiskKeys.SoftwareUpdateURL, payload.value);
          yield updateShadow(Shadow.SoftwareUpdateURL, payload);
          scheduleSoftwareUpdate();
          window.DeviceAPI?.setLaunchUrlAddress(payload.value);
          break;

        case 'appSettings/setWebPlayerURL':
          window.DeviceAPI?.setSetting(DiskKeys.WebPlayerURL, payload.value);
          redeployCurrentSignWithNewBase(payload.value);
          yield updateShadow(Shadow.WebPlayerURL, payload);
          break;

        case 'appSettings/setCheckForSoftwareUpdateTime':
          window.DeviceAPI?.setSetting(DiskKeys.CheckForSoftwareUpdateTime, payload.value);
          yield updateShadow(Shadow.CheckForSoftwareUpdateTime, payload);
          scheduleSoftwareUpdate();
          break;

        case 'appSettings/setRebootTime':
          window.DeviceAPI?.setSetting(DiskKeys.RebootTime, payload.value);
          yield updateShadow(Shadow.RebootTime, payload);
          scheduleRebootUpdate();
          break;

        case 'appSettings/setCheckForFirmwareUpdateTime':
          window.DeviceAPI?.setSetting(DiskKeys.CheckForFirmwareUpdateTime, payload.value);
          yield updateShadow(Shadow.CheckForFirmwareUpdateTime, payload);
          scheduleFirmwareUpdate();
          break;

        case 'appSettings/setTimeZone':
          window.DeviceAPI?.setSetting(DiskKeys.TimeZone, payload.value);
          yield updateShadow(Shadow.TimeZone, {
            value: mapDeviceTimezonetoShadow(payload.value),
            ignoreUpdateToCloud: payload.ignoreUpdateToCloud,
          });
          window.DeviceAPI.setTimeZone(payload.value);
          break;

        case 'appSettings/setTimeZonePure':
          window.DeviceAPI.setSetting(DiskKeys.TimeZone, payload.value);
          window.DeviceAPI.setTimeZone(payload.value);
          break;

        case 'appSettings/setTimeServer':
          window.DeviceAPI?.setSetting(DiskKeys.TimeServer, payload.value);
          if (isValidURLFormat(payload.value)) {
            window.DeviceAPI.setTimeServer(payload.value);
            yield updateShadow(Shadow.TimeServer, payload);
          } else {
            Logger.error('Invalid Time Server URL: ' + payload.value);
          }
          break;

        case 'appSettings/setUploadLogTimeInterval':
          window.DeviceAPI?.setSetting('upload_log_time_interval', payload.value);
          deactivateLogTimer(store.getState().appSettings.logUpdateIntervalId);
          localStorage.removeItem('logUploadTime');
          uploadLogsAtRegularInterval(payload.value);
          yield uploadLogIntervalToShadow(payload);
          break;

        default:
          break;
      }
    }
  );

  yield takeEvery(
    [
      'appSettings/setCheckForSoftwareUpdate',
      'appSettings/setWantReboot',
      'appSettings/setCheckForFirmwareUpdate',
      'appSettings/setCECEnabled',
      'appSettings/setEnableOnOffTimers',
      'appSettings/setEncryptedStorage',
    ],
    function* execute({ type, payload }: PayloadAction<updateStateWithBoolean>) {
      switch (type) {
        case 'appSettings/setCheckForSoftwareUpdate':
          window.DeviceAPI?.setSetting(DiskKeys.CheckForSoftwareUpdate, payload.value);
          yield updateShadow(Shadow.CheckForSoftwareUpdate, payload);
          scheduleSoftwareUpdate();
          break;

        case 'appSettings/setWantReboot':
          window.DeviceAPI?.setSetting(DiskKeys.WantReboot, payload.value);
          yield updateShadow(Shadow.WantReboot, payload);
          scheduleRebootUpdate();
          break;

        case 'appSettings/setCheckForFirmwareUpdate':
          window.DeviceAPI?.setSetting(DiskKeys.CheckForFirmwareUpdate, payload.value);
          yield updateShadow(Shadow.CheckForFirmwareUpdate, payload);
          scheduleFirmwareUpdate();
          break;

        case 'appSettings/setCECEnabled':
          window.DeviceAPI?.setSetting(DiskKeys.CECEnabled, payload.value);
          yield updateShadow(Shadow.CECEnabled, payload);
          break;

        case 'appSettings/setEnableOnOffTimers':
          window.DeviceAPI?.setSetting(DiskKeys.EnableOnOffTimers, payload.value);
          yield updateShadow(Shadow.EnableOnOffTimers, payload);
          payload.value ? scheduleOnOffTimers() : unscheduleOnOffTimers();
          break;

        case 'appSettings/setEncryptedStorage':
          if (payload.value) {
            window.DeviceAPI?.setSetting(DiskKeys.EncryptedStorage, payload.value);
            yield updateShadow(Shadow.EncryptedStorage, payload);
            window.DeviceAPI.encryptStorage(true);
          }
          break;

        default:
          break;
      }
    }
  );

  yield takeEvery('appSettings/setLogLevel', function* execute({ payload }: PayloadAction<updateStateWithLogLevel>) {
    initializeLogLevel(payload.value);
    window.DeviceAPI?.setSetting(DiskKeys.LogLevel, payload.value);
    yield updateShadow(Shadow.LogLevel, payload);
  });

  yield takeLatest('appSettings/setDeviceName', function* execute({ payload }: PayloadAction<string>) {
    window.DeviceAPI?.setSetting(DiskKeys.DeviceName, payload);
    yield updateShadow(Shadow.name, { value: payload });
  });

  yield takeEvery(
    'appSettings/setOnOffTimers',
    function* execute({ payload }: PayloadAction<updateStateWithOnOffTimers>) {
      window.DeviceAPI?.setSetting(DiskKeys.OnOffTimers, JSON.stringify(payload.value));
      yield updateShadow(Shadow.OnOffTimers, payload);
      // Unschedule the timers before re-scheduling
      payload.value.length > 0 ? createNewOnOffTimers(payload.value) : unscheduleOnOffTimers();
    }
  );

  yield takeEvery('appSettings/setProxy', function* execute({ payload }: PayloadAction<UpdateStateWithProxyObject>) {
    Logger.debug('appSettings/setProxy Saga running');
    const { /* proxyEnabled, proxyHost, proxyUser, proxyPass, */ proxyPort, proxyBypassBSN, proxyBypassHosts } =
      store.getState().appSettings;

    // create new values from payload, filling in blanks with current device settings.
    // const newUseProxy = 'UseProxy' in payload.value ? payload.value.UseProxy : proxyEnabled;
    // const newProxyHost = 'ProxyHost' in payload.value ? payload.value.ProxyHost : proxyHost;
    // const newProxyUser = 'ProxyUser' in payload.value ? payload.value.ProxyUser : proxyUser;
    // const newProxyPassword = 'ProxyPassword' in payload.value ? payload.value.ProxyPassword : proxyPass;
    const newProxyPort = 'ProxyPort' in payload.value ? payload.value.ProxyPort : proxyPort;

    const newBypassBSN =
      'ProxyBypassGroup' in payload.value && payload.value.ProxyBypassGroup?.BypassBSN
        ? payload.value.ProxyBypassGroup.BypassBSN
        : proxyBypassBSN;

    const newProxyBypassDomains =
      'ProxyBypassGroup' in payload.value && payload.value.ProxyBypassGroup?.ProxyBypassDomains
        ? payload.value.ProxyBypassGroup.ProxyBypassDomains
        : proxyBypassHosts;

    // save all new settings to disk
    yield Promise.all([
      window.DeviceAPI.setSetting(DiskKeys.ProxyPort, newProxyPort),
      window.DeviceAPI.setSetting(DiskKeys.ProxyBypassBSN, newBypassBSN),
      window.DeviceAPI.setSetting(DiskKeys.ProxyBypassDomains, JSON.stringify(newProxyBypassDomains)),
    ]).then(() => {
      Logger.debug('Applying proxy settings');
      window.DeviceAPI.applyProxy();
    });
  });

  yield takeEvery('appSettings/setProxyBypassHosts', function* execute({ payload }: PayloadAction<string[]>) {
    yield window.DeviceAPI.setSetting(DiskKeys.ProxyBypassDomains, JSON.stringify(payload));
  });

  yield takeEvery(
    ['appSettings/setVolume'],
    function* execute({ type, payload }: PayloadAction<updateStateWithNumber>) {
      switch (type) {
        case 'appSettings/setVolume':
          window.DeviceAPI?.setSetting(DiskKeys.Volume, payload.value);
          Logger.info(`[DISPLAY] New Volume Saved: ${payload.value}`);
          window.DeviceAPI?.setVolume(payload.value);
          yield updateShadow(Shadow.Volume, payload);
          break;

        default:
          break;
      }
    }
  );

  yield takeEvery(
    ['appSettings/setProxyHost', 'appSettings/setProxyUser', 'appSettings/setProxyPass', 'appSettings/setProxyPort'],
    function* execute({ type, payload }: PayloadAction<string>) {
      switch (type) {
        case 'appSettings/setProxyHost':
          yield window.DeviceAPI?.setSetting(DiskKeys.ProxyHost, payload);
          break;
        case 'appSettings/setProxyUser':
          yield window.DeviceAPI?.setSetting(DiskKeys.ProxyUser, payload);
          break;
        case 'appSettings/setProxyPass':
          yield window.DeviceAPI?.setSetting(DiskKeys.ProxyPassword, payload);
          break;
        case 'appSettings/setProxyPort':
          yield window.DeviceAPI?.setSetting(DiskKeys.ProxyPort, payload);
          break;
        default:
          break;
      }
    }
  );

  yield takeEvery(['appSettings/setResolution'], function* execute({ payload }: PayloadAction<updateStateWithString>) {
    yield window.DeviceAPI.getResolutions().then(({ best, active }) => {
      const { width, height, frequency } = mapShadowResolutionToDevice(payload.value, best);
      // don't continue if the resolution is already active
      if (active.includes(`${width}x${height}`)) {
        return;
      }

      window.DeviceAPI.setResolution(width, height, frequency).then((rebootRequired) => {
        updateShadow(Shadow.Resolution, payload);
        if (rebootRequired) {
          console.log('Reboot required to apply resolution changes in setResolution saga.');
          window.DeviceAPI.reboot();
        }
      });
    });
  });
}

type shadowUpdateType =
  | updateStateWithString
  | updateStateWithBoolean
  | updateStateWithLogLevel
  | updateStateWithOnOffTimers
  | updateStateWithNumber;

function* updateShadow(cloudKey: string, update: shadowUpdateType) {
  if (!update.ignoreUpdateToCloud) {
    const updatedDelta = { [cloudKey]: update.value };
    const deviceId = store.getState().fwiCloud.provisionedDevicePayload?.deviceId;
    if (deviceId) {
      yield window.MQTT?.publish(
        '$aws/things/' + deviceId + '/shadow/update',
        JSON.stringify({
          state: {
            reported: updatedDelta,
            desired: null,
          },
        })
      );
    }
  }
}

export default function* deploymentSagas() {
  yield fork(saveChangeToCloud);
}

function* runChannelURLSaga() {
  // reset this flag when channel url changes.
  yield store.dispatch(setCurrentChannelContainsVideo(false));
  yield store.dispatch(setMenuStatus(false));
}

function* runAccessCodeSaga(newAccessCode: string) {
  if (!store.getState().shimMenu.shimMenuActive) {
    yield store.dispatch(setUserCanAccessMenu(!newAccessCode.length));
  }
}

function* uploadLogIntervalToShadow(payload: updateStateWithString) {
  const cloudValue = { value: timeIntervalOption(payload.value) };
  const newPayload = { ...payload, ...cloudValue };
  yield updateShadow(Shadow.UploadLogTimeInterval, newPayload);
}
