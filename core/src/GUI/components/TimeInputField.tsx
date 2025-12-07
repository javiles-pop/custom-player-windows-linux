import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TimeDisplay } from './TimeDisplay';
import { Logger, Time } from '../../Util';
import { useActiveElement } from '@core/GUI/hooks/useActiveElement';
import { addHours } from 'date-fns';
import { Keyboard } from '@core/constants';
import { NumericKeyboard } from './VirtualKeyboard';
import { useVirtualKeyboard } from '@core/Util/useVirtualKeyboard';

interface TimeInputProps {
  time: string;
  onChange: (valid: boolean, newTime: string) => void;
  name?: string;
  id: string;
}

export default function TimeInput({ time, onChange, name, id }: TimeInputProps) {
  const [_time, setTime] = useState(time);
  const [focused, setFocused] = useState(false);
  const [cursorPos, setCursorPos] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const label = useRef<HTMLLabelElement>(null);
  const { keyboard, showVirtualKeyboard, shouldUseVirtualKeyboard, setShowVirtualKeyboard } = useVirtualKeyboard();
  const activeElement = useActiveElement();

  // handler for moving the cursor in the input
  const onCursorChange = (input: HTMLInputElement) => {
    if (input.selectionEnd && input.selectionEnd >= 4) {
      setCursorPos(3);
    } else if (input.selectionEnd && input.selectionEnd <= 0) {
      setCursorPos(0);
    } else {
      setCursorPos(input.selectionEnd);
    }
  };

  const onClickToggleFocus = useCallback(
    (e: React.KeyboardEvent<HTMLLabelElement> | React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setFocused(!focused);
      return false;
    },
    [focused]
  );

  // this needs to be here in the case that the prop time is explicitly set to ''.
  useEffect(() => {
    if (time === '' && time !== _time) {
      setTime('');
    }

    if (time !== '' && time !== _time) {
      setTime(time);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time]);

  // called when virtual keyboard value changes.
  const onInputChange = useCallback(
    (value: string) => {
      if (shouldUseVirtualKeyboard) {
        onChange(true, value);
        onCursorChange(input.current!);
      }
    },
    [onChange, shouldUseVirtualKeyboard]
  );

  const onVirtualActionKeyPressed = useCallback(
    (key: string) => {
      if (key === '{enter}') {
        setShowVirtualKeyboard(false);
        setFocused(false);
        label.current?.focus();
      }
    },
    [setShowVirtualKeyboard]
  );

  // This tracks the "focus" of the number section & individual numbers.
  useEffect(() => {
    if (input.current && focused) {
      setShowVirtualKeyboard(true);
      input.current.focus();
      onCursorChange(input.current);
    } else {
      label.current?.focus();
      setShowVirtualKeyboard(false);
    }
  }, [input, focused, setShowVirtualKeyboard]);

  useEffect(() => {
    if (activeElement && shouldUseVirtualKeyboard && showVirtualKeyboard) {
      if (!(activeElement instanceof HTMLInputElement)) {
        setShowVirtualKeyboard(false);
      }
    }
  }, [activeElement, setShowVirtualKeyboard, shouldUseVirtualKeyboard, showVirtualKeyboard]);

  // update the virtual keyboard's internal value.
  useEffect(() => {
    if (keyboard.current) {
      keyboard.current.setInput(_time.replaceAll(':', '').substring(0, 4) ?? '');
    }
  }, [keyboard, _time]);

  // auto hide keyboard when input is filled and valid
  useEffect(() => {
    if (shouldUseVirtualKeyboard && showVirtualKeyboard && _time.length === 4 && new Time(_time).isValid()) {
      setShowVirtualKeyboard(false);
      setFocused(false);
      label.current?.focus();
    }
  }, [_time, showVirtualKeyboard, setShowVirtualKeyboard, shouldUseVirtualKeyboard]);

  return (
    <>
      <label
        className="time segmented-number-input"
        tabIndex={-1}
        data-navigable={true}
        id={`${id}__label`}
        ref={label}
        onClick={(e) => onClickToggleFocus(e)}
        onKeyUp={(e) => {
          if (e.key === Keyboard.ENTER || e.key === Keyboard.SELECT) {
            onClickToggleFocus(e);
          }
        }}
      >
        <input
          type="text"
          data-type="number"
          ref={input}
          id={`${id}__hidden-input`}
          value={_time.replace(/:/g, '').substring(0, 4)}
          maxLength={4}
          onChange={(e) => {
            setTime(e.target.value);
            onCursorChange(e.target);
          }}
          onKeyUp={(e) => {
            if (e.key === Keyboard.LEFT) {
              if (cursorPos! > 0) setCursorPos(cursorPos! - 1);
            }

            if (e.key === Keyboard.RIGHT) {
              if (cursorPos! < 3) setCursorPos(cursorPos! + 1);
            }
          }}
        />

        <TimeDisplay
          focused={focused}
          cursorPos={cursorPos}
          name={name}
          id={`${id}__ui`}
          value={_time}
          onChange={onChange}
          onPMToggle={(isPM) => {
            const h = isPM ? 12 : -12;
            try {
              const d = addHours(new Time(_time).asDate()!, h);
              const t = new Time(d);
              if (t.isValid()) {
                setTime(t.to24hString());
              }
            } catch {
              // ???
              Logger.error('If you see this message, something went very wrong in the Toggle Component.');
            }
          }}
        />
      </label>
      {shouldUseVirtualKeyboard ? (
        <NumericKeyboard
          maxLength={4}
          keyboard={keyboard}
          show={showVirtualKeyboard}
          onInputChange={onInputChange}
          onVirtualActionKeyPress={onVirtualActionKeyPressed}
        />
      ) : null}
    </>
  );
}
