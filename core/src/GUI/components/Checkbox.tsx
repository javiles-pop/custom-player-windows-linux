import React from 'react';
import { Keyboard } from '@core/constants';

export interface CheckboxProps {
  checked: boolean;
  name: string;
  onChange: (e?: React.ChangeEvent<HTMLInputElement>) => void;
  id: string;
}

export default function Checkbox(props: CheckboxProps) {
  const newProps = {
    ...props,
    ...{
      type: 'checkbox',
      name: props.name.replace(/ /g, '-').toLowerCase(),
      id: props.id,
      className: 'fwi-checkbox',
      'data-navigable': true,
      onKeyUp: (e: React.KeyboardEvent) => {
        if (e.key === Keyboard.ENTER || e.key === Keyboard.SELECT) {
          e.preventDefault();
          props.onChange();
        }
        return true;
      },
      onClick: () => {
        props.onChange();
      },
    },
  };
  return (
    <div>
      <label htmlFor={props.name.replace(/ /g, '-').toLowerCase()} className="checkbox-label" id={`${props.id}__label`}>
        <input {...newProps} />
        <span>{props.name}</span>
      </label>
    </div>
  );
}
