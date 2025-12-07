import {
  setFirmwareDownloadProgress,
  setFirmwareUpdateInProgress,
  setFirmwareUpdateSize,
  setLastSoftwareCheck,
  setTouchScreen,
} from '@core/appState/deviceState';
import { DeviceAPI, storeExport as store } from '@core/index';
// import html2canvas from 'html2canvas';
import { mapRelativeValue, semverIsGreater } from '@core/Util';
import { DeviceManufacturer, DiskKeys, OnOff } from '@core/constants';

class BrowserAPI extends DeviceAPI {
  activeBrightSignIPAddress = process.env.REACT_APP_BRIGHTSIGN_IP ?? '';
  activeBrightSignSerialNumber = process.env.REACT_APP_BRIGHTSIGN_SERIAL ?? '';
  firmwareUpdateURLValidationPattern = /^(.+)\.bsfw$/;
  softwareUpdateValidationPattern = /^(.+)autorun\.zip$/;
  supportsCECControl = true;
  supportsCustomResolution = true;
  supportsDisplayRotation = true;
  supportsLocalCache = true;
  supportsMonitoring = true;
  supportsProxy = true;
  supportsTCPConfig = false;
  supportsVirtualKeyboard = false;
  supportsWifiConfig = false;
  supportsVideoWall = true;
  supportsStorageEncryption = true;
  // softwareUpdateValidationPattern = /^(.+)autorun\.zip$/;
  // firmwareUpdateURLValidationPattern = /(.+)/;

  constructor(Logger: any) {
    super(Logger);
  }

  postInit = async () => {
    const hasTouchScreen = await this.hasTouchScreen();
    store.dispatch(setTouchScreen(hasTouchScreen));
  };

  private downloadFile = (blob: Blob) => {
    const blobUrl = URL.createObjectURL(blob);
    // spoof a downloadable anchor tag.
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'cloudLogs.json';
    link.style.visibility = 'hidden';
    document.body.appendChild(link);

    //download.
    link.click();

    // teardown
    document.body.removeChild(link);
  };

  private sendNodeServerRequest = async (endpoint: string, options?: RequestInit) => {
    const defaultHeaders = {
      'X-FWI-Device-Auth': this.activeBrightSignSerialNumber,
    };

    if (options?.headers) {
      options.headers = { ...options.headers, ...defaultHeaders };
    } else {
      options = {
        ...options,
        headers: defaultHeaders,
      };
    }

    const host = this.activeBrightSignIPAddress || 'localhost:3001';
    const request = await fetch(`http://${host}${endpoint}`, options);

    return request;
  };

  checkForSoftwareUpdate = async () => {
    const { softwareUpdateURL } = store.getState().appSettings;
    try {
      const res = await fetch(`${softwareUpdateURL}/sssp_config.xml`);
      const xml = await res.text();

      const matches = xml.match(/\<ver\>((\d+\.?){3})\<\/ver\>/);
      console.log(matches);
      if (matches) {
        const version = matches[1];
        this.Logger.debug(`[SOFTWARE] Comparing ${process.env.REACT_APP_VERSION!} vs. ${version}`);

        return semverIsGreater(process.env.REACT_APP_VERSION!, version);
      }
      return false;
    } catch (error) {
      this.Logger.error(error);
      return false;
    }
  };

