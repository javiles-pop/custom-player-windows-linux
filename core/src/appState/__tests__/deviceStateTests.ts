import 'jest';
import { setDeviceOnline, resetDeviceSettings, deviceStateReducer } from '../deviceState';
import { deviceState } from '../initialState';

const state = deviceState;

describe('deployment actions', () => {
  it('should create device online action and update state', () => {
    const action = setDeviceOnline(true);
    const expected = {
      type: 'deviceState/setDeviceOnline',
      payload: true,
    };
    expect(action).toEqual(expected);

    const newState = deviceStateReducer(state, action);
    expect(newState.deviceOnline).toEqual(true);
  });

  it('should create reset action and set state to initial state', () => {
    const action = resetDeviceSettings();
    const action1 = setDeviceOnline(true);

    const expected = {
      type: 'deviceState/resetDeviceSettings',
      payload: undefined,
    };
    expect(action).toEqual(expected);

    const state1 = deviceStateReducer(state, action1);
    const newState = deviceStateReducer(state1, action);
    expect(newState).toEqual(state);
  });
});
