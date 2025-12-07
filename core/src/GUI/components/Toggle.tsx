import React, { useCallback } from 'react';
import { CheckboxProps } from '@core/GUI/components/Checkbox';
import { Keyboard } from '@core/constants';
import classNames from 'classnames';

interface ToggleProps extends CheckboxProps {
  falseName?: string;
  trueName?: string;
}

export default function Toggle({ checked, onChange, name, id, falseName, trueName }: ToggleProps) {
  const onClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange();
    },
    [onChange]
  );
  const inputProps = {
    checked,
    onChange,
    type: 'checkbox',
    name: name.replace(/ /g, '-').toLowerCase(),
    id,
    className: 'fwi-toggle',
    'data-navigable': true,
    onKeyUp: (e: React.KeyboardEvent) => {
      if (e.key === Keyboard.ENTER || e.key === Keyboard.SELECT) {
        e.preventDefault();
        e.stopPropagation();
        onChange();
      }
      return true;
    },
    onClick,
  };

  return (
    <>
      <label
        htmlFor={name.replace(/ /g, '-').toLowerCase()}
        className={classNames(['fwi-toggle', 'toggle-label', 'focusable', { checked }])}
        id={`${id}__label`}
      >
        <span style={{ fontWeight: checked ? 'normal' : 500 }}>{falseName}</span>
        <input {...inputProps} />
        <span style={{ fontWeight: checked ? 500 : 'normal' }}>{trueName}</span>
      </label>
    </>
  );
}
