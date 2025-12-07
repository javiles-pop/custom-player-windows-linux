import { ObjectKeys } from './Object';

interface OldOnOffTimer {
  on: OldOnOffTime;
  off: OldOnOffTime;
  week: number;
}
interface OldOnOffTime {
  hour: number;
  minute: number;
  week: number;
  dayStr: string;
}

interface onAndOffTimerSetting {
  days: Weekday[];
  offTime: string;
  onTime: string;
}

// values with null are no longer applicable in 2.0
// commented lines are a the same in 1.x and 2.0
const v1tov2DeltaMap: any = {
  // 'access_code'
  accesstoken: 'token',
  adv_enabled: null,
  // aws_settings: '',
  // bsn_proxy_enabled: '',
  // cached_url: '',
  // cec_enabled: '',
  deploy_id: null,
  // devicename: '',
  firmware_updates_enabled: 'check_for_firmware_update',
  firmware_updates_time: 'check_for_firmware_update_time',
  firmware_url: 'firmware_update_url',
  'fwi.device.activated': 'activated',
  'fwi.device.buildversion': null,
  'fwi.device.fmversion': null,
  'fwi.device.id': 'device_id',
  'fwi.device.key': 'provisioned_device.key',
  'fwi.device.tenant': 'companyID',
  'fwi.iot.clientid': 'aws_settings.cognitoclientid',
  'fwi.iot.host': 'aws_settings.endpointaddress',
  'fwi.iot.identitypoolid': 'aws_settings.cognitofedpoolid',
  'fwi.iot.region': 'aws_settings.region',
  'fwi.iot.userpoolid': 'aws_settings.cognitouserpoolid',
  'fwi.log.level': null,
  ip_host: null,
  islinkpublic: 'linkauthrequired',
  link: 'current_url',
  loglevel: 'log_level',
  mac: null,
  mac_host: null,
  'network-retry-attempts': null,
  on_off_timers: 'on_off_timers',
  on_off_timers_enabled: 'enable_on_off_timers',
  player_name: null,
  // proxy_auth_string: '',
  // proxy_bypass_list: '',
  // proxy_enabled: '',
  // proxy_host: '',
  // proxy_pass: '',
  // proxy_port: '',
  // proxy_user: '',
  reboot_enabled: 'want_reboot',
  // reboot_time: '',
  serial: null,
  software_updates_enable: 'check_for_software_update',
  software_updates_time: 'check_for_software_update_time',
  software_url: 'software_update_url',
  static_ip_enable: null,
  // time_zone: '',
  webplayerbaseurl: 'web_player_url',
};

export const runMigrationAssistant = (settings: any): any => {
  try {
    console.log('Beginning Migration Assistant...');

    let newSettings: any = {};
    const oldSettings: Record<string, any> = settings;

    // Convert the oldsettings keys to lower case
    ObjectKeys(oldSettings).forEach((key) => {
      const k = key.toLowerCase();

      if (k !== key) {
        oldSettings[k] = oldSettings[key];
        delete oldSettings[key];
      }
    });

    // loop over each old key and construct on object in the new data structure using the map above
    for (const key in oldSettings) {
      if (key in v1tov2DeltaMap) {
        let oldValue: unknown = oldSettings[key];
        if (key === 'on_off_timers') {
          // convert old data structure to the new one
          const newTimers = migrateOnOffTimers(oldValue as OldOnOffTimer[]);
          oldValue = JSON.stringify(newTimers);
        } else if (key.match(/[a-z_]+_time$/gi)) {
          oldValue = migrateTimeValue(String(oldValue));
        } else {
          console.log(`mapping ${key} -> ${v1tov2DeltaMap[key]} with value: `, oldValue);
        }
        newSettings[v1tov2DeltaMap[key]] = oldValue;
      }
    }

    // migrate some new data structures from old values.
    newSettings = { ...newSettings, ...migrateProvisionedDevice(oldSettings) };
    return newSettings;
  } catch (error) {
    console.error('Migration Assistant Failed.', error);
    console.error(error.stack());
  }
};

const migrateProvisionedDevice = (oldSettings: any) => {
  const provisionedDevice = {
    'provisioned_device.deviceid': oldSettings['fwi.device.id'],
    'provisioned_device.companyid': oldSettings['fwi.device.tenant'],
    'provisioned_device.key': oldSettings['fwi.device.key'],
    'provisioned_device.cognitouserpoolid': oldSettings['fwi.iot.userpoolid'],
    'provisioned_device.cognitoclientid': oldSettings['fwi.iot.clientid'],
  };
  return provisionedDevice;
};

const migrateOnOffTimers = (timers: OldOnOffTimer[] | string): onAndOffTimerSetting[] => {
  console.log('mapping on/off timers to new data structure');
  if (typeof timers === 'string') {
    timers = JSON.parse(timers) as OldOnOffTimer[];
  }
  const newTimers = timers.map((timer) => {
    const onTime = `${pad(timer.on.hour)}:${pad(timer.on.minute)}:00`;
    const offTime = `${pad(timer.off.hour)}:${pad(timer.off.minute)}:00`;
    const days = getWeekdayArrayFromBitwiseValues(timer.week);

    return {
      onTime,
      offTime,
      days,
    } as onAndOffTimerSetting;
  });
  console.log(newTimers);
  return newTimers;
};

const getWeekdayArrayFromBitwiseValues = (bitwise: number): Weekday[] => {
  let days: Weekday[] = [];

  if (bitwise >= 127) {
    days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    bitwise -= 127;
  }

  if (bitwise >= 64) {
    days.push('SUNDAY');
    bitwise -= 64;
  }

  if (bitwise >= 32) {
    days.push('SATURDAY');
    bitwise -= 32;
  }

  if (bitwise >= 16) {
    days.push('FRIDAY');
    bitwise -= 16;
  }

  if (bitwise >= 8) {
    days.push('THURSDAY');
    bitwise -= 8;
  }

  if (bitwise >= 4) {
    days.push('WEDNESDAY');
    bitwise -= 4;
  }

  if (bitwise >= 2) {
    days.push('TUESDAY');
    bitwise -= 2;
  }

  if (bitwise >= 1) {
    days.push('MONDAY');
    bitwise -= 1;
  }
  return days;
};

const pad = (num: string | number) => (Number(num) < 10 ? `0${num}` : num);

const migrateTimeValue = (time: string) => {
  try {
    const d = new Date(`1/1/2020 ${time}`);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  } catch (error) {
    console.error('Failed to construct a date object from time string during migration: ', time);
  }
};
