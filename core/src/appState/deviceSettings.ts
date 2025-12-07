import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { deviceSettings } from './initialState';

const deviceSettingsState = createSlice({
  name: 'deviceSettings',
  initialState: deviceSettings,
  reducers: {
    setDisplayOrientation(state: DeviceSettings, action: PayloadAction<updateStateWithOrientation>) {
      state.orientation = action.payload.value;
    },
  },
});

export const { setDisplayOrientation } = deviceSettingsState.actions;
export const deviceSettingsReducer = deviceSettingsState.reducer;
