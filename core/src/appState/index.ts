import { combineReducers } from '@reduxjs/toolkit';
import { AppSettingReducer } from './appSetting';
import { ShimMenuReducer } from './shimMenuActive';
import { CloudReducer } from './fwiCloud';
import { deviceStateReducer } from './deviceState';
import { deviceSettingsReducer } from './deviceSettings';

const rootReducer = combineReducers({
  appSettings: AppSettingReducer,
  shimMenu: ShimMenuReducer,
  fwiCloud: CloudReducer,
  deviceState: deviceStateReducer,
  deviceSettings: deviceSettingsReducer,
});

export default rootReducer;
