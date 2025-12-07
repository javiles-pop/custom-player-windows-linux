import { Keyboard, UIColor } from '@core/constants';
import { useActiveElement } from '@core/GUI/hooks/useActiveElement';
import { useVirtualKeyboard } from '@core/Util/useVirtualKeyboard';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NumericKeyboard } from '../VirtualKeyboard';

interface NewNumericalInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  id: string;
}

export default function NewNumericalInput({ value, onChange, maxLength, id }: NewNumericalInputProps) {
  const { keyboard, onVirtualActionKeyPressed, setShowVirtualKeyboard, showVirtualKeyboard, shouldUseVirtualKeyboard } =
    useVirtualKeyboard();
  const hiddenInput = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLLabelElement>(null);
  const activeElement = useActiveElement();
  const [cursorPos, setCursorPos] = useState<number | null>(null);

  const internalOnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value === '' || !isNaN(Number(e.target.value))) {
        onChange(e.target.value);
        setCursorPos(e.target.selectionStart);
        keyboard.current?.setInput(e.target.value);
      }
    },
    [keyboard, onChange]
  );

  useEffect(() => {
    if (keyboard.current) {
      keyboard.current.setInput(value ?? '');
    }
  }, [value, keyboard]);

  useEffect(() => {
    if (activeElement && shouldUseVirtualKeyboard && showVirtualKeyboard) {
      if (!(activeElement instanceof HTMLInputElement)) {
        setShowVirtualKeyboard(false);
      }
    }
  }, [activeElement, setShowVirtualKeyboard, shouldUseVirtualKeyboard, showVirtualKeyboard]);

  return (
    <div>
      <label
        ref={labelRef}
        className="segmented-number-input standard"
        tabIndex={-1}
        data-navigable={true}
        id={`${id}__label`}
        onKeyDown={(e) => {
          if (e.key === Keyboard.ENTER || e.key === Keyboard.SELECT) {
            e.stopPropagation();
            e.preventDefault();
            hiddenInput.current?.focus();
            return false;
          }
        }}
        onClick={() => {
          hiddenInput.current?.focus();
        }}
      >
        <div className="displaySegments" style={{ display: 'flex', alignItems: 'center' }}>
          {Array(maxLength)
            .fill(undefined)
            .map((_, i) => (
              <span
                key={i}
                style={{
                  fontFamily: `'Urbanist', sans-serif`,
                  margin: '0 0.25rem',
                  textAlign: 'center',
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '20px',
                  height: '2.8rem',
                  width: '2.5rem',
                  borderRadius: '4px',
                  caretColor: 'transparent',
                  backgroundColor: i === cursorPos ? 'white' : '#eff3f6',
                  border: i === cursorPos ? `3px solid var(--${UIColor.Purple})` : 'solid 3px transparent',
                }}
              >
                {value.split('')[i] ?? ` `}
              </span>
            ))}
        </div>
        <input
          ref={hiddenInput}
          type="text"
          data-type="number"
          className="visually-hidden"
          style={{ width: '0px', height: '0px', opacity: 0, position: 'absolute' }}
          value={value}
          onChange={internalOnChange}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            // @ts-expect-error : selectionStart actually does exist on target
            setCursorPos(e.target.selectionStart as number);
            if (e.key === Keyboard.ENTER || e.key === Keyboard.SELECT) {
              e.stopPropagation();
              e.preventDefault();
              hiddenInput.current?.blur();
              labelRef.current?.focus();
              return false;
            }
          }}
          maxLength={7}
          onFocus={(e) => {
            setShowVirtualKeyboard(true);
            setCursorPos(e.target.selectionStart);
          }}
          onBlur={() => {
            setCursorPos(null);
          }}
        />
        {shouldUseVirtualKeyboard ? (
          <NumericKeyboard
            show={showVirtualKeyboard}
            keyboard={keyboard}
            maxLength={7}
            onInputChange={(_value) => {
              internalOnChange({ target: { value: _value } } as React.ChangeEvent<HTMLInputElement>);
            }}
            onVirtualActionKeyPress={onVirtualActionKeyPressed}
          />
        ) : null}
      </label>
    </div>
  );
}
