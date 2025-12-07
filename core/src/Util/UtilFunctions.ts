import { DiskKeys } from '@core/constants';
import { ObjectEntries, ObjectKeys } from './Object';

export const saveObjectToDisk = (object: AWSSettings | ProvisionedDevicePayload, settingsKey: string) => {
  for (const [key, value] of ObjectEntries(object)) {
    window.DeviceAPI?.setSetting(`${settingsKey}.${key.toLowerCase()}`, value);
  }
};

export const getAWSSettingsFromDisk = (): AWSSettings => {
  const settingsKey = DiskKeys.AWSSettings;
  return {
    region: (window.DeviceAPI.getSetting(`${settingsKey}.region`) as string) ?? '',
    cognitoClientId: (window.DeviceAPI.getSetting(`${settingsKey}.cognitoclientid`) as string) ?? '',
    cognitoFedPoolId: (window.DeviceAPI.getSetting(`${settingsKey}.cognitofedpoolid`) as string) ?? '',
    cognitoUserPoolId: (window.DeviceAPI.getSetting(`${settingsKey}.cognitouserpoolid`) as string) ?? '',
    endpointAddress: (window.DeviceAPI.getSetting(`${settingsKey}.endpointaddress`) as string) ?? '',
    Logins: JSON.parse((window.DeviceAPI.getSetting(`${settingsKey}.logins`) as string) ?? '{}') as Record<
      string,
      string | null
    >,
  };
};

export const getDeviceProvisioningFromDisk = (): ProvisionedDevicePayload => {
  const settingsKey = DiskKeys.ProvisionedDevicePayload;
  return {
    deviceId: (window.DeviceAPI.getSetting(`${settingsKey}.deviceid`) as string) ?? '',
    companyId: (window.DeviceAPI.getSetting(`${settingsKey}.companyid`) as string) ?? '',
    key: (window.DeviceAPI.getSetting(`${settingsKey}.key`) as string) ?? '',
    cognitoUserPoolId: (window.DeviceAPI.getSetting(`${settingsKey}.cognitouserpoolid`) as string) ?? '',
    cognitoClientId: (window.DeviceAPI.getSetting(`${settingsKey}.cognitoclientid`) as string) ?? '',
    error: (window.DeviceAPI.getSetting(`${settingsKey}.error`) as string) ?? '',
  };
};

export const isEmpty = (value: any) => {
  return (
    value == null || // From standard.js: Always use === - but obj == null is allowed to check null || undefined
    (typeof value === 'object' && ObjectKeys(value as Record<string, unknown>).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0)
  );
};

export const capitalize = (str?: string): string => {
  return (
    str?.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }) ?? ''
  );
};

export function mapRelativeValue(min: number, max: number, value: number, min2: number, max2: number) {
  return Math.ceil(((value - min) * (max2 - min2)) / (max - min) + min2);
}
