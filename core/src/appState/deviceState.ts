import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { deviceState } from './initialState';
import { DeviceManufacturer } from '@core/constants';

const deviceStateSettings = createSlice({
  name: 'deviceState',
  initialState: deviceState,
  reducers: {
    setDeviceConnected(state: DeviceState, action: PayloadAction<boolean>) {
      state.deviceConnected = action.payload;
    },
    setDeviceOnline(state: DeviceState, action: PayloadAction<boolean>) {
      state.deviceOnline = action.payload;
    },
    setFeedbackMessageForSoftwareUpdate(state: DeviceState, action: PayloadAction<UserFeedbackMessage>) {
      state.feedbackMessageForSoftwareUpdate = action.payload;
    },
    setFeedbackMessageForFirmwareUpdate(state: DeviceState, action: PayloadAction<UserFeedbackMessage>) {
      state.feedbackMessageForFirmwareUpdate = action.payload;
    },

    setFeedbackMessageForCloudLogUpload(state: DeviceState, action: PayloadAction<UserFeedbackMessage>) {
      state.feedbackMessageForCloudLogUpload = action.payload;
    },

    setWebPlayerRetryID(state: DeviceState, action: PayloadAction<DeviceState['webPlayerRetryID']>) {
      state.webPlayerRetryID = action.payload;
    },

    setCurrentChannelContainsVideo(state: DeviceState, action: PayloadAction<boolean>) {
      // always pause video in background on BrightSign. Too many z-index issues.
      if (window.DeviceAPI.getManufacturer() === DeviceManufacturer.BrightSign) {
        state.currentChannelContainsVideo = true;
        return;
      }
      state.currentChannelContainsVideo = action.payload;
    },

    setFirmwareUpdateInProgress(state: DeviceState, action: PayloadAction<boolean>) {
      state.firmwareUpdateInProgress = action.payload;
    },

    setFirmwareUpdateSize(state: DeviceState, action: PayloadAction<number>) {
      state.firmwareUpdateSize = action.payload;
    },
    setFirmwareDownloadProgress(state: DeviceState, action: PayloadAction<string>) {
      state.firmwareDownloadProgress = action.payload;
    },
    setLastSoftwareCheck(state: DeviceState, action: PayloadAction<string>) {
      state.lastSoftwareCheck = action.payload;
    },
    setSoftwareUpdateAvailable(state: DeviceState, action: PayloadAction<boolean>) {
      state.softwareUpdateAvailable = action.payload;
    },
    setFirmwareUpdateAvailable(state: DeviceState, action: PayloadAction<boolean>) {
      state.firmwareUpdateAvailable = action.payload;
    },
    setIsDisplayOn(state: DeviceState, action: PayloadAction<boolean>) {
      state.isDisplayOn = action.payload;
    },

    setActiveNetworkInterface(state: DeviceState, action: PayloadAction<DeviceState['activeNetworkInterface']>) {
      state.activeNetworkInterface = action.payload;
    },

    setPreferredWifiNetwork(state: DeviceState, action: PayloadAction<string>) {
      state.preferredWifiNetwork = action.payload;
    },
    setTouchScreen(state: DeviceState, action: PayloadAction<boolean>) {
      state.touchScreen = action.payload;
    },

    setIsFreshBoot(state: DeviceState, action: PayloadAction<boolean>) {
      state.isFreshBoot = action.payload;
    },

    resetDeviceSettings() {
      return deviceState;
    },
  },
});

export const {
  setDeviceConnected,
  setDeviceOnline,
  resetDeviceSettings,
  setFeedbackMessageForSoftwareUpdate,
  setFeedbackMessageForFirmwareUpdate,
  setWebPlayerRetryID,
  setCurrentChannelContainsVideo,
  setFirmwareUpdateInProgress,
  setFirmwareUpdateSize,
  setFirmwareDownloadProgress,
  setLastSoftwareCheck,
  setSoftwareUpdateAvailable,
  setFirmwareUpdateAvailable,
  setIsDisplayOn,
  setFeedbackMessageForCloudLogUpload,
  setActiveNetworkInterface,
  setPreferredWifiNetwork,
  setTouchScreen,
  setIsFreshBoot,
} = deviceStateSettings.actions;

export const deviceStateReducer = deviceStateSettings.reducer;
