import { appSettingsInitialState } from './initialState';
import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { Logger, isEmpty } from '@core/Util';
import { saveObjectToDisk } from '@core/Util';
import { DiskKeys } from '@core/constants';

const appSettings = createSlice({
  name: 'appSettings',
  initialState: appSettingsInitialState,
  reducers: {
    /*** IN SHADOW ***/
    setAccessCode(state: AppSettings, action: PayloadAction<updateStateWithString>) {
      if (state.accessCode !== action.payload.value) {
        state.accessCode = action.payload.value;
      }
    },
    setActivated(state: AppSettings, action: PayloadAction<boolean>) {
      state.activated = action.payload;
      window.DeviceAPI?.setSetting('activated', action.payload);
    },
    setAwsSettings(state: AppSettings, action: PayloadAction<AWSSettings>) {
      if (!isEmpty(action.payload)) {
        state.AWSSettings = action.payload;
        saveObjectToDisk(action.payload, DiskKeys.AWSSettings);
        window.DeviceAPI?.setSetting(DiskKeys.AWSSettings, JSON.stringify(action.payload));
      }
    },
    /*** IN SHADOW ***/
    setBacklightMode(state: AppSettings, action: PayloadAction<number>) {
      state.backlightMode = action.payload;
    },
    setCompanyID(state: AppSettings, action: PayloadAction<string>) {
      state.companyID = action.payload;
      window.DeviceAPI?.setSetting('companyID', action.payload);
    },
    /*** IN SHADOW ***/
    setCurrentURL(state: AppSettings, action: PayloadAction<updateStateWithString>) {
      if (state.currentURL !== action.payload.value) {
        state.currentURL = action.payload.value;
      }
    },
    setDeviceID(state: AppSettings, action: PayloadAction<string>) {
      state.deviceID = action.payload;
      window.DeviceAPI?.setSetting('device_id', action.payload);
    },
    setDeviceName(state: AppSettings, action: PayloadAction<string>) {
      state.deviceName = action.payload;
      window.DeviceAPI?.setSetting(DiskKeys.DeviceName, action.payload);
    },
    /*** IN SHADOW ***/
    setFirmwareUpdateURL(state: AppSettings, action: PayloadAction<updateStateWithString>) {
      if (state.firmwareUpdateURL !== action.payload.value) {
        state.firmwareUpdateURL = action.payload.value;
      }
    },
    setLanguage(state: AppSettings, action: PayloadAction<string>) {
      state.language = action.payload;
      window.DeviceAPI?.setSetting('language', action.payload);
    },
    setLinkAuthRequired(state: AppSettings, action: PayloadAction<boolean>) {
      state.linkAuthRequired = action.payload;
      window.DeviceAPI?.setSetting('linkAuthRequired', action.payload);
    },
    /*** IN SHADOW ***/
    setLogLevel(state: AppSettings, action: PayloadAction<updateStateWithLogLevel>) {
      if (state.logLevel !== action.payload.value) {
        state.logLevel = action.payload.value;
      }
    },
    /*** IN SHADOW ***/
    setUploadLogTimeInterval(state: AppSettings, action: PayloadAction<updateStateWithString>) {
      if (state.uploadLogTimeInterval !== action.payload.value) {
        state.uploadLogTimeInterval = action.payload.value;
      }
    },
    setLogUpdateIntervalId(state: AppSettings, action: PayloadAction<LogIntervalId>) {
      state.logUpdateIntervalId = action.payload;
    },
    setScheduledTasks(state: AppSettings, action: PayloadAction<ScheduledTask[]>) {
      state.scheduledTasks = action.payload;
    },
    /*** IN SHADOW ***/
    setSoftwareUpdateURL(state: AppSettings, action: PayloadAction<updateStateWithString>) {
      if (state.softwareUpdateURL !== action.payload.value) {
        state.softwareUpdateURL = action.payload.value;
      }
    },
    setToken(state: AppSettings, action: PayloadAction<string>) {
      state.token = action.payload;
      window.DeviceAPI?.setSetting('token', action.payload);
    },
    /*** IN SHADOW ***/
    setWebPlayerURL(state: AppSettings, action: PayloadAction<updateStateWithString>) {
      if (state.webPlayerBaseURL !== action.payload.value) {
        state.webPlayerBaseURL = action.payload.value;
      }
    },
    /*** IN SHADOW ***/
    setCheckForSoftwareUpdate(state: AppSettings, action: PayloadAction<updateStateWithBoolean>) {
      if (state.checkForSoftwareUpdate !== action.payload.value) {
        state.checkForSoftwareUpdate = action.payload.value;
      }
    },
    /*** IN SHADOW ***/
    setCheckForSoftwareUpdateTime(state: AppSettings, action: PayloadAction<updateStateWithString>) {
      if (state.checkForSoftwareUpdateTime !== action.payload.value) {
        state.checkForSoftwareUpdateTime = action.payload.value;
      }
    },
    /*** IN SHADOW ***/
    setWantReboot(state: AppSettings, action: PayloadAction<updateStateWithBoolean>) {
      if (state.wantReboot !== action.payload.value) {
        state.wantReboot = action.payload.value;
      }
    },
    /*** IN SHADOW ***/
    setRebootTime(state: AppSettings, action: PayloadAction<updateStateWithString>) {
      if (state.rebootTime !== action.payload.value) {
        state.rebootTime = action.payload.value;
      }
    },
    /*** IN SHADOW ***/
    setCheckForFirmwareUpdate(state: AppSettings, action: PayloadAction<updateStateWithBoolean>) {
      if (state.checkForHardwareUpdate !== action.payload.value) {
        state.checkForHardwareUpdate = action.payload.value;
      }
    },
    /*** IN SHADOW ***/
    setCheckForFirmwareUpdateTime(state: AppSettings, action: PayloadAction<updateStateWithString>) {
      if (state.checkForHardwareUpdateTime !== action.payload.value) {
        state.checkForHardwareUpdateTime = action.payload.value;
      }
    },
    /*** IN SHADOW ***/
    setEnableOnOffTimers(state: AppSettings, action: PayloadAction<updateStateWithBoolean>) {
      if (state.enableOnOffTimers !== action.payload.value) {
        state.enableOnOffTimers = action.payload.value;
      }
    },
    /*** IN SHADOW ***/
    setCECEnabled(state: AppSettings, action: PayloadAction<updateStateWithBoolean>) {
      if (state.CECEnabled !== action.payload.value) {
        state.CECEnabled = action.payload.value;
      }
    },
    /*** IN SHADOW ***/
    setOnOffTimers(state: AppSettings, action: PayloadAction<updateStateWithOnOffTimers>) {
      if (state.onOffTimers !== action.payload.value) {
        state.onOffTimers = action.payload.value;
      }
    },
    /*** IN SHADOW ***/
    setTimeZone(state: AppSettings, action: PayloadAction<updateStateWithString>) {
      if (state.timeZone !== action.payload.value) {
        state.timeZone = action.payload.value;
      }
    },

    // Only affects Redux State. does not report back to shadow. does not trigger reboot.
    setTimeZonePure(state: AppSettings, action: PayloadAction<string>) {
      if (state.timeZone !== action.payload) {
        state.timeZone = action.payload;
        window.DeviceAPI.setSetting(DiskKeys.TimeZone, action.payload);
        window.DeviceAPI.setTimeZone(action.payload);
      }
    },
    /*** IN SHADOW ***/
    setTimeServer(state: AppSettings, action: PayloadAction<updateStateWithString>) {
      if (state.timeServer !== action.payload.value) {
        state.timeServer = action.payload.value;
      }
    },
    setRunScript(
      state: AppSettings,
      action: PayloadAction<RunScriptCommand | ClearCacheCommand | RefreshChannelCommand | null | undefined>
    ) {
      state.runScript = action.payload;
    },

    setProxyEnabled(state: AppSettings, action: PayloadAction<boolean>) {
      state.proxyEnabled = action.payload;
    },

    setProxyHost(state: AppSettings, action: PayloadAction<string>) {
      state.proxyHost = action.payload;
    },

    setProxyUser(state: AppSettings, action: PayloadAction<string>) {
      state.proxyUser = action.payload;
    },

    setProxyPass(state: AppSettings, action: PayloadAction<string>) {
      state.proxyPass = action.payload;
    },

    setProxyPort(state: AppSettings, action: PayloadAction<string | undefined>) {
      state.proxyPort = action.payload;
    },

    setProxyBypassBSN(state: AppSettings, action: PayloadAction<boolean>) {
      state.proxyBypassBSN = action.payload;
    },

    setProxyBypassHosts(state: AppSettings, action: PayloadAction<string[]>) {
      state.proxyBypassHosts = action.payload;
    },

    /*** IN SHADOW ***/
    /* This action should only be called by the shadow. proxy settings on-device should use the individual actions for each setting. */
    setProxy(state: AppSettings, action: PayloadAction<UpdateStateWithProxyObject>) {
      state.proxyEnabled = action.payload.value.UseProxy ?? state.proxyEnabled;
      state.proxyHost = action.payload.value.ProxyHost ?? state.proxyHost;
      state.proxyPass = action.payload.value.ProxyPassword ?? state.proxyPass;
      state.proxyPort = action.payload.value.ProxyPort?.toString() ?? state.proxyPort;
      state.proxyBypassBSN = action.payload.value.ProxyBypassGroup?.BypassBSN ?? state.proxyBypassBSN;
      state.proxyBypassHosts = action.payload.value.ProxyBypassGroup?.ProxyBypassDomains ?? state.proxyBypassHosts;
    },

    // In Shadow
    setVolume(state: AppSettings, action: PayloadAction<updateStateWithNumber>) {
      state.volume = action.payload.value;
    },

    // In Shadow
    setResolution(state: AppSettings, action: PayloadAction<updateStateWithString>) {
      console.log('setResolution reducer', action.payload.value);
      state.resolution = action.payload.value;
      window.DeviceAPI.setSetting(DiskKeys.Resolution, action.payload.value);
    },

    setIsFwiCloudPlaylogEnabled(state: AppSettings, action: PayloadAction<updateStateWithBoolean>) {
      Logger.debug(`[LOGS] IsFwiCloudPlaylogEnabled: ${action.payload.value}`);
      state.IsFwiCloudPlaylogEnabled = action.payload.value;
      window.DeviceAPI.setSetting(DiskKeys.IsFwiCloudPlaylogEnabled, action.payload.value);
    },

    setVideoWallEnabled(state: AppSettings, action: PayloadAction<updateStateWithBoolean>) {
      state.videoWallEnabled = action.payload.value;
      window.DeviceAPI.setSetting(DiskKeys.VideoWallEnabled, action.payload.value);
    },

    setVideoWallBezelComp(state: AppSettings, action: PayloadAction<BezelCompensation>) {
      state.videoWallBezelComp = action.payload;
      window.DeviceAPI.setSetting(DiskKeys.VideoWallBezelComp, JSON.stringify(action.payload));
    },

    /*** IN SHADOW ***/
    setEncryptedStorage(state: AppSettings, action: PayloadAction<updateStateWithBoolean>) {
      state.encryptedStorage = action.payload.value;
      // This setting cannot be manually changed from true to false. you have to reformat the storage device.
      window.DeviceAPI.setSetting(DiskKeys.EncryptedStorage, true);
    },

    resetAppSettings() {
      return appSettingsInitialState;
    },
  },
});

