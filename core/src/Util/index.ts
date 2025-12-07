import { isValidURLFormat } from './StringValidator';
import { DiskKeys } from '@core/constants';
import Logger from 'js-logger';
import { storeExport as store } from '@core/index';
import { ObjectEntries } from './Object';

export * from './Logger';
export * from './GlobalEventListeners';
export * from './Scheduler';
export * from './StringValidator';
export * from './Converter';
export * from './DeviceAPI';
export * from './TimeUtils';
export * from './UtilFunctions';
export * from './ContentCaching';

// conditions under which the user is allowed to exit the shim menu.
export const userCanExitMenu = (): boolean => {
  const { currentURL } = store.getState().appSettings;
  return isValidURLFormat(currentURL);
};

// determines if some element or any of its ancestors has a given class attribute.
export const hasParentWithId = (node: Node, parentId: string): boolean => {
  const element = node as HTMLElement;
  if (element.id === parentId) {
    return true;
  }
  return !!(node.parentNode && hasParentWithId(node.parentNode, parentId));
};

export const createImageFromCanvas = async (background = 'black', text?: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (text) {
      ctx.font = '40px sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    }

    const dataURL = canvas.toDataURL('image/jpeg');
    const res = await fetch(dataURL);
    const blob = await res.blob();

    return blob;
  }
  return new Blob();
};

// flattens an object into dot notation for storage in Brightsign registry since it can't handle nested objects.
export const saveObjectToDisk = (object: AWSSettings | ProvisionedDevicePayload, settingsKey: string) => {
  for (const [key, value] of ObjectEntries(object)) {
    window.DeviceAPI?.setSetting(`${settingsKey}.${key.toLowerCase()}`, value as string);
  }
};

// reassembles flattened object into a nested object from disk storage.
export const getAWSSettingsFromDisk = (): AWSSettings => {
  const settingsKey = DiskKeys.AWSSettings;
  return {
    region: (window.DeviceAPI.getSetting(`${settingsKey}.region`) as string) ?? '',
    cognitoClientId: (window.DeviceAPI.getSetting(`${settingsKey}.cognitoclientid`) as string) ?? '',
    cognitoFedPoolId: (window.DeviceAPI.getSetting(`${settingsKey}.cognitofedpoolid`) as string) ?? '',
    cognitoUserPoolId: (window.DeviceAPI.getSetting(`${settingsKey}.cognitouserpoolid`) as string) ?? '',
    endpointAddress: (window.DeviceAPI.getSetting(`${settingsKey}.endpointaddress`) as string) ?? '',
    Logins: (window.DeviceAPI.getSetting(`${settingsKey}.logins`) as unknown as Record<string, string | null>) ?? {},
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

export const rotateBlobImage = (base64Image: Blob, orientation: number) => {
  return new Promise<Blob>((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const image = new Image();

      image.onload = function () {
        switch (orientation) {
          case 90:
            Logger.info(`[SCREENSHOT] Rotating image 90 degrees.`);
            canvas.setAttribute('width', `${image.height}`);
            canvas.setAttribute('height', `${image.width}`);
            ctx?.rotate((orientation * Math.PI) / 180);
            ctx?.drawImage(image, 0, -`${image.height}`);
            break;
          case 180:
            Logger.info(`[SCREENSHOT] Rotating image 180 degrees.`);
            canvas.setAttribute('width', `${image.width}`);
            canvas.setAttribute('height', `${image.height}`);
            ctx?.rotate((orientation * Math.PI) / 180);
            ctx?.drawImage(image, -`${image.width}`, -`${image.height}`);
            break;
          case 270:
            Logger.info(`[SCREENSHOT] Rotating image 270 degrees.`);
            canvas.setAttribute('width', `${image.height}`);
            canvas.setAttribute('height', `${image.width}`);
            ctx?.rotate((orientation * Math.PI) / 180);
            ctx?.drawImage(image, -`${image.width}`, 0);
            break;
          case 0:
          default:
            canvas.setAttribute('width', `${image.width}`);
            canvas.setAttribute('height', `${image.height}`);
            ctx?.rotate((orientation * Math.PI) / 180);
            ctx?.drawImage(image, 0, 0);
            break;
        }

        const binStr = atob(canvas.toDataURL('image/jpeg', 1.0).split(',')[1]),
          len = binStr.length,
          arr = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
          arr[i] = binStr.charCodeAt(i);
        }
        resolve(new Blob([arr], { type: 'image/jpeg' }));
      };

      image.src = URL.createObjectURL(base64Image);
    } catch (error) {
      reject(error);
    }
  });
};

export function randomUUID() {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
  );
}
