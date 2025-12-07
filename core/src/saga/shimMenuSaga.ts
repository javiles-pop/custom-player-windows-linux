import { takeEvery, fork } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { spoofPausedVideoPlayback } from '@core/Util';

export default function* shimMenuSagas() {
  yield fork(shimMenuActiveSaga);
}

export function* shimMenuActiveSaga() {
  yield takeEvery(
    ['shimMenu/setMenuStatus', 'shimMenu/resetShimMenu'],
    function* execute({ type, payload }: PayloadAction<boolean>) {
      switch (type) {
        case 'shimMenu/resetShimMenu':
          yield onShimMenuClose();
          break;

        case 'shimMenu/setMenuStatus':
          if (payload === true) {
            yield onShimMenuOpen();
          } else {
            yield onShimMenuClose();
          }
          break;

        default:
          break;
      }
    }
  );
}

function onShimMenuClose() {
  const iframe = document.getElementById('player-iframe');
  if (iframe) {
    iframe.style.display = 'block';
  }
  const bgImage = document.getElementById('spoofed-background-image');
  if (bgImage) {
    document.body.removeChild(bgImage);
  }
}

async function onShimMenuOpen() {
  await spoofPausedVideoPlayback();
  // ensure that the first element is always focused.
  const firstElement = document.querySelector('[data-navigable="true"]') as HTMLElement | undefined;
  firstElement?.focus();
}
