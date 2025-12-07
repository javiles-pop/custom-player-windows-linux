import { isValidURLFormat } from './StringValidator';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import { storeExport as store } from '@core/index';
import { DeviceOrientation } from '@core/constants';

/** Separates query string into consumable string by the "Channel" Menu Item summary */
export const transformURLtoQueryComponentString = (urlString: string): string => {
  if (isValidURLFormat(urlString)) {
    const url = new URL(urlString);
    const query = url.searchParams;
    // legacy signs:
    if (query.has('sign') && query.has('client')) {
      return `Sign: ${query.get('sign')}, Client: ${query.get('client')}`;
    }

    // cloudChannels:
    if (query.has('channel')) {
      return store.getState().fwiCloud.channelName ?? `Channel ID: ${query.get('channel')}`;
    }
  }

  return urlString;
};

export const encrypt = (value: string, key: string): string => {
  return AES.encrypt(value, key).toString();
};

export const decrypt = (value: string, key: string): string => {
  return AES.decrypt(value, key).toString(Utf8);
};

export const extractBaseURL = (fullURL?: string): string => {
  if (!fullURL) {
    return '';
  }
  try {
    const url = new URL(fullURL);
    return url.origin + url.pathname;
  } catch (error) {
    return '';
  }
};

export const insertStringatIndex = (sourceString: string, newString: string, index: number): string => {
  if (sourceString.length < index || index < 0) {
    throw new Error(`Source string: "${sourceString}" does not have an index at ${index}`);
  }
  return sourceString.split('').splice(0, index).join('') + newString + sourceString.split('').splice(index).join('');
};

export const bytesToHuman = (bytes: number) => {
  if (!bytes) {
    return '--';
  }
  const units = ['bytes', 'kB', 'MB', 'GB', 'TB'];
  let quotient = Math.floor(Math.log10(bytes) / 3);
  quotient = quotient < units.length ? quotient : units.length - 1;
  bytes /= 1024 ** quotient;

  return `${Math.floor(bytes)} ${units[quotient]}`;
};

export const extractChannelIDFromURL = (stringURL?: string) => {
  if (stringURL?.length) {
    const url = new URL(stringURL);
    return url.searchParams.get('channel');
  }
  return '';
};

export const convertStringToDisplayOrientation = (angle: string): DeviceOrientation => {
  let orientation: DeviceOrientation = DeviceOrientation.DEG_0;
  switch (angle) {
    case '90':
      orientation = DeviceOrientation.DEG_90;
      break;
    case '180':
      orientation = DeviceOrientation.DEG_180;
      break;
    case '270':
      orientation = DeviceOrientation.DEG_270;
      break;
    default:
      orientation = DeviceOrientation.DEG_0;
      break;
  }
  return orientation;
};
