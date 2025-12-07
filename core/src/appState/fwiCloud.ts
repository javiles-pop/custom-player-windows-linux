import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { isEmpty } from '@core/Util';
import { cloudInitialState } from './initialState';
import { saveObjectToDisk } from '@core/Util';
import { DiskKeys } from '@core/constants';

const fwiCloud = createSlice({
  name: 'FWICloud',
  initialState: cloudInitialState,
  reducers: {
    setAutoProvioning(state: Cloud, action: PayloadAction<number>) {
      state.provisioning.autoProvisioning = action.payload;
    },
    setAutoActivating(state: Cloud, action: PayloadAction<number>) {
      state.provisioning.autoActivating = action.payload;
    },
    setInviteCodeProvisioning(state: Cloud, action: PayloadAction<number>) {
      state.provisioning.inviteCodeProvisioning = action.payload;
    },
    setInviteCodeActivation(state: Cloud, action: PayloadAction<number>) {
      state.provisioning.inviteCodeActivating = action.payload;
    },
    setInviteCode(state: Cloud, action: PayloadAction<string>) {
      state.inviteCode = action.payload;
      window.DeviceAPI?.setSetting('invite_code', action.payload);
    },
    setProvisionedDevicePayload(state: Cloud, action: PayloadAction<ProvisionedDevicePayload>) {
      if (!isEmpty(action.payload)) {
        state.provisionedDevicePayload = action.payload;
        saveObjectToDisk(action.payload, DiskKeys.ProvisionedDevicePayload);
        window.DeviceAPI?.setSetting(DiskKeys.ProvisionedDevicePayload, JSON.stringify(action.payload));
      } else {
        console.error('SHIM-5437 Something just tried to set Provisioned Device Payload to an empty object.');
      }
    },
    setWebPlayerVersion(state: Cloud, action: PayloadAction<string>) {
      state.webPlayerVersion = action.payload;
    },
    setChannelName(state: Cloud, action: PayloadAction<string>) {
      state.channelName = action.payload;
    },
    resetDeviceProvisioning() {
      return cloudInitialState;
    },
    setConnectedToCloud(state: Cloud, action: PayloadAction<boolean>) {
      state.connected = action.payload;
    },
  },
});

export const {
  setAutoProvioning,
  setAutoActivating,
  setInviteCodeProvisioning,
  setInviteCodeActivation,
  setInviteCode,
  setProvisionedDevicePayload,
  resetDeviceProvisioning,
  setWebPlayerVersion,
  setChannelName,
  setConnectedToCloud,
} = fwiCloud.actions;
export const CloudReducer = fwiCloud.reducer;
