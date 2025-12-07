import { takeEvery, fork, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { storeExport } from '..';
import { spoofPausedVideoPlayback } from '@core/Util';
import { doOfflineFlow, doOnlineFlow, probeForInternetConnectivity } from '@core/Flows/NetworkChangeFlow';
import Logger from 'js-logger';
import { DiskKeys } from '@core/constants';

export default function* deviceStateSagas() {
  yield fork(deviceStateSaga);
}

export function* deviceStateSaga() {
  yield takeLatest(
    [
      'deviceState/setCurrentChannelContainsVideo',
      'deviceState/setDeviceConnected',
      'deviceState/setDeviceOnline',
      'deviceState/setTouchScreen',
    ],
    function* execute({ type, payload }: PayloadAction<boolean>) {
      switch (type) {
        case 'deviceState/setCurrentChannelContainsVideo':
          if (payload) {
            yield onChannelContainsVideoContent();
          }
          break;

        case 'deviceState/setDeviceConnected':
          probeForInternetConnectivity();
          break;

        case 'deviceState/setDeviceOnline':
          Logger.info(`[NETWORK] Device can${payload ? ' ' : ' not '}reach internet.`);
          payload ? doOnlineFlow() : doOfflineFlow();
          break;
        case 'deviceState/setTouchScreen':
          if (payload) {
            Logger.info('[DEVICE] Touchscreen overlay detected.');
          }
          break;
        default:
          break;
      }
    }
  );

  yield takeEvery(['deviceState/setLastSoftwareCheck'], function* execute({ type, payload }: PayloadAction<string>) {
    yield window.DeviceAPI.setSetting(DiskKeys.lastSoftwareCheck, payload);
  });
}

function* onChannelContainsVideoContent() {
  const { shimMenuActive } = storeExport.getState().shimMenu;
  const bgImageElement = document.getElementById('spoofed-background-image');

  /* this block runs when the channel is changed to something with video content, and the menu is already open. We'll take a screenshot, and then drop it behind the menu.
  Technically the screenshot will include the opened menu, but it shouldn't make a difference as far as the illusion of "paused" content is concerned.
  */
  if (shimMenuActive && !bgImageElement) {
    yield spoofPausedVideoPlayback();
  }
}
