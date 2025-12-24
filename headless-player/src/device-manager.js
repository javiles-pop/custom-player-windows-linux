const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeviceManager {
  constructor() {
    this.systemInfo = null;
    this.configPath = this.getConfigPath();
  }

  getConfigPath() {
    const platform = process.platform;
    if (platform === 'win32') {
      return path.join(process.env.APPDATA || 'C:\\Users\\Public', 'Poppulo', 'config.json');
    } else {
      return path.join(os.homedir(), '.poppulo', 'config.json');
    }
  }

  async initialize() {
    // Ensure config directory exists
    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Detect system info
    this.systemInfo = await this.detectSystemInfo();
    console.log('Device initialized:', this.systemInfo.serialNumber);
  }

  async detectSystemInfo() {
    const platform = process.platform;
    let systemInfo = {
      serialNumber: 'UNKNOWN',
      deviceType: platform === 'win32' ? 'Windows' : platform === 'linux' ? 'Linux' : platform,
      makeModel: 'Unknown',
      operatingSystem: 'Unknown',
      playerType: 'BrightSign', // Spoof BrightSign for compatibility
      playerVersion: '2.0.0'
    };

    try {
      if (platform === 'win32') {
        try {
          const ps = (cmd) => execSync(`powershell -Command "${cmd}"`, { encoding: 'utf8' }).trim();
          
          const serial = ps('Get-CimInstance -ClassName Win32_BIOS | Select-Object -ExpandProperty SerialNumber');
          if (serial && serial !== 'SerialNumber') {
            systemInfo.serialNumber = serial;
          }
          
          const cpu = ps('Get-CimInstance -ClassName Win32_Processor | Select-Object -ExpandProperty Name');
          if (cpu && cpu !== 'Name') {
            systemInfo.makeModel = cpu;
          }
          
          const os = ps('Get-CimInstance -ClassName Win32_OperatingSystem | Select-Object -ExpandProperty Caption');
          if (os && os !== 'Caption') {
            systemInfo.operatingSystem = os;
          }
        } catch (err) {
          console.error('Error getting Windows system info:', err.message);
          systemInfo.serialNumber = 'WIN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        }
      } else if (platform === 'linux') {
        const exec = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();
        systemInfo.serialNumber = exec('cat /sys/class/dmi/id/product_serial 2>/dev/null || echo LINUX_UNKNOWN');
        const cpuModel = exec('cat /proc/cpuinfo | grep "model name" | head -1 | cut -d":" -f2').trim();
        systemInfo.makeModel = cpuModel || 'Unknown CPU';
        const osRelease = exec('cat /etc/os-release | grep PRETTY_NAME | cut -d"=" -f2').replace(/"/g, '');
        systemInfo.operatingSystem = osRelease || 'Linux';
      }
    } catch (error) {
      console.error('Error detecting system info:', error.message);
    }

    return systemInfo;
  }

  async getSystemInfo() {
    return this.systemInfo || await this.detectSystemInfo();
  }

  getSerialNumber() {
    return this.systemInfo?.serialNumber || 'UNKNOWN';
  }

  getManufacturer() {
    return 'BrightSign'; // Spoof for compatibility
  }

  saveConfig(data) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
    return {};
  }

  async getNetworkInfo() {
    try {
      const interfaces = os.networkInterfaces();
      let ip = 'unknown';
      let macAddress = '00:00:00:00:00:00';
      let activeAdapter = 'unknown';

      // Find first non-loopback interface with IP
      for (const [name, addrs] of Object.entries(interfaces)) {
        if (name.includes('lo')) continue;
        
        const ipv4 = addrs?.find(addr => addr.family === 'IPv4' && !addr.internal);
        if (ipv4) {
          ip = ipv4.address;
          macAddress = ipv4.mac || macAddress;
          activeAdapter = name;
          break;
        }
      }

      return { ip, macAddress, activeAdapter };
    } catch (error) {
      console.error('Error getting network info:', error);
      return { ip: 'unknown', macAddress: '00:00:00:00:00:00', activeAdapter: 'unknown' };
    }
  }
}

module.exports = DeviceManager;