import 'jest';
import configureStore from 'redux-mock-store';
import { appSettingsInitialState, cloudInitialState, deviceSettings, deviceState } from '@core/appState/initialState';
import { ExecuteFunctResponse } from '@core/GUI/components/Player';
import { executeCustomRunScript, createOnAndOffTimer } from '../CPWebCommunications';

const mockStore = configureStore([]);
const initialState = {
  appSettings: appSettingsInitialState,
  fwiCloud: cloudInitialState,
  deviceSettings: deviceSettings,
  shimMenu: { shimMenuActive: false, userCanAccessMenu: false },
  deviceState: deviceState,
};

describe('test run scripts for CPWeb v5', () => {
  mockStore(initialState);
  it('should execute turn display off runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'turnOffDisplay',
      args: {
        name: 'PlayerCommandDisplayOff',
        attributes: { value: {} },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);
  });

  it('should execute turn display on runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'turnOnDisplay',
      args: {
        name: 'PlayerCommandDisplayOn',
        attributes: { value: {} },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);
  });

  it('should execute reboot now runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'rebootNow',
      args: {
        name: 'PlayerCommandReboot',
        attributes: { value: {} },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);
  });

  it('should execute restartApp runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'restartApp',
      args: {
        name: 'PlayerCommandRestartPlayer',
        attributes: { value: {} },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);
  });

  it('should set Access code or return error when code is not valid', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'setAccessCode',
      args: {
        name: 'PlayerCommandSetAccessCode',
        attributes: { value: { AccessCode: '12908' } },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);

    // Should fail if the value object does't contain AccessCode object.
    const script1: ExecuteFunctResponse = {
      funct: 'setAccessCode',
      args: {
        name: 'PlayerCommandSetAccessCode',
        attributes: { value: { undefined: '12908' } },
      },
    };
    expect(await executeCustomRunScript(script1)).toBe(false);

    // Should fail if access code is longer than 7 numbers
    const script2: ExecuteFunctResponse = {
      funct: 'setAccessCode',
      args: {
        name: 'PlayerCommandSetAccessCode',
        attributes: { value: { AccessCode: '12908909' } },
      },
    };
    expect(await executeCustomRunScript(script2)).toBe(false);

    // Should fail if access code contains invalid characters
    const script3: ExecuteFunctResponse = {
      funct: 'setAccessCode',
      args: {
        name: 'PlayerCommandSetAccessCode',
        attributes: { value: { AccessCode: '12 Ab1' } },
      },
    };
    expect(await executeCustomRunScript(script3)).toBe(false);
  });

  it('should execute remove access code runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'removeAccessCode',
      args: {
        name: 'PlayerCommandRemoveAccessCode',
        attributes: { value: {} },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);
  });

  it('should execute enable Display Timers runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'enableDisplayTimers',
      args: {
        name: 'PlayerCommandEnableDisplayTimers',
        attributes: { value: {} },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);
  });

  it('should execute disable Display Timers runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'disableDisplayTimers',
      args: {
        name: 'PlayerCommandDisableDisplayTimers',
        attributes: { value: {} },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);
  });

  it('should execute toggle Software Enable runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'toggleSoftwareEnable',
      args: {
        name: 'PlayerCommandEnableCheckForUpdate',
        attributes: { value: {} },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);

    const script1: ExecuteFunctResponse = {
      funct: 'toggleSoftwareEnable',
      args: {
        name: 'PlayerCommandDisableCheckForUpdate',
        attributes: { value: {} },
      },
    };
    expect(await executeCustomRunScript(script1)).toBe(true);
  });

  it('should execute enable Daily Reboot runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'enableDailyReboot',
      args: {
        name: 'PlayerCommandEnableDailyReboot',
        attributes: { value: { RebootTime: '18:40:00' } },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);

    // Should fail if time is invalid
    const script2: ExecuteFunctResponse = {
      funct: 'enableDailyReboot',
      args: {
        name: 'PlayerCommandEnableDailyReboot',
        attributes: { value: { RebootTime: '18:80:00' } },
      },
    };
    expect(await executeCustomRunScript(script2)).toBe(false);

    // Should fail if time is invalid
    const script3: ExecuteFunctResponse = {
      funct: 'enableDailyReboot',
      args: {
        name: 'PlayerCommandEnableDailyReboot',
        attributes: { value: { RebootTime: '18:0a:00' } },
      },
    };
    expect(await executeCustomRunScript(script3)).toBe(false);
  });

  it('should execute disable Daily Reboot runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'disableDailyReboot',
      args: {
        name: 'PlayerCommandDisableDailyReboot',
        attributes: { value: {} },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);
  });

  it('should execute enable Firmware Update Check runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'enableFirmwareUpdateCheck',
      args: {
        name: 'PlayerCommandEnableFirmwareUpdateCheck',
        attributes: { value: {} },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);
  });

  it('should execute disable Firmware Update Check runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'disableFirmwareUpdateCheck',
      args: {
        name: 'PlayerCommandDisableFirmwareUpdateCheck',
        attributes: { value: {} },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);
  });

  it('should execute update Software Url runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'updateSoftwareUrl',
      args: {
        name: 'PlayerCommandUpdateSoftwareUrl',
        attributes: {
          value: {
            Url: 'https://shims.fwi-dev.com/brightsign/development/2.0.0.134/autorun.zip',
          },
        },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);

    const script1: ExecuteFunctResponse = {
      funct: 'updateSoftwareUrl',
      args: {
        name: 'PlayerCommandUpdateSoftwareUrl',
        attributes: {
          value: { Url: 'htt://shims.fwi-dev.com/brightsign/development' },
        },
      },
    };
    expect(await executeCustomRunScript(script1)).toBe(false);
  });

  it('should execute update Firmware Url runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'updateFirmwareUrl',
      args: {
        name: 'PlayerCommandUpdateFirmwareUrl',
        attributes: {
          value: {
            Url: 'https://test-cm2.fwi-dev.com/content/bsfw/xt4/8.2.42.bsfw',
          },
        },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);

    const script1: ExecuteFunctResponse = {
      funct: 'updateSoftwareUrl',
      args: {
        name: 'PlayerCommandUpdateSoftwareUrl',
        attributes: {
          value: {
            Url: 'https:/test-cm2.fwi-dev.com/content/bsfw/xt4/8.2.42.bsfw',
          },
        },
      },
    };
    expect(await executeCustomRunScript(script1)).toBe(false);

    const script2: ExecuteFunctResponse = {
      funct: 'updateSoftwareUrl',
      args: {
        name: 'PlayerCommandConfigureDeployment',
        attributes: {
          value: {
            Url: 'ftp://tst-cm.fwitest.net/cpweb1/bsfw/xt4/8.2.42.bsfw',
          },
        },
      },
    };
    expect(await executeCustomRunScript(script2)).toBe(true);
  });

  it('should execute update Software Time runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'updateSoftwareTime',
      args: {
        name: 'PlayerCommandUpdateSoftwareTime',
        attributes: { value: { CheckTime: '00:00' } },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);

    // Should fail if time is invalid
    const script2: ExecuteFunctResponse = {
      funct: 'updateSoftwareTime',
      args: {
        name: 'PlayerCommandUpdateSoftwareTime',
        attributes: { value: { CheckTime: '24:10:00' } },
      },
    };
    expect(await executeCustomRunScript(script2)).toBe(false);

    // Should fail if time is invalid
    const script3: ExecuteFunctResponse = {
      funct: 'updateSoftwareTime',
      args: {
        name: 'PlayerCommandUpdateSoftwareTime',
        attributes: { value: { CheckTime: '18:o0' } },
      },
    };
    expect(await executeCustomRunScript(script3)).toBe(false);
  });

  it('should execute set Daily Reboot Time runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'setDailyRebootTime',
      args: {
        name: 'PlayerCommandDailyRebootTime',
        attributes: { value: { CheckTime: '24:00' } },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);
  });

  it('should execute update Firmware Time runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'updateFirmwareTime',
      args: {
        name: 'PlayerCommandUpdateFirmwareTime',
        attributes: { value: { CheckTime: '12:00' } },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);

    // Should fail if time is invalid
    const script2: ExecuteFunctResponse = {
      funct: 'updateSoftwareTime',
      args: {
        name: 'PlayerCommandUpdateFirmwareTime',
        attributes: { value: { CheckTime: '23;00' } },
      },
    };
    expect(await executeCustomRunScript(script2)).toBe(false);
  });

  it('should execute configure Deployment runscript', async () => {
    const script1: ExecuteFunctResponse = {
      funct: 'updateSoftwareUrl',
      args: {
        name: 'PlayerCommandConfigureDeployment',
        attributes: {
          value: {
            Url: 'fttp://tst-cm.fwitest.net/cpweb1/?sign=broken403&client=toddfwis3',
          },
        },
      },
    };
    expect(await executeCustomRunScript(script1)).toBe(false);
  });

  it('should execute delete All Display Timers runscript', async () => {
    const script1: ExecuteFunctResponse = {
      funct: 'deleteAllDisplayTimers',
      args: {
        name: 'PlayerCommandDeleteAllDisplayTimers',
        attributes: { value: {} },
      },
    };
    expect(await executeCustomRunScript(script1)).toBe(true);
  });

  it('should execute checkSoftwareNow runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'checkSoftwareNow',
      args: {
        name: 'PlayerCommandCheckSoftwareNow',
        attributes: { value: {} },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);
  });

  it('should execute setDisplayOrientation runscript', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'setDisplayOrientation',
      args: {
        name: 'PlayerCommandSetDisplayOrientation',
        attributes: { value: { RotationAngle: '90' } },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(true);

    // Should fail if angle isn't present
    const script1: ExecuteFunctResponse = {
      funct: 'setDisplayOrientation',
      args: {
        name: 'PlayerCommandSetDisplayOrientation',
        attributes: { value: { Rotation: '90' } },
      },
    };
    expect(await executeCustomRunScript(script1)).toBe(false);
  });

  it('should return failure if run script isnt supported', async () => {
    const script: ExecuteFunctResponse = {
      funct: 'uploadScreenshot',
      args: {
        name: 'PlayerCommandUploadScreenshot',
        attributes: { value: {} },
      },
    };
    expect(await executeCustomRunScript(script)).toBe(false);
  });

  it('verify createOnAndOffTimer from runscript', async () => {
    const script1: ExecuteFunctResponse = {
      funct: 'addDisplayTimer',
      args: {
        name: 'PlayerCommandAddDisplayTimer',
        attributes: {
          value: { Days: 'Mo Fr Sa', TimeOn: '09:00', TimeOff: '18:00' },
        },
      },
    };

    const expectedValue: onAndOffTimerSetting = {
      days: ['MONDAY', 'FRIDAY', 'SATURDAY'],
      offTime: '18:00:00',
      onTime: '09:00:00',
    };
    expect(createOnAndOffTimer(script1)).toEqual(expectedValue);

    const script: ExecuteFunctResponse = {
      funct: 'addDisplayTimer',
      args: {
        name: 'PlayerCommandAddDisplayTimer',
        attributes: {
          value: { Days: 'tu we su', TimeOn: '07:50', TimeOff: '19:30' },
        },
      },
    };

    const expectedValue1: onAndOffTimerSetting = {
      days: ['SUNDAY', 'TUESDAY', 'WEDNESDAY'],
      offTime: '19:30:00',
      onTime: '07:50:00',
    };
    expect(createOnAndOffTimer(script)).toEqual(expectedValue1);
  });
});
