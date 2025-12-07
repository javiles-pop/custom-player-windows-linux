import 'jest';
import { setTimersUUID } from '../initialState';

describe('Test initial states model code', () => {
  it('timers with out UUID should have one initialized', () => {
    const onOffTimers: onAndOffTimerSetting[] = [
      {
        days: ['SUNDAY', 'MONDAY', 'FRIDAY', 'SATURDAY'] as Days[],
        offTime: '09:00:00',
        onTime: '18:00:00',
      },
      {
        days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'] as Days[],
        offTime: '08:20:00',
        onTime: '16:10:00',
      },
    ];
    const resultTimers: onAndOffTimerSetting[] = [
      {
        days: ['SUNDAY', 'MONDAY', 'FRIDAY', 'SATURDAY'] as Days[],
        offTime: '09:00:00',
        onTime: '18:00:00',
        timerUUID: 'sumofrsa180000090000',
      },
      {
        days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'] as Days[],
        offTime: '08:20:00',
        onTime: '16:10:00',
        timerUUID: 'mowefr161000082000',
      },
    ];
    expect(setTimersUUID(onOffTimers)).toEqual(resultTimers);
  });

  it('timers with UUID should simply break out', () => {
    const onOffTimers: onAndOffTimerSetting[] = [
      {
        days: ['SUNDAY', 'MONDAY', 'FRIDAY', 'SATURDAY'] as Days[],
        offTime: '09:00:00',
        onTime: '18:00:00',
      },
      {
        days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'] as Days[],
        offTime: '08:20:00',
        onTime: '16:10:00',
      },
    ];
    const resultTimers: onAndOffTimerSetting[] = [
      {
        days: ['SUNDAY', 'MONDAY', 'FRIDAY', 'SATURDAY'] as Days[],
        offTime: '09:00:00',
        onTime: '18:00:00',
        timerUUID: 'sumofrsa180000090000',
      },
      {
        days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'] as Days[],
        offTime: '08:20:00',
        onTime: '16:10:00',
        timerUUID: 'mowefr161000082000',
      },
    ];
    expect(setTimersUUID(onOffTimers)).toEqual(resultTimers);
  });

  it('testing empty timers', () => {
    const onOffTimers: onAndOffTimerSetting[] = [];
    expect(setTimersUUID(onOffTimers)).toEqual([]);
  });
});
