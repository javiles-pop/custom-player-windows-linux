import 'jest';
import {
  isValidTime,
  getTimerDaysString,
  timerUUID,
  toHumanDate,
  padZero,
  is24HrTimeAfterNoon,
  timeStringto12Hour,
  Time,
} from '../TimeUtils';

declare enum Days {
  SUNDAY = 'SUNDAY',
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
}

describe('test functions in time utils', () => {
  it('should return boolean value for valid time', () => {
    expect(isValidTime('1000')).toBe(true);
    expect(isValidTime('1800')).toBe(true);
    expect(isValidTime('2359')).toBe(true);
    expect(isValidTime('0000')).toBe(true);

    expect(isValidTime('2270')).toBe(false);
    expect(isValidTime('2400')).toBe(false);
    expect(isValidTime('2820')).toBe(false);
    expect(isValidTime('080')).toBe(false);
    expect(isValidTime('140030')).toBe(false);
  });

  it('should return timers day string', () => {
    expect(getTimerDaysString(['MONDAY', 'FRIDAY'])).toEqual('Mo, Fr');
    expect(getTimerDaysString(['SUNDAY'])).toEqual('Su');
    expect(getTimerDaysString(['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'])).toEqual(
      'Every day'
    );
  });

  it('should return timers UUID string', () => {
    const onOffTimers = {
      days: ['SUNDAY', 'MONDAY', 'FRIDAY', 'SATURDAY'] as Days[],
      offTime: '09:00:00',
      onTime: '18:00:00',
    };
    expect(timerUUID(onOffTimers)).toEqual('sumofrsa180000090000');
  });

  it('should return human date', () => {
    expect(toHumanDate(1330515905)).toEqual('2012-02-29 04:45:05');
  });

  it('should pad zero to make it a two digit number for 0 and positive numbers', () => {
    expect(padZero(9)).toEqual('09');
    expect(padZero(0)).toEqual('00');
    expect(padZero(18)).toEqual('18');
    expect(padZero(-1)).toEqual('-1');
  });

  it('should return 24 Hr TimeAfterNoon', () => {
    expect(is24HrTimeAfterNoon('18:00:00')).toBe(true);
    expect(is24HrTimeAfterNoon('14:00')).toBe(true);
    expect(is24HrTimeAfterNoon('12:00')).toBe(true);

    expect(is24HrTimeAfterNoon('11:59:00')).toBe(false);
    expect(is24HrTimeAfterNoon('00:00')).toBe(false);
  });

  it('should convert time string to 12hrs clock', () => {
    expect(timeStringto12Hour('18:28:00')).toEqual('0628');
    expect(timeStringto12Hour('23:59')).toEqual('1159');
  });

  it('should return a valid time string in HH:mm:ss', () => {
    expect(new Time('09:00:00').to24hString()).toEqual('09:00:00');
    expect(new Time('09:00').to24hString()).toEqual('09:00:00');
    expect(new Time('0900').to24hString()).toEqual('09:00:00');
    expect(new Time('0900 AM').to24hString()).toEqual('09:00:00');
    expect(new Time('0900 PM').to24hString()).toEqual('21:00:00');
  });
});
