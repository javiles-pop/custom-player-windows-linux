/* eslint-disable radix */
import React, { useRef, HTMLAttributes, useCallback, useEffect } from 'react';
import { Keyboard } from '@core/constants';
import { NumericKeyboard } from './VirtualKeyboard';
import { useVirtualKeyboard } from '@core/Util/useVirtualKeyboard';
import { useActiveElement } from '@core/GUI/hooks/useActiveElement';

interface NumericalInputFieldProps extends HTMLAttributes<HTMLInputElement> {
  length: number;
  type?: 'password' | 'tel' | 'number';
  value: string;
  onUserInput: (newValue: string) => void;
  id: string;
  disabled?: boolean;
}

//  ================================================= //
//   THIS COMPONENT SHOULD ONLY BE USED FOR PASSWORDS //
//   BECAUSE OF THE VIRTUAL KEYBOARD.                 //
//  ================================================= //

export default function NumericalInput({ length, type, onUserInput, value, id, disabled }: NumericalInputFieldProps) {
  const label = useRef<HTMLLabelElement>(null);
  const activeElement = useActiveElement();
  const refs = [...Array(length).keys()].map(() => {
    return useRef<HTMLInputElement>(null);
  });
  const { keyboard, showVirtualKeyboard, shouldUseVirtualKeyboard, setShowVirtualKeyboard, onVirtualActionKeyPressed } =
    useVirtualKeyboard();

  const onKeyDown = (e: any, i: number) => {
    if (e.key === Keyboard.DOWN || e.key === Keyboard.UP) {
      e.preventDefault();
    }

    if (e.key === Keyboard.RIGHT) {
      e.preventDefault();
      if (i < length - 1) refs[i + 1].current?.focus();
    }
    if (e.key === Keyboard.LEFT) {
      e.preventDefault();
      if (i > 0) refs[i - 1].current?.focus();
    }
    if (e.key === Keyboard.ENTER || e.key === Keyboard.SELECT) {
      e.stopPropagation();
      if (e.key === Keyboard.ENTER || e.key === Keyboard.SELECT) {
        refs[i - 1]?.current?.blur();
        label.current?.focus();
      }
    }

    if (e.key === Keyboard.BACKSPACE || e.key === Keyboard.DELETE) {
      e.preventDefault();
      if (i > 0) {
        onUserInput(value.slice(0, -1));
        refs[i - 1].current?.focus();
      }
    }
  };

  const onKeyPress = useCallback(
    (e: any, i: number) => {
      if (!isNaN(parseInt(e.key as string))) {
        const newVal = value.split('');
        newVal.splice(i, 1, e.key as string);
        onUserInput(newVal.join(''));
        if (i < length - 1) refs[i + 1].current?.focus();
      }
    },
    [value, onUserInput, length, refs]
  );

  const segments = [...Array(length).keys()].map((_, i) => {
    return (
      <input
        type={type ?? 'text'}
        value={value.split('')[i] ?? ''}
        maxLength={1}
        key={i}
        name={id}
        readOnly={true}
        data-type="number"
        disabled={disabled ?? false}
        id={`${id}__segment_${i}`}
        ref={refs[i]}
        onFocus={() => {
          if (refs[i].current) {
            const el = refs[i].current;
            if (el && type !== 'number') el.selectionStart = 1;

            setShowVirtualKeyboard(true);
            refs[i].current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }}
        onKeyDown={(e) => {
          onKeyDown(e, i);
        }}
        onKeyPress={(e) => {
          onKeyPress(e, i);
        }}
        onClick={(e) => {
          e.stopPropagation();
          refs[i].current?.focus();
          setShowVirtualKeyboard(true);
        }}
      />
    );
  });

  // called when virtual keyboard value changes.
  const onInputChange = useCallback(
    (value: string) => {
      if (shouldUseVirtualKeyboard) {
        onUserInput?.(value);
        onKeyPress(value.split('')[0], 0);
      }
    },
    [onKeyPress, onUserInput, shouldUseVirtualKeyboard]
  );

  useEffect(() => {
    if (keyboard && !value) {
      keyboard.current?.setInput('');
    }
  }, [keyboard, value]);

  useEffect(() => {
    if (activeElement && shouldUseVirtualKeyboard && showVirtualKeyboard) {
      if (!(activeElement instanceof HTMLInputElement)) {
        setShowVirtualKeyboard(false);
      }
    }
  }, [activeElement, setShowVirtualKeyboard, shouldUseVirtualKeyboard, showVirtualKeyboard]);

  return (
    <>
      <label
        htmlFor={id}
        className={`segmented-number-input standard ${type}`}
        ref={label}
        tabIndex={-1}
        data-navigable={!disabled}
        id={`${id}__label`}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === Keyboard.ENTER || e.key === Keyboard.SELECT) {
            e.preventDefault();
            e.stopPropagation();
            refs[0].current?.focus();
            return false;
          }
        }}
        onFocus={() => {
          // setShowVirtualKeyboard(false);
        }}
        onBlur={() => {
          // setShowVirtualKeyboard(false);
        }}
        onClick={() => {
          console.log('label onClick');

          refs[0].current?.focus();
        }}
      >
        {segments}
      </label>
      {shouldUseVirtualKeyboard ? (
        <NumericKeyboard
          keyboard={keyboard}
          show={showVirtualKeyboard}
          onInputChange={onInputChange}
          onVirtualActionKeyPress={onVirtualActionKeyPressed}
        />
      ) : null}
    </>
  );
}