  updateSoftware = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log('Updating software...');
      setTimeout(() => {
        store.dispatch(setLastSoftwareCheck(new Date().toUTCString()));
        resolve();
        location.reload();
      }, 3000);
    });
  };

  saveCloudLogsToDisk = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // clear out the current logs.
        const logs = [...this.logs];
        this.logs = [];

        // create a json blob of the current logs.
        const blob = new Blob([JSON.stringify(logs)], {
          type: 'application/json',
        });

        // download
        this.downloadFile(blob);
        resolve();
      } catch {
        reject('Failed to download cloudLogs.json');
      }
    });
  };

  savePlaybackLogsToDisk = async (logs: PlayEvent[]): Promise<void> => {
    return;
  };

  saveChannelContent = async (blob: Blob, channelId: string, version: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        const formData = new FormData();
        formData.append('file', blob, `${channelId}.${version}.zip`);
        formData.append('channelId', channelId);
        formData.append('version', version);
        
        const res = await fetch('http://localhost:3001/channel/save', {
          method: 'POST',
          body: formData,
        });
        
        const { success } = await res.json();
        if (success) {
          this.Logger.info(`[CHANNEL] Saved ${channelId}.${version}.zip to disk`);
          resolve();
        } else {
          reject('Failed to save channel content');
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  rotateScreen = () => {
    const body = document.querySelector('body');
    if (!body?.classList.length) {
      body?.classList.add('degree90');
    } else if (body?.classList.contains('degree90')) {
      body.classList.replace('degree90', 'degree180');
    } else if (body?.classList.contains('degree180')) {
      body.classList.replace('degree180', 'degree270');
    } else if (body?.classList.contains('degree270')) {
      body.classList.remove('degree270');
    }
  };

  setScreenOrientation = (degrees: 0 | 90 | 180 | 270) => {
    const body = document.querySelector('body');
    body?.classList.remove('degree180', 'degree90', 'degree270');
    degrees === 0 ? null : body?.classList.add(`degree${degrees}`);
    this.setSetting(DiskKeys.Orientation, degrees);
  };

  getScreenOrientation = () => {
    const body = document.querySelector('body');
    if (!body?.classList.length) return 0;
    return parseInt(body?.classList.toString().replace('degree', ''));
  };

  captureScreenshot = async (): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      reject();
      try {
        // creates a "screenshot" of the body element as an HTML canvas
        // const canvas = await html2canvas(document.querySelector('body') as HTMLElement, { logging: false });
        // turn the canvas into a dataURL
        // const dataURL = canvas.toDataURL();
        // use fetch to to turn the data url into a blob
        // const imageBlob = await (await fetch(dataURL)).blob();
        // resolve(imageBlob);
      } catch (error) {
        reject(error);
      }
    });
  };

  getIPAddress = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      resolve('n/a');
    });
  };

  getMACAddress = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      resolve('00:00:00:00');
    });
  };

  getSerialNumber = async (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      if (process.env.REACT_APP_SERIAL) {
        resolve(process.env.REACT_APP_SERIAL);
      } else {
        try {
          const res = await fetch('http://localhost:3001/system/info');
          const { success, serialNumber } = await res.json();
          resolve(success ? serialNumber : 'BROWSER_SERIAL_NUMBER');
        } catch {
          resolve('BROWSER_SERIAL_NUMBER');
        }
      }
    });
  };

  getFirmwareVersion = (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await fetch('http://localhost:3001/system/info');
        const { success, operatingSystem } = await res.json();
        resolve(success ? operatingSystem : 'Unknown OS');
      } catch {
        resolve('Unknown OS');
      }
    });
  };

  updateFirmware = async () => {
    const size = 200000000; // 200MB
    const chunkSize = 10000000; //10MB
    let downloaded = 0;
    const addChunk = (progress: number) => {
      if (progress < size) {
        downloaded += chunkSize;
        const percentage = Math.ceil((downloaded / size) * 100) + '%';
        store.dispatch(setFirmwareDownloadProgress(percentage));
      } else {
        setTimeout(window.DeviceAPI.reboot, 2000);
      }
    };

    store.dispatch(setFirmwareUpdateInProgress(true));
    setTimeout(() => {
      store.dispatch(setFirmwareUpdateSize(size));
    }, 1500);

    setTimeout(() => {
      setInterval(() => {
        addChunk(downloaded);
      }, 1500);
    }, 3500);
  };

  turnDisplayOnOff = (toggle: OnOff) => {
    this.Logger.info(`Turning display ${toggle}.`);
    let screen;
    if (toggle === OnOff.Off) {
      screen = document.createElement('div');
      screen.id = 'black-screen';
      document.body.appendChild(screen);
    } else {
      screen = document.getElementById('black-screen');
      if (screen) {
        document.body.removeChild(screen);
      }
    }
  };

  getManufacturer = () => {
    // Browser version spoofs BrightSign for cloudFeatures.json compatibility
    return DeviceManufacturer.BrightSign;
  };

  getModel = async (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await fetch('http://localhost:3001/system/info');
        const { success, makeModel } = await res.json();
        resolve(success ? makeModel : 'Unknown Model');
      } catch {
        resolve('Unknown Model');
      }
    });
  };

  getDisplayStatus = (): OnOff => {
    const displayStatus = store.getState().deviceState.isDisplayOn ? OnOff.On : OnOff.Off;
    return displayStatus;
  };

  applyProxy = async () => {
    setTimeout(() => {
      this.Logger.info('[NETWORK] Successfully saved proxy settings. Rebooting to apply.');
      this.reboot();
    }, 1500);
  };

  reboot = () => {
    if (this.activeBrightSignIPAddress) {
      this.sendNodeServerRequest(`/reboot`, { method: 'POST' }).then(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  restartApp = () => {
    window.location.reload();
  };

  getTimeZoneMap = () => {
    return {
      MST: 'Mountain Standard Time',
    };
  };

  scanNetworks = async (): Promise<{ ssid: string; signal: number }[]> => {
    this.Logger.info('[NETWORK] Scanning for networks...');
    const res = await this.sendNodeServerRequest(`/network/scan`);
    const networks = await res.json();
    if (networks.success) {
      const payload: { essId: string; signal: number }[] = networks.payload;
      this.Logger.debug(`[NETWORK] found ${payload.length} networks.`);
      const maxSignalStrength = Math.max(...payload.map((n) => n.signal));
      const minSignalStrength = Math.min(...payload.map((n) => n.signal));

      const leanNetworks = payload.map((network) => ({
        ssid: network.essId,
        signal: mapRelativeValue(minSignalStrength, maxSignalStrength, network.signal, 1, 3),
      }));

      return leanNetworks;
    }
    this.Logger.error(`[NETWORK] Failed to scan for networks. ${networks.msg}`);
    return [];

    // return new Promise((resolve, reject) => {
    //   setTimeout(() => {
    //     this.Logger.debug(`[NETWORK] found 3 networks`);
    //     resolve(['network 1', 'network 2', 'network 3', 'network 4']);
    //   }, 3000);
    // });
  };

  getWifiStatus = async (): Promise<{
    ssid: string;
    signalStrength: number;
    connected: boolean;
  }> => {
    const res = await this.sendNodeServerRequest('/network/wifi');
    const data = await res.json();
    console.log('getWifiStatus', data);

    if (data.success) {
      return {
        connected: data.payload.connected,
        ssid: data.payload.essid,
        signalStrength: data.payload.signalStrength,
      };
    }

    return {
      connected: false,
      ssid: '',
      signalStrength: 0,
    };
  };
  hasTouchScreen = async () => true;

  getResolutions = async (): Promise<{ modes: string[]; active: string; best: string }> => {
    const active = `${window.innerWidth}x${window.innerHeight}@60`;
    const best = `1920x1080@60`;

    return { modes: Array.from(new Set(['1920x1080@60', '1280x720@60', active, best])), active, best };
  };

  getActiveNetworkInterface = async (): Promise<string> => {
    let activeAdapter = 'Default Adapter';
    try {
      const interfaces = await this.sendNodeServerRequest('/network/interfaces');
      const { success, payload } = await interfaces.json();
      if (success && payload) {
        console.log(payload);
        if (payload.ethernet.hasLink && payload.ethernet.ipAddressList.length > 0) {
          activeAdapter = 'eth0';
        } else if (payload.wifi.hasLink && payload.wifi.ipAddressList.length > 0) {
          activeAdapter = 'wlan0';
        }
      }
    } catch {
      // Fail silently
    } finally {
      return activeAdapter;
    }
  };

  getNetworkConfig = async () => {
    const res = await this.sendNodeServerRequest('/network/config');
    const { payload } = (await res.json()) as {
      success: boolean;
      msg: string;
      payload: NetworkInterfaceConfig;
    };

    const filteredDNS = payload.dnsServerList?.filter((dns) => dns.match(/(\d{1,3}\.){3}\d{1,3}/));
    return {
      ...payload,
      dnsServerList: filteredDNS,
    };
  };

  setNetworkConfig = async (config: Partial<NetworkInterfaceConfig>) => {
    this.Logger.info('[NETWORK] Setting custom network configuration...');
    try {
      const currentConfig = await this.getNetworkConfig();
      const [essId = null, passphrase = false] = Buffer.from(this.getSetting('wirelessKey') ?? '', 'base64')
        .toString('utf-8')
        .split(';');

      const newConfig = { ...currentConfig, ...config };
      const res = await this.sendNodeServerRequest('/network/config', {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ config: newConfig }),
      });

      const { success, msg } = await res.json();

      if (success) {
        this.Logger.info(`[NETWORK] Successfully set network configuration.`);
      } else {
        this.Logger.error(`[NETWORK] Failed to set network configuration. ${msg}`);
      }
    } catch (error) {
      this.Logger.error(`[NETWORK] Failed to set network configuration. ${error}`);
    }
    return;
  };

  resetNetworkConfig = async () => {
    this.Logger.info('[NETWORK] Resetting network configuration...');
    this.sendNodeServerRequest('/network/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: {} }),
    });
  };

  async getDisplayConfig(): Promise<VideoModeScreenConfig[] | undefined> {
    return [
      { outputName: 'HDMI-1', videoMode: '1920x1080@60', screenX: 0, screenY: 0, transform: 'normal', enabled: true },
      {
        outputName: 'HDMI-2',
        videoMode: '1920x1080@60',
        screenX: 1920,
        screenY: 0,
        transform: 'normal',
        enabled: true,
      },
      {
        outputName: 'HDMI-3',
        videoMode: '1920x1080@60',
        screenX: 1080,
        screenY: 0,
        transform: 'normal',
        enabled: true,
      },
      {
        outputName: 'HDMI-4',
        videoMode: '1920x1080@60',
        screenX: 1080,
        screenY: 1920,
        transform: 'normal',
        enabled: true,
      },
    ];
  }

  async setDisplayConfig(config: VideoModeScreenConfig[]): Promise<boolean> {
    this.Logger.info('[DISPLAY] Setting display configuration...');
    const res = await this.sendNodeServerRequest('/display/outputs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
    const { success, msg, payload } = await res.json();
    if (success) {
      this.Logger.info(`[DISPLAY] ${msg}`);
      return payload;
    } else {
      this.Logger.error(msg);
      return false;
    }
  }
}

export { BrowserAPI };
