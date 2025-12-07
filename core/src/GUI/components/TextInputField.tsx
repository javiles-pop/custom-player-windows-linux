import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Keyboard } from '@core/constants';
import VirtualKeyboard, { NumericKeyboard } from './VirtualKeyboard';
import { useVirtualKeyboard } from '@core/Util/useVirtualKeyboard';

interface TextFieldProps {
  name: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  id: string;
  onKeyUp?: any;
  value?: string;
  type?: string;
  validate?: (value?: string) => void;
  className?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
}

function TextInputField({
  className,
  id,
  max,
  min,
  name,
  onChange,
  placeholder,
  type = 'text',
  validate,
  value,
  ...props
}: TextFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const label = useRef<HTMLLabelElement>(null);
  const isInitialRender = useRef(true);
  const [disabled, setDisabled] = useState(props.disabled ?? true);
  const extraProps = type == 'number' ? { min, max } : {};
  const { keyboard, showVirtualKeyboard, shouldUseVirtualKeyboard, setShowVirtualKeyboard, onVirtualActionKeyPressed } =
    useVirtualKeyboard();

  const validator = useCallback(
    (input?: string) => {
      validate?.(input);
    },
    [validate]
  );

  // Only focus when explicitly changing from disabled to enabled state,
  // not on component mount which was causing the bug
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (props.disabled !== true && !disabled) {
      // Only focus when going from disabled to enabled
      input.current?.focus();
    } else if (props.disabled !== true && disabled) {
      // Focus on label when going from enabled to disabled
      label.current?.focus();
    }
  }, [disabled, props.disabled]);

  // called when virtual keyboard value changes.
  const onInputChange = useCallback(
    (value: string) => {
      if (shouldUseVirtualKeyboard) {
        onChange?.({ target: { value } } as React.ChangeEvent<HTMLInputElement>);
      }
    },
    [onChange, shouldUseVirtualKeyboard]
  );

  const onLabelKeyUp = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === Keyboard.ENTER || e.key === Keyboard.SELECT) {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
          validator(input.current?.value);
        }
        setDisabled(!disabled);
        input.current?.focus();
        return false;
      }
    },
    [disabled, validator]
  );

  // update the virtual keyboard's internal value.
  useEffect(() => {
    if (keyboard.current) {
      keyboard.current.setInput(value ?? '');
    }
  }, [keyboard, value]);

  return (
    <>
      <label
        htmlFor={name}
        className="text-input-field"
        tabIndex={-1}
        data-navigable={true}
        id={`${id}__label`}
        ref={label}
        onKeyUp={onLabelKeyUp}
        onClick={() => {
          setDisabled(false);
        }}
      >
        <span>{name.replace(/(-|_)/gi, ' ')}</span>
        <input
          onChange={onChange}
          placeholder={placeholder}
          value={value}
          type={type}
          className={'focusable ' + className}
          onFocus={() => {
            setShowVirtualKeyboard(true);
            input.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }}
          onBlur={() => {
            setShowVirtualKeyboard(false);
            setDisabled(true);
          }}
          ref={input}
          disabled={disabled}
          id={id}
          {...extraProps}
        />
      </label>

      {shouldUseVirtualKeyboard && type !== 'tel' ? (
        <VirtualKeyboard
          show={showVirtualKeyboard}
          keyboard={keyboard}
          onInputChange={onInputChange}
          onVirtualActionKeyPress={onVirtualActionKeyPressed}
        />
      ) : null}

      {/* only used by Proxy Port field */}
      {shouldUseVirtualKeyboard && type === 'tel' ? (
        <NumericKeyboard
          maxLength={max}
          show={showVirtualKeyboard}
          keyboard={keyboard}
          onInputChange={onInputChange}
          onVirtualActionKeyPress={onVirtualActionKeyPressed}
        />
      ) : null}
    </>
  );
}

export default TextInputField;
