import { spawn } from 'redux-saga/effects';
import appSettingsSaga from './appSettingsSaga';
import shimMenuSaga from './shimMenuSaga';
import deviceStateSaga from './deviceStateSaga';
import FWICloudSagas from './fwiCloudSaga';
import deviceSettingsSaga from './deviceSettingsSaga';

export default function* rootSaga() {
  yield spawn(appSettingsSaga);
  yield spawn(shimMenuSaga);
  yield spawn(deviceStateSaga);
  yield spawn(FWICloudSagas);
  yield spawn(deviceSettingsSaga);
}
