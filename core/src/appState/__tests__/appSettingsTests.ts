import 'jest';
import {
  setAccessCode,
  setActivated,
  setAwsSettings,
  setBacklightMode,
  setCurrentURL,
  setCompanyID,
  setDeviceID,
  setDeviceName,
  setFirmwareUpdateURL,
  setLanguage,
  setLinkAuthRequired,
  setLogLevel,
  setScheduledTasks,
  AppSettingReducer,
  setSoftwareUpdateURL,
  setToken,
  setWebPlayerURL,
  setCheckForSoftwareUpdate,
  setCheckForSoftwareUpdateTime,
  setWantReboot,
  setRebootTime,
  setCheckForFirmwareUpdate,
  setCheckForFirmwareUpdateTime,
  setEnableOnOffTimers,
  setCECEnabled,
  setOnOffTimers,
  setTimeZone,
  setTimeServer,
  resetAppSettings,
} from '../appSetting';
import { appSettingsInitialState } from '../initialState';
import { BacklightMode, LogLevel } from '@core/constants';

const state = appSettingsInitialState;
const currentURL = 'https://tst-cm.fwitest.net/cpweb1/?sign=particle&client=qacloudtest1';
const accessCode = '1234';
const awsSettings: AWSSettings = {
  cognitoClientId: '1p76t3patest',
  cognitoFedPoolId: 'us-west-2:ce7432a5-test',
  cognitoUserPoolId: 'us-west-2_test',
  endpointAddress: 'test.iot.us-west-2.amazonaws.com',
};
const companyID = 'fourwindsinteractive.com';
const deviceID = 'CJTESTDEVICE012';
const deviceName = 'BrightSign TEST';
const firmUpdateURL = 'https://www.brightsign.biz/downloads/xt4-series';
const language = 'English';
const logLevel = LogLevel.TRACE;
const scheduledTask: ScheduledTask[] = [
  {
    id: 1,
    executionTime: new Date(),
    name: 'Test',
    action: 'updateFirmware',
  },
];
const softwareUpdateURL = 'https://www.brightsign.biz/downloads/xt4-series/update/2.0';
const token = 'yRQYnWzskCZUxTestvtReqWkiUzKELZ49eM7oWxAQK_ZXw';
const baseUrl = 'cloudtest1.fwi.com/channels';
const checkForSoftwareUpdate = true;
const checkForSoftwareUpdateTime = '08:00:00';
const wantReboot = true;
const rebootTime = '14:00:00';
const checkForHardwareUpdate = true;
const checkForHardwareUpdateTime = '16:00:00';
const enableOnOffTimers = false;
const CECEnabled = true;
const onOffTimers: onAndOffTimerSetting = {
  days: ['SUNDAY', 'MONDAY', 'FRIDAY', 'SATURDAY'] as Days[],
  offTime: '09:00:00',
  onTime: '18:00:00',
  timerUUID: 'sumofrsa090000180000',
};
const timeZone = 'Mountain Time';
const timeServer = 'Bright sign BNS server';
describe('deployment actions', () => {
  it('should create deployment action and update state', () => {
    const updateUrl: updateStateWithString = { value: currentURL };
    const action = setCurrentURL(updateUrl);
    const expected = {
      type: 'appSettings/setCurrentURL',
      payload: { value: currentURL },
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.currentURL).toEqual(currentURL);
  });

  it('should create access code action and update state', () => {
    const code: updateStateWithString = { value: accessCode };
    const action = setAccessCode(code);
    const expected = {
      type: 'appSettings/setAccessCode',
      payload: { value: accessCode },
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.accessCode).toEqual(accessCode);
  });

  it('should create activated action and update state', () => {
    const action = setActivated(true);
    const expected = {
      type: 'appSettings/setActivated',
      payload: true,
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.activated).toEqual(true);
  });

  it('should create AWSSettings action and update state', () => {
    const action = setAwsSettings(awsSettings);
    const expected = {
      type: 'appSettings/setAwsSettings',
      payload: awsSettings,
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.AWSSettings).toEqual(awsSettings);
  });

  it('should create backlightMode action and update state', () => {
    const action = setBacklightMode(BacklightMode.HDMISignal);
    const expected = {
      type: 'appSettings/setBacklightMode',
      payload: BacklightMode.HDMISignal,
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.backlightMode).toEqual(BacklightMode.HDMISignal);
  });

  it('should create companyID action and update state', () => {
    const action = setCompanyID(companyID);
    const expected = {
      type: 'appSettings/setCompanyID',
      payload: companyID,
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.companyID).toEqual(companyID);
  });

  it('should create deviceID action and update state', () => {
    const action = setDeviceID(deviceID);
    const expected = {
      type: 'appSettings/setDeviceID',
      payload: deviceID,
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.deviceID).toEqual(deviceID);
  });

  it('should create deviceName action and update state', () => {
    const action = setDeviceName(deviceName);
    const expected = {
      type: 'appSettings/setDeviceName',
      payload: deviceName,
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.deviceName).toEqual(deviceName);
  });

  it('should create deviceName action and update state', () => {
    const action = setFirmwareUpdateURL({ value: firmUpdateURL });
    const expected = {
      type: 'appSettings/setFirmwareUpdateURL',
      payload: { value: firmUpdateURL },
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.firmwareUpdateURL).toEqual(firmUpdateURL);
  });

  it('should create language action and update state', () => {
    const action = setLanguage(language);
    const expected = {
      type: 'appSettings/setLanguage',
      payload: language,
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.language).toEqual(language);
  });

  it('should create linkAuthRequired action and update state', () => {
    const action = setLinkAuthRequired(true);
    const expected = {
      type: 'appSettings/setLinkAuthRequired',
      payload: true,
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.linkAuthRequired).toEqual(true);
  });

  it('should create log level action and update state', () => {
    const action = setLogLevel({ value: logLevel });
    const expected = {
      type: 'appSettings/setLogLevel',
      payload: { value: logLevel },
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.logLevel).toEqual(logLevel);
  });

  it('should create ScheduledTasks action and update state', () => {
    const action = setScheduledTasks(scheduledTask);
    const expected = {
      type: 'appSettings/setScheduledTasks',
      payload: scheduledTask,
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.scheduledTasks).toEqual(scheduledTask);
  });

  it('should create softwareUpdateURL action and update state', () => {
    const action = setSoftwareUpdateURL({ value: softwareUpdateURL });
    const expected = {
      type: 'appSettings/setSoftwareUpdateURL',
      payload: { value: softwareUpdateURL },
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.softwareUpdateURL).toEqual(softwareUpdateURL);
  });

  it('should create token action and update state', () => {
    const action = setToken(token);
    const expected = {
      type: 'appSettings/setToken',
      payload: token,
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.token).toEqual(token);
  });

  it('should create webPlayerBaseURL action and update state', () => {
    const action = setWebPlayerURL({ value: baseUrl });
    const expected = {
      type: 'appSettings/setWebPlayerURL',
      payload: { value: baseUrl },
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.webPlayerBaseURL).toEqual(baseUrl);
  });

  it('should create setCheckForSoftwareUpdate action and update state', () => {
    const action = setCheckForSoftwareUpdate({ value: true });
    const expected = {
      type: 'appSettings/setCheckForSoftwareUpdate',
      payload: { value: checkForSoftwareUpdate },
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.checkForSoftwareUpdate).toEqual(checkForSoftwareUpdate);
  });

  it('should create setCheckForSoftwareUpdateTime action and update state', () => {
    const action = setCheckForSoftwareUpdateTime({
      value: checkForSoftwareUpdateTime,
    });
    const expected = {
      type: 'appSettings/setCheckForSoftwareUpdateTime',
      payload: { value: checkForSoftwareUpdateTime },
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.checkForSoftwareUpdateTime).toEqual(checkForSoftwareUpdateTime);
  });

  it('should create setWantReboot action and update state', () => {
    const action = setWantReboot({ value: wantReboot });
    const expected = {
      type: 'appSettings/setWantReboot',
      payload: { value: wantReboot },
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.wantReboot).toEqual(wantReboot);
  });

  it('should create setRebootTime action and update state', () => {
    const action = setRebootTime({ value: rebootTime });
    const expected = {
      type: 'appSettings/setRebootTime',
      payload: { value: rebootTime },
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.rebootTime).toEqual(rebootTime);
  });

  it('should create setCheckForFirmwareUpdate action and update state', () => {
    const action = setCheckForFirmwareUpdate({ value: checkForHardwareUpdate });
    const expected = {
      type: 'appSettings/setCheckForFirmwareUpdate',
      payload: { value: checkForHardwareUpdate },
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.checkForHardwareUpdate).toEqual(checkForHardwareUpdate);
  });

  it('should create setCheckForFirmwareUpdateTime action and update state', () => {
    const action = setCheckForFirmwareUpdateTime({
      value: checkForHardwareUpdateTime,
    });
    const expected = {
      type: 'appSettings/setCheckForFirmwareUpdateTime',
      payload: { value: checkForHardwareUpdateTime },
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.checkForHardwareUpdateTime).toEqual(checkForHardwareUpdateTime);
  });

  it('should create setEnableOnOffTimers action and update state', () => {
    const action = setEnableOnOffTimers({ value: enableOnOffTimers });
    const expected = {
      type: 'appSettings/setEnableOnOffTimers',
      payload: { value: enableOnOffTimers },
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.enableOnOffTimers).toEqual(enableOnOffTimers);
  });

  it('should create setCECEnabled action and update state', () => {
    const action = setCECEnabled({ value: CECEnabled });
    const expected = {
      type: 'appSettings/setCECEnabled',
      payload: { value: CECEnabled },
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.CECEnabled).toEqual(CECEnabled);
  });

  it('should create setOnOffTimers action and update state', () => {
    const action = setOnOffTimers({ value: [onOffTimers] });
    const expected = {
      type: 'appSettings/setOnOffTimers',
      payload: { value: [onOffTimers] },
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.onOffTimers).toEqual([onOffTimers]);
  });

  it('should create setTimeZone action and update state', () => {
    const action = setTimeZone({ value: timeZone });
    const expected = {
      type: 'appSettings/setTimeZone',
      payload: { value: timeZone },
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.timeZone).toEqual(timeZone);
  });

  it('should create setTimeServer action and update state', () => {
    const action = setTimeServer({ value: timeServer });
    const expected = {
      type: 'appSettings/setTimeServer',
      payload: { value: timeServer },
    };
    expect(action).toEqual(expected);

    const newState = AppSettingReducer(state, action);
    expect(newState.timeServer).toEqual(timeServer);
  });

  it('should create resetAppSettings action and set state to initial state', () => {
    const action = resetAppSettings();
    const expected = {
      type: 'appSettings/resetAppSettings',
      payload: undefined,
    };
    expect(action).toEqual(expected);

    const action1 = setAwsSettings(awsSettings);
    const action2 = setActivated(true);
    const state1 = AppSettingReducer(state, action1);
    const state2 = AppSettingReducer(state1, action2);
    const newState = AppSettingReducer(state2, action);
    expect(newState).toEqual(state);
  });
});
