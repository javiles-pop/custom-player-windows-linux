import React, { useEffect, useMemo } from 'react';
import { Time } from '../../Util';
import classnames from 'classnames';
import Toggle from './Toggle';
import classNames from 'classnames';

interface TimeDisplayProps {
  value: string;
  focused: boolean;
  cursorPos?: number | null;
  onChange?: (valid: boolean, value: string) => void;
  onPMToggle?: (isPM: boolean) => void;
  name?: string;
  id: string;
}

export function TimeDisplay({ value, onChange, onPMToggle, focused, cursorPos, name, id }: TimeDisplayProps) {
  const t = useMemo(() => {
    return new Time(value);
  }, [value]);

  const tString = t.toUIFormat() ?? '';

  useEffect(() => {
    if (t.isValid() && onChange) {
      onChange(t.isValid(), t.to24hString());
    } else if (onChange) {
      onChange(false, value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, value]);

  const segments = [...Array(4).keys()].map((_, i) => {
    // change classes depending on the "focus" and cursor position.
    const className = classNames(['segmented-number-value', { focused: focused && cursorPos === i }]);
    return (
      <span className={className} key={i} id={`${id}_segmented-number__${i}`}>
        {tString[i] ?? ' '}
      </span>
    );
  });

  return (
    <>
      <span className="label">{name}</span>
      <div className={classnames(['segmented-number-display', { 'has-errors': !t.isValid() && value.length >= 4 }])}>
        {segments}
      </div>
      <Toggle
        checked={t.isPM()}
        name=""
        id={`${id}__meridiem-toggle`}
        falseName="AM"
        trueName="PM"
        onChange={() => {
          if (onPMToggle) onPMToggle(!t.isPM());
        }}
      />
    </>
  );
}
