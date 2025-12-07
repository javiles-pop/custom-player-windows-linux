import { Keyboard } from '@core/constants';
import classNames from 'classnames';
import React, { useEffect, useRef, useState, useCallback, ReactElement, useMemo } from 'react';
import WifiIcon from './WifiIcon';

export interface DropdownProps {
  // signal is only used for wifi bars
  options: { value: string; signal?: number }[];
  defaultOption: string;
  disabled?: boolean;
  onChange?: (selectedOption: string, isOpen?: boolean) => void;
  selection?: string;
  id: string;
}

/**
 * This component is essentially a checkbox with a list of buttons beneath it. checking the checkbox
 * changes the visibility state of the "dropdown" list to active. when a button is clicked it selects that option
 * and saves it to local component state.
 *
 * @param {DropdownProps} {options, defaultOption, onChange}
 */
export default function Dropdown({ options, defaultOption, disabled, onChange, selection, id }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const root = useRef<HTMLInputElement>(null);
  const otherNavigableElements = useRef<HTMLElement[]>([]);
  disabled = disabled ? disabled : false;

  // Derive the selected value from props and options
  const selected = useMemo(() => {
    // If we have an external selection that exists in options, use it
    if (selection && options.some((option) => option.value === selection)) {
      return selection;
    }

    // If defaultOption exists in options, use it
    if (options.some((option) => option.value === defaultOption)) {
      return defaultOption;
    }

    // If options exist but neither selection nor defaultOption is valid, use first option
    if (options.length > 0) {
      return options[0].value;
    }

    // Fallback to defaultOption even if it's not in options
    return defaultOption;
  }, [options, selection, defaultOption]);

  // Handle toggling the dropdown
  const handleToggleOpen = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  // Handle selection change
  const handleSelect = useCallback(
    (value: string) => {
      setOpen(false);
      if (onChange && value !== selected) {
        onChange(value, false);
      }
    },
    [onChange, selected]
  );

  // Handle selecting an option when clicked
  const onClickSetSelected = useCallback(
    (e, el: { value: string; signal?: number }) => {
      e.stopPropagation();
      e.preventDefault();
      handleSelect(el.value);
    },
    [handleSelect]
  );

  // disables other elements when the dropdown is open
  useEffect(() => {
    if (open && otherNavigableElements.current) {
      otherNavigableElements.current = Array.from(
        document.querySelectorAll('[data-navigable="true"]:not(.dropdown-option)')
      );

      otherNavigableElements.current.forEach((el) => {
        el.dataset.navigable = 'false';
      });
    }

    if (!open && otherNavigableElements.current.length) {
      otherNavigableElements.current.forEach((el) => {
        el.dataset.navigable = 'true';
      });
    }
  }, [open]);

  return (
    <div className="dropdown" id={`${id}-wrapper`}>
      <div className={classNames(['select', { focused, disabled, open }])}>
        <input
          type="checkbox"
          name="dropdown"
          id={`${id}__open-close-toggle`}
          data-navigable={!disabled}
          className="dropdown-option"
          disabled={disabled}
          onKeyUp={(e: React.KeyboardEvent) => {
            // enter button should toggle list visibility
            if (e.key === Keyboard.ENTER || e.key === Keyboard.SELECT) {
              handleToggleOpen();
              setFocused(false);
            }
          }}
          checked={open}
          onFocus={() => {
            setFocused(true);
          }}
          onBlur={() => {
            setFocused(false);
          }}
          ref={root}
          onChange={handleToggleOpen}
        />
        <span className="selected-option" id={`${id}__selected-option`}>
          {selected ?? 'Select an option'}
        </span>

        <div className={classNames(['dropdown-container', { open }])}>
          {options.map((el, i) => {
            return (
              <button
                key={el.value}
                className={classNames([
                  el.value === selected ? 'selected dropdown-option' : 'dropdown-option',
                  { isOther: el.value === 'Other...' },
                ])}
                id={`${id}__option-${i}`}
                data-navigable={open}
                onClick={(e) => onClickSetSelected(e, el)}
                onKeyUp={(e) => {
                  // blur on ESC key
                  if (e.key === Keyboard.ESC) {
                    setOpen(false);
                    root.current?.focus();
                  }

                  // select item, close dropdown.
                  if (e.key === Keyboard.ENTER || e.key === Keyboard.SELECT) {
                    e.stopPropagation();
                    handleSelect(el.value);
                    root.current?.focus();
                  }
                }}
              >
                <OptionComponent name={el.value} signal={el.signal} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function OptionComponent({ name, signal }: { name: string; signal?: number }): ReactElement {
  return (
    <span style={{ display: 'flex', justifyContent: 'space-between' }}>
      {name}
      {signal ? <WifiIcon strength={signal} width={20} height={20} theme="dark" /> : null}
    </span>
  );
}
