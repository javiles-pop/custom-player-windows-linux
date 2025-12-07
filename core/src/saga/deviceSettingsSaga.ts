import { takeEvery, fork } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { Shadow } from '@core/constants';
import { Logger } from '@core/Util';
import { storeExport as store } from '..';

export default function* saveDeviceSettings() {
  yield fork(updateDeviceOrientationToCloud);
}

export function* updateDeviceOrientationToCloud() {
  yield takeEvery(
    ['deviceSettings/setDisplayOrientation'],
    function* execute({ type, payload }: PayloadAction<updateStateWithOrientation>) {
      switch (type) {
        case 'deviceSettings/setDisplayOrientation':
          Logger.info(`[DISPLAY] New Orientaion Saved: ${payload.value}°`);
          window.DeviceAPI?.setScreenOrientation(payload.value);
          yield updateShadow(Shadow.Orientation, payload);
          break;

        default:
          break;
      }
    }
  );
}

function* updateShadow(cloudKey: string, update: updateStateWithOrientation) {
  if (!update.ignoreUpdateToCloud) {
    let value = update.value.toString();
    if (cloudKey === Shadow.Orientation) {
      yield (value = `${update.value} Degrees`);
    }
    const updatedDelta = { [cloudKey]: value };
    const deviceId = store.getState().fwiCloud.provisionedDevicePayload?.deviceId;
    if (deviceId) {
      window.MQTT?.publish(
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
