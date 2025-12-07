import { takeEvery, fork } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { storeExport } from '..';
import { createMQTTConnectionFromDeviceID } from '@core/MQTT';
import { Logger } from '@core/Util';

export default function* FWICloudSagas() {
  yield fork(FWICloudSaga);
}

export function* FWICloudSaga() {
  yield takeEvery(['FWICloud/setConnectedToCloud'], function* execute({ type, payload }: PayloadAction<boolean>) {
    switch (type) {
      case 'FWICloud/setConnectedToCloud':
        yield payload ? null : reconnectToCloud();
        break;

      default:
        break;
    }
  });
}

function* reconnectToCloud() {
  const { appSettings, deviceState } = storeExport.getState();
  if (appSettings.activated && appSettings.deviceID && deviceState.deviceOnline) {
    Logger.warn('[MQTT] Device is still online. Re-establishing Harmony connection.');
    yield createMQTTConnectionFromDeviceID(appSettings.deviceID);
  }
}
