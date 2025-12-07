import { RootState } from '@core/createStore';
import { useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { SimpleKeyboard } from 'react-simple-keyboard';

export function useVirtualKeyboard() {
  const keyboard = useRef<SimpleKeyboard>();
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);
  const isTouchScreen = useSelector((state: RootState) => state.deviceState.touchScreen);

  const shouldUseVirtualKeyboard = isTouchScreen && window.DeviceAPI.supportsVirtualKeyboard;

  const onVirtualActionKeyPressed = useCallback((key: string) => {
    if (key === '{enter}') {
      setShowVirtualKeyboard(false);
    }
  }, []);

  return {
    keyboard,
    showVirtualKeyboard,
    shouldUseVirtualKeyboard,
    setShowVirtualKeyboard,
    onVirtualActionKeyPressed,
  };
}
