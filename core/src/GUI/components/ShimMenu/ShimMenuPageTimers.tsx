import React, { useCallback, useState } from 'react';
import Checkbox from '../Checkbox';
import TimeInput from '../TimeInputField';
import ShimMenuHeader from './ShimMenuHeader';
import Button from '../Button';
import Modal from '../Modal';
import classNames from 'classnames';
import timerIcon from '../../assets/icons/clock-icon.svg';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@core/createStore';
import { setEnableOnOffTimers, setOnOffTimers } from '@core/appState/appSetting';
import { getTimerDaysString, Logger, Time, timerUUID } from '@core/Util';
import { TimerType, UIColor } from '@core/constants';
import { format } from 'date-fns';
import { RadioButton, RadioGroup } from '../Radio';
import { ObjectKeys, ObjectValues } from '@core/Util/Object';

export default function ShimMenuTimers() {
  const [timerModalActive, setTimerModalActive] = useState(false);
  const dispatch = useDispatch();
  const { timersEnabled, onOffTimers } = useSelector((state: RootState) => {
    return {
      timersEnabled: state.appSettings.enableOnOffTimers,
      onOffTimers: state.appSettings.onOffTimers ?? [],
    };
  });
  // Modal vars
  const [selectedDays, setSelectedDays] = useState(defaultDays);
  const [onTime, setOnTime] = useState('');
  const [offTime, setOffTime] = useState('');
  const [userEnteredOnTime, setUserEnteredOnTime] = useState('');
  const [userEnteredOffTime, setUserEnteredOffTime] = useState('');
  const [timerType, setTimerType] = useState<TimerType>(TimerType.Custom);

  const resetModalValues = useCallback(() => {
    setSelectedDays(defaultDays);
    setTimerModalActive(false);
    setOnTime('');
    setOffTime('');
    setUserEnteredOnTime('');
    setUserEnteredOffTime('');
    setTimerType(TimerType.Custom);
  }, []);

  const onRemoveTimer = useCallback(
    (timer: onAndOffTimerSetting) => {
      const newTimerUUID = timerUUID(timer);
      // find matching pattern from uuid
      const index = onOffTimers.findIndex((t) => t.timerUUID === newTimerUUID);
      // copy array
      const newTimersArray = [...onOffTimers];
      // delete element at index
      newTimersArray.splice(index, 1);
      // set new array
      dispatch(setOnOffTimers({ value: newTimersArray }));
    },
    [dispatch, onOffTimers]
  );

  const onAddTimer = useCallback(() => {
    const timer: onAndOffTimerSetting = {
      days: ObjectKeys(selectedDays).filter((key) => selectedDays[key]) as Days[],
      onTime,
      offTime,
    };

    timer.timerUUID = timerUUID(timer);

    if (onOffTimers.some((t) => t.timerUUID === timer.timerUUID)) {
      // duplicate timer. TODO: display error.
      Logger.error('Timer with these values already exists');
    } else {
      dispatch(setOnOffTimers({ value: [...onOffTimers, timer] }));
      resetModalValues();
    }
  }, [selectedDays, onTime, offTime, onOffTimers, dispatch, resetModalValues]);

  return (
    <>
      <ShimMenuHeader isChildPage={true} childPageTitle="Timers" />
      <section className="shim-menu-timers menu-container">
        <Checkbox
          name="Enable on/off timers"
          id="shim-timers-checkbox"
          checked={timersEnabled}
          onChange={() => {
            dispatch(setEnableOnOffTimers({ value: !timersEnabled }));
          }}
        />

        {onOffTimers.length ? (
          <table className={classNames(['timer-table', { disabled: !timersEnabled }])}>
            <thead>
              <tr>
                <th>Days</th>
                <th>Display on During</th>
                <th>
                  <Button
                    id="timers__create-new-timer-button"
                    color={UIColor.Purple}
                    disabled={!timersEnabled}
                    onClick={() => {
                      setTimerModalActive(true);
                    }}
                  >
                    Add
                  </Button>
                </th>
              </tr>
            </thead>

            <tbody>
              {onOffTimers?.map((timer) => (
                <tr key={timer.timerUUID}>
                  <td>{getTimerDaysString(timer.days)}</td>
                  <td>
                    {format(new Time(timer.onTime).asDate()!, 'hh:mm a')} {' - '}
                    {format(new Time(timer.offTime).asDate()!, 'hh:mm a')}
                  </td>
                  <td>
                    <Button
                      id=""
                      className="remove-timer-button"
                      color={UIColor.Grey_med}
                      disabled={!timersEnabled}
                      onClick={() => {
                        onRemoveTimer(timer);
                      }}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="center">
            <img src={timerIcon} className={classNames(['timer-icon', { disabled: !timersEnabled }])} />
            <Button
              color={UIColor.Purple}
              id="add-timers-button"
              disabled={!timersEnabled}
              onClick={() => {
                setTimerModalActive(true);
              }}
            >
              Add Timer
            </Button>
          </p>
        )}
      </section>

      <Modal active={timerModalActive} id="timers">
        <div className="wrapper" style={{ textAlign: 'center', padding: '1rem' }}>
          <h4>Add Timer</h4>

          <div className="timer-type">
            <span className="type-label">Type:</span>
            <RadioGroup htmlFor="timer-type">
              <RadioButton
                value="custom"
                name="timer-type"
                label="Custom"
                checked={timerType === TimerType.Custom}
                onChange={() => {
                  setTimerType(TimerType.Custom);
                  setSelectedDays(defaultDays);
                }}
              ></RadioButton>
              <RadioButton
                value="daily"
                name="timer-type"
                label="Daily"
                checked={timerType === TimerType.Daily}
                onChange={() => {
                  setTimerType(TimerType.Daily);
                  setSelectedDays({
                    SUNDAY: true,
                    MONDAY: true,
                    TUESDAY: true,
                    WEDNESDAY: true,
                    THURSDAY: true,
                    FRIDAY: true,
                    SATURDAY: true,
                  });
                }}
              ></RadioButton>
            </RadioGroup>
          </div>

          {timerType === TimerType.Custom ? (
            <div className="weekdays">
              <span className="weekday-label">Days:</span>
              <div>
                <button
                  data-navigable={true}
                  className={classNames({ selected: selectedDays.SUNDAY })}
                  id={'Su'}
                  onClick={() => {
                    setSelectedDays({
                      ...selectedDays,
                      ...{ SUNDAY: !selectedDays.SUNDAY },
                    });
                  }}
                >
                  Su
                </button>
                <button
                  data-navigable={true}
                  className={classNames({ selected: selectedDays.MONDAY })}
                  id={'Mo'}
                  onClick={() => {
                    setSelectedDays({
                      ...selectedDays,
                      ...{ MONDAY: !selectedDays.MONDAY },
                    });
                  }}
                >
                  Mo
                </button>
                <button
                  data-navigable={true}
                  className={classNames({ selected: selectedDays.TUESDAY })}
                  id={'Tu'}
                  onClick={() => {
                    setSelectedDays({
                      ...selectedDays,
                      ...{ TUESDAY: !selectedDays.TUESDAY },
                    });
                  }}
                >
                  Tu
                </button>
                <button
                  data-navigable={true}
                  className={classNames({ selected: selectedDays.WEDNESDAY })}
                  id={'We'}
                  onClick={() => {
                    setSelectedDays({
                      ...selectedDays,
                      ...{ WEDNESDAY: !selectedDays.WEDNESDAY },
                    });
                  }}
                >
                  We
                </button>
                <button
                  data-navigable={true}
                  className={classNames({ selected: selectedDays.THURSDAY })}
                  id={'Th'}
                  onClick={() => {
                    setSelectedDays({
                      ...selectedDays,
                      ...{ THURSDAY: !selectedDays.THURSDAY },
                    });
                  }}
                >
                  Th
                </button>
                <button
                  data-navigable={true}
                  className={classNames({ selected: selectedDays.FRIDAY })}
                  id={'Fr'}
                  onClick={() => {
                    setSelectedDays({
                      ...selectedDays,
                      ...{ FRIDAY: !selectedDays.FRIDAY },
                    });
                  }}
                >
                  Fr
                </button>
                <button
                  data-navigable={true}
                  className={classNames({ selected: selectedDays.SATURDAY })}
                  id={'Sa'}
                  onClick={() => {
                    setSelectedDays({
                      ...selectedDays,
                      ...{ SATURDAY: !selectedDays.SATURDAY },
                    });
                  }}
                >
                  Sa
                </button>
              </div>
            </div>
          ) : null}

          <TimeInput
            name="Turn power on at:"
            id="add-new-timer__on-time"
            time={userEnteredOnTime}
            onChange={(isValid, newTime) => {
              setUserEnteredOnTime(newTime);
              if (isValid || newTime === '') {
                setOnTime(newTime);
              } else if (!isValid) {
                setOnTime('');
              }
            }}
          />
          <TimeInput
            id="add-new-timer__off-time"
            name="Turn power off at: "
            time={userEnteredOffTime}
            onChange={(isValid, newTime) => {
              setUserEnteredOffTime(newTime);
              if (isValid || newTime === '') {
                setOffTime(newTime);
              } else if (!isValid) {
                setOffTime('');
              }
            }}
          />

          <div className="buttons" style={{ textAlign: 'center' }}>
            <Button id="add-new-timer__cancel-button" color={UIColor.Grey_med} onClick={resetModalValues}>
              Cancel
            </Button>
            <Button
              id="add-new-timer__create-button"
              color={UIColor.Purple}
              disabled={!(ObjectValues(selectedDays).includes(true) && !!onTime && !!offTime)}
              onClick={onAddTimer}
            >
              Add
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export interface BooleanWeekday {
  [key: string]: boolean;
}
export const defaultDays: BooleanWeekday = {
  SUNDAY: false,
  MONDAY: false,
  TUESDAY: false,
  WEDNESDAY: false,
  THURSDAY: false,
  FRIDAY: false,
  SATURDAY: false,
};
