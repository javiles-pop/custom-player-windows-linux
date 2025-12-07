import React, { useEffect, useState, useCallback } from 'react';
import { LogLevel } from '../../constants';
import classNames from 'classnames';
import { capitalize } from '@core/Util';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@core/createStore';
import { setLogLevel } from '@core/appState/appSetting';

export interface LogLevelProps {
  level: LogLevel;
  icon: string;
  first?: boolean;
  last?: boolean;
  id: string;
}

export default function UILogLevel({ level, icon, first, last, id }: LogLevelProps) {
  const dispatch = useDispatch();
  const logLevel = useSelector((state: RootState) => state.appSettings.logLevel);
  const [value, setValue] = useState(window.DeviceAPI?.Logger[level].value);
  const [selected, setSelected] = useState(window.DeviceAPI?.Logger.getLevel().value === value);
  const [included, setIncluded] = useState(window.DeviceAPI?.Logger.getLevel().value < value);

  useEffect(() => {
    setValue(window.DeviceAPI?.Logger[level].value);
    setSelected(window.DeviceAPI?.Logger.getLevel().value === value);
    setIncluded(window.DeviceAPI?.Logger.getLevel().value < value);
  }, [level, logLevel, value]);

  const onClickHandler = useCallback(() => {
    dispatch(setLogLevel({ value: level as LogLevel }));
  }, [dispatch, level]);

  return (
    <div className="log-level" id={id}>
      <button data-navigable={true} onClick={onClickHandler}>
        <img src={icon} alt={level.toString()} className={classNames({ disabled: !included && !selected })} />
        <span
          className={classNames(['name', `${level.toString().toLowerCase()}-text`], {
            disabled: !included && !selected,
          })}
        >
          {capitalize(level.toString())}
        </span>
        <div className={classNames(['indicator-wrapper', { isFirst: first, isLast: last, selected, included }])}>
          <div className="indicator"></div>
        </div>
      </button>
    </div>
  );
}
