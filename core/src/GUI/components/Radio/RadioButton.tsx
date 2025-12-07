import { Keyboard } from '@core/constants';
import React, { useRef } from 'react';

export interface RadioButtonProps extends React.HTMLAttributes<HTMLElement> {
  value: any;
  name: string;
  label: string;
  checked?: boolean;
}

export function RadioButton(props: RadioButtonProps) {
  const button = useRef<HTMLInputElement>(null);
  const computedProps = {
    ...{
      className: 'fwi-radio-button',
    },
    ...props,
    ...{
      children: null,
    },
  };

  return (
    <label
      className="fwi-radio-button-label"
      data-navigable={true}
      tabIndex={-1}
      htmlFor={props.name}
      onKeyUp={(e) => {
        if ((e.key === Keyboard.ENTER || e.key === Keyboard.SELECT) && button.current) {
          button.current.click();
        }
      }}
    >
      <span className="radio-container">
        <input
          {...computedProps}
          type="radio"
          ref={button}
          onChange={(e) => {
            props.onChange ? props.onChange(e) : null;
          }}
        />
      </span>
      <span className="label">{props.label}</span>
      <div className="radio-button-children">{props.children ?? null}</div>
    </label>
  );
}
