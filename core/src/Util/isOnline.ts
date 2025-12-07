import { DeviceManufacturer } from '@core/constants';

export async function isOnline(): Promise<boolean> {
  try {
    const res = await fetch('https://fwicloud.com', { method: 'HEAD', mode: 'no-cors' });
    return !!res;
  } catch {
    return false;
  }
}

export async function checkWifiCardPresence(): Promise<boolean> {
  if (window.DeviceAPI.getManufacturer() === DeviceManufacturer.BrightSign) {
    const activeInterfaces = await window.DeviceAPI.getNetworkInterfaces();
    return activeInterfaces.wifi.present;
  }

  return true;
}
