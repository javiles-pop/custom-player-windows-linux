import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import Keyboard, { SimpleKeyboard } from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';

const BUTTON_THEME = [
  {
    class: 'purple',
    buttons: '{enter}',
  },
  {
    class: 'grey',
    buttons: '{bksp}',
  },
];

const SHIFT_THEME_ACTIVE = [
  {
    class: 'grey_light',
    buttons: '{shift}',
  },
];

const CAPS_THEME_ACTIVE = [
  {
    class: 'grey_light',
    buttons: '{lock}',
  },
];

const BUTTON_TEXT = {
  '{bksp}': 'delete',
  '{enter}': 'done',
  '{shift}': '⬆',
  '{tab}': '➡|',
};

const defaultLayout = [
  '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
  '{tab} q w e r t y u i o p [ ] \\',
  "{lock} a s d f g h j k l : ' {enter}",
  '{shift} z x c v b n m , . / {shift}',
  'https:// .com {space} ? &',
];

const shiftLayout = [
  '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
  '{tab} Q W E R T Y U I O P { } |',
  '{lock} A S D F G H J K L ; " {enter}',
  '{shift} Z X C V B N M < > ? {shift}',
  'https:// .com {space} ? &',
];

const customLayout = {
  default: defaultLayout,
  shift: shiftLayout,
};

interface VirtualKeyboardProps {
  keyboard: React.MutableRefObject<SimpleKeyboard | undefined>;
  maxLength?: number;
  onInputChange: (value: string) => void;
  onVirtualActionKeyPress: (key: string) => void;
  show: boolean;
}

/** @see https://hodgef.com/simple-keyboard/documentation/ */

export default function VirtualKeyboard({
  keyboard,
  maxLength,
  onInputChange,
  onVirtualActionKeyPress,
  show,
}: VirtualKeyboardProps) {
  const [isShift, setIsShift] = useState(false);
  const [isCaps, setIsCaps] = useState(false);

  const onKeyPress = useCallback(
    (key: string) => {
      if (key === '{shift}' || key === '{lock}') {
        if (key === '{shift}') {
          setIsShift(!isShift);
        }

        if (key === '{lock}') {
          setIsCaps(!isCaps);
        }
      }

      if (key === '{enter}') {
        // notify parent of key press.
        onVirtualActionKeyPress(key);
      }

      if (isShift) {
        setIsShift(false);
      }
    },

    [isCaps, isShift, onVirtualActionKeyPress]
  );

  const onChange = useCallback(
    (value: string) => {
      onInputChange(value);
    },
    [onInputChange]
  );

  return createPortal(
    <div className={classNames('fwi-keyboard', { show })}>
      <Keyboard
        buttonTheme={[...BUTTON_THEME, ...(isShift ? SHIFT_THEME_ACTIVE : []), ...(isCaps ? CAPS_THEME_ACTIVE : [])]}
        display={BUTTON_TEXT}
        keyboardRef={(r) => (keyboard.current = r)}
        layout={customLayout}
        layoutName={isCaps || isShift ? 'shift' : 'default'}
        maxLength={maxLength}
        mergeDisplay={true}
        onChange={onChange}
        onKeyPress={onKeyPress}
        preventMouseDownDefault={true}
        preventMouseUpDefault={true}
      />
    </div>,
    document.getElementById('portal') as HTMLElement
  );
}

export function NumericKeyboard({
  keyboard,
  maxLength,
  onInputChange,
  onVirtualActionKeyPress,
  show,
}: VirtualKeyboardProps) {
  const [isShift, setIsShift] = useState(false);

  const onChange = useCallback(
    (value: string) => {
      onInputChange(value);
    },
    [onInputChange]
  );

  const onKeyPress = useCallback(
    (key: string) => {
      if (key === '{shift}' || key === '{lock}') {
        if (key === '{shift}') {
          setIsShift(!isShift);
        }
      }

      if (key === '{enter}') {
        // notify parent of key press.
        onVirtualActionKeyPress(key);
      }
    },

    [isShift, onVirtualActionKeyPress]
  );

  return createPortal(
    <div className={classNames('fwi-keyboard', 'numeric', { show })}>
      <Keyboard
        buttonTheme={BUTTON_THEME}
        display={BUTTON_TEXT}
        keyboardRef={(r) => (keyboard.current = r)}
        layout={{
          default: ['1 2 3', '4 5 6', '7 8 9', '{bksp} 0 {enter}'],
          shift: ['! / #', '$ % ^', '& * (', '{shift} ) {bksp}'],
        }}
        maxLength={maxLength}
        onChange={onChange}
        onKeyPress={onKeyPress}
        theme="hg-theme-default hg-layout-numeric numeric"
        preventMouseDownDefault={true}
        preventMouseUpDefault={true}
      />
    </div>,
    document.getElementById('portal') as HTMLElement
  );
}
