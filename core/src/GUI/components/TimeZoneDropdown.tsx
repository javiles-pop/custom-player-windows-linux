import React, { useState, useCallback, useRef, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import classNames from 'classnames';
import { DeviceManufacturer, Keyboard, UIColor } from '@core/constants';
import { ObjectKeys } from '@core/Util/Object';

interface TimeZoneDropdownProps {
  options: Record<string, string>;
  defaultOption: string;
  onChange: (key: string) => void;
  id: string;
}

export default function TimeZoneDropdown({ options, defaultOption, onChange }: TimeZoneDropdownProps) {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState(defaultOption);
  const modalRef = useRef<HTMLDivElement>(null);

  const listKeyHandler = (e: React.KeyboardEvent<HTMLButtonElement>, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    switch (e.key) {
      case Keyboard.RIGHT:
        document.getElementById('timezone_selection_cancel')?.focus();
        break;

      case Keyboard.DOWN:
        (document.activeElement?.nextElementSibling as HTMLButtonElement)?.focus();
        break;
      case Keyboard.UP:
        (document.activeElement?.previousElementSibling as HTMLButtonElement)?.focus();
        break;

      case Keyboard.ENTER:
        setSelection(key);
        document.getElementById('timezone_selection_confirm')?.focus();
        break;

      case Keyboard.ESC:
        setOpen(false);
        break;

      default:
        break;
    }
  };

  const cancelKeyHandler = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    switch (e.key) {
      case Keyboard.DOWN:
        document.getElementById('timezone_selection_confirm')?.focus();
        break;

      case Keyboard.ENTER:
        onClickToggle();
        break;

      case Keyboard.LEFT:
        (document.querySelector('.btn__time-zone.selected') as HTMLButtonElement)?.focus();
        break;

      case Keyboard.ESC:
        setOpen(false);
        break;

      default:
        break;
    }
  };

  const confirmKeyHandler = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    switch (e.key) {
      case Keyboard.ENTER:
        onChange(selection);
        onClickToggle();
        break;

      case Keyboard.UP:
      case Keyboard.DOWN:
        document.getElementById('timezone_selection_cancel')?.focus();
        break;

      case Keyboard.LEFT:
        (document.querySelector('.btn__time-zone.selected') as HTMLButtonElement)?.focus();
        break;

      case Keyboard.ESC:
        setOpen(false);
        break;

      default:
        break;
    }
  };

  const onClickToggle = useCallback(() => {
    setOpen(!open);
  }, [open]);

  const onClickChangeSelection = useCallback(() => {
    onChange(selection);
    onClickToggle();
  }, [selection, onChange, onClickToggle]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === Keyboard.ESC) {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="timezone-dropdown">
      <label
        tabIndex={-1}
        onFocus={() => {
          document.getElementById('openTimeZoneModal')?.focus();
        }}
      >
        <span>Time Zone</span>
        <br />
        <div className="time-zone-selection">
          <span>{options[defaultOption]}</span>
          <Button color="grey_med" id="openTimeZoneModal" onClick={onClickToggle}>
            Change
          </Button>
        </div>
        {window.DeviceAPI.getManufacturer() === DeviceManufacturer.BrightSign ? (
          <p className="helper">
            If you have previously set the time zone via BrightSign Network (BSN), this time zone setting will be
            ignored.
          </p>
        ) : null}
      </label>

      <Modal id="timezone-options" active={open} ref={modalRef}>
        <section>
          <h4 className="center">Time Zone</h4>
          <div className="content">
            <div className="scroll-container">
              {ObjectKeys(options).map((key) => (
                <button
                  key={key}
                  data-navigable={open}
                  tabIndex={-1}
                  className={classNames(['btn__time-zone', { selected: selection === key }])}
                  onKeyDown={(e) => {
                    listKeyHandler(e, key);
                  }}
                  onKeyUp={(e) => {
                    e.stopPropagation();
                  }}
                  onClick={() => {
                    setSelection(key);
                    document.getElementById('timezone_selection_confirm')?.focus();
                  }}
                >
                  {options[key]}
                </button>
              ))}
            </div>

            <div className="buttons">
              <button
                className="btn"
                color="grey_dark"
                id="timezone_selection_cancel"
                disabled={!open}
                data-navigable={open}
                onClick={onClickToggle}
                onKeyDown={cancelKeyHandler}
                onKeyUp={(e) => {
                  e.stopPropagation();
                }}
              >
                Cancel
              </button>

              <button
                className="btn"
                id="timezone_selection_confirm"
                disabled={!open}
                data-navigable={open}
                onKeyUp={(e) => {
                  e.stopPropagation();
                }}
                onKeyDown={confirmKeyHandler}
                onClick={onClickChangeSelection}
                color={UIColor.Purple}
              >
                Select & Reboot
              </button>
            </div>
          </div>
        </section>
      </Modal>
    </div>
  );
}