export const {
  setAccessCode,
  setActivated,
  setAwsSettings,
  setBacklightMode,
  setCompanyID,
  setCurrentURL,
  setDeviceName,
  setDeviceID,
  setFirmwareUpdateURL,
  setLanguage,
  setLinkAuthRequired,
  setLogLevel,
  setScheduledTasks,
  setSoftwareUpdateURL,
  setToken,
  setWebPlayerURL,
  setCheckForSoftwareUpdate,
  setCheckForSoftwareUpdateTime,
  setWantReboot,
  setRebootTime,
  setCheckForFirmwareUpdate,
  setCheckForFirmwareUpdateTime,
  setEnableOnOffTimers,
  setCECEnabled,
  setOnOffTimers,
  setTimeZone,
  setTimeZonePure,
  setTimeServer,
  setUploadLogTimeInterval,
  setLogUpdateIntervalId,
  setRunScript,
  resetAppSettings,
  setProxy,
  setProxyEnabled,
  setProxyHost,
  setProxyUser,
  setProxyPass,
  setProxyPort,
  setProxyBypassBSN,
  setProxyBypassHosts,
  setVolume,
  setResolution,
  setIsFwiCloudPlaylogEnabled,
  setVideoWallEnabled,
  setVideoWallBezelComp,
  setEncryptedStorage,
} = appSettings.actions;

export const AppSettingsActions = appSettings.actions;

export const AppSettingReducer = appSettings.reducer;
