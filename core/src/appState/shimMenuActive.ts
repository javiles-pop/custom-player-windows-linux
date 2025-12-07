import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { shimMenuInitialState } from './initialState';

const shimMenuSettings = createSlice({
  name: 'shimMenu',
  initialState: shimMenuInitialState,
  reducers: {
    setMenuStatus(state: ShimMenu, action: PayloadAction<boolean>) {
      state.shimMenuActive = action.payload;
      if (!action.payload) {
        // if spoofed pause state exists, remove it and set the player visibility back to normal.
        const iframe = document.getElementById('player-iframe');
        if (iframe) {
          iframe.style.display = 'block';
        }
        const bgImage = document.getElementById('spoofed-background-image');
        if (bgImage) {
          document.body.removeChild(bgImage);
        }
      }
    },
    resetShimMenu() {
      return shimMenuInitialState;
    },

    setUserCanAccessMenu(state: ShimMenu, action: PayloadAction<boolean>) {
      state.userCanAccessMenu = action.payload;
    },
  },
});

export const { setMenuStatus, resetShimMenu, setUserCanAccessMenu } = shimMenuSettings.actions;
export const ShimMenuReducer = shimMenuSettings.reducer;
