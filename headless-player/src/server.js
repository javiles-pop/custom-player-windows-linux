const express = require('express');
const multer = require('multer');
const DeviceManager = require('./device-manager');
const ChannelManager = require('./channel-manager');
const MQTTClient = require('./mqtt-client');
const Config = require('./config');

const upload = multer();

class HeadlessPlayer {
  constructor() {
    this.app = express();
    this.deviceManager = new DeviceManager();
    this.channelManager = new ChannelManager();
    this.mqttClient = null;
    this.config = new Config();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Content-Type, X-FWI-Device-Auth');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      if (req.method === 'OPTIONS') return res.sendStatus(200);
      next();
    });
  }

  setupRoutes() {
    this.app.get('/system/info', async (req, res) => {
      try {
        const info = await this.deviceManager.getSystemInfo();
        res.json({ success: true, ...info });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/channel/download', async (req, res) => {
      try {
        const { channelId, companyId, token } = req.body;
        const fetch = require('node-fetch');
        const fs = require('fs');
        const path = require('path');
        const AdmZip = require('adm-zip');
        
        const downloadUrl = `https://api-cloudtest1.fwi-dev.com/channels/v1/companies/${companyId}/channels/${channelId}/download`;
        console.log('Fetching:', downloadUrl);
        
        const response = await fetch(downloadUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const downloadInfo = await response.json();
        console.log(`Downloading channel v${downloadInfo.version}`);
        console.log(`Channel URL: ${downloadInfo.channelUrl}`);
        
        // Download the actual ZIP file
        const contentResponse = await fetch(downloadInfo.channelUrl);
        if (!contentResponse.ok) {
          throw new Error(`Failed to download ZIP: HTTP ${contentResponse.status}`);
        }
        
        const buffer = await contentResponse.arrayBuffer();
        const filename = `${channelId}.${downloadInfo.version}.zip`;
        const contentDir = this.channelManager.getContentDir();
        const filepath = path.join(contentDir, filename);
        
        // Ensure content directory exists
        if (!fs.existsSync(contentDir)) {
          fs.mkdirSync(contentDir, { recursive: true });
        }
        
        fs.writeFileSync(filepath, Buffer.from(buffer));
        console.log(`Downloaded: ${filename} (${(buffer.byteLength / 1024).toFixed(2)} KB)`);
        
        // Extract ZIP
        const extractDir = path.join(contentDir, `${channelId}.${downloadInfo.version}`);
        const zip = new AdmZip(filepath);
        zip.extractAllTo(extractDir, true);
        console.log(`Extracted to: ${extractDir}`);
        
        // Create current channel tracker
        const currentChannelInfo = {
          channelId: channelId,
          version: downloadInfo.version,
          path: extractDir,
          name: downloadInfo.channelName,
          lastUpdated: new Date().toISOString()
        };
        
        const trackerPath = path.join(contentDir, 'current-channel.json');
        fs.writeFileSync(trackerPath, JSON.stringify(currentChannelInfo, null, 2));
        console.log(`Updated current channel tracker: ${trackerPath}`);
        
        res.json({ 
          success: true, 
          name: downloadInfo.channelName, 
          version: downloadInfo.version,
          path: extractDir
        });
      } catch (error) {
        console.error('Channel download failed:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/channel/save', upload.single('file'), (req, res) => {
      try {
        const result = this.channelManager.saveChannel(req.body, req.file);
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/activate', async (req, res) => {
      try {
        const { inviteCode } = req.body;
        if (!inviteCode) {
          return res.status(400).json({ success: false, error: 'Invite code required' });
        }
        
        if (this.mqttClient) {
          await this.mqttClient.activateWithInviteCode(inviteCode);
          res.json({ success: true, message: 'Activation initiated' });
        } else {
          res.status(503).json({ success: false, error: 'MQTT client not available' });
        }
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/reset', (req, res) => {
      try {
        // Clear saved device config
        const config = this.deviceManager.loadConfig();
        delete config.provisionedDevice;
        this.deviceManager.saveConfig(config);
        
        res.json({ success: true, message: 'Device config cleared. Restart to re-provision.' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        mqtt: this.mqttClient?.isConnected() || false,
        timestamp: new Date().toISOString()
      });
    });

    // Network stub endpoints (browser player compatibility)
    this.app.get('/network/config', (req, res) => {
      res.json({ 
        success: true, 
        payload: { 
          dnsServerList: [],
          dhcp: true 
        } 
      });
    });

    this.app.get('/network/interfaces', (req, res) => {
      res.json({ 
        success: true, 
        payload: { 
          ethernet: { hasLink: false, ipAddressList: [] },
          wifi: { hasLink: false, ipAddressList: [] }
        } 
      });
    });
  }

  async start() {
    try {
      // Initialize device
      await this.deviceManager.initialize();
      
      // Start HTTP server first
      const port = process.env.PORT || 3001;
      this.app.listen(port, () => {
        console.log(`Headless player HTTP server running on port ${port}`);
        console.log(`Content directory: ${this.channelManager.getContentDir()}`);
        console.log(`System info available at: http://localhost:${port}/system/info`);
      });
      
      // Try MQTT connection (non-blocking)
      try {
        this.mqttClient = new MQTTClient(this.deviceManager, this.channelManager);
        await this.mqttClient.connect();
        console.log('MQTT client connected successfully');
      } catch (mqttError) {
        console.warn('MQTT connection failed (continuing without cloud connectivity):', mqttError.message);
      }
      
    } catch (error) {
      console.error('Failed to start headless player:', error);
      process.exit(1);
    }
  }
}

// Start the player
if (require.main === module) {
  const player = new HeadlessPlayer();
  player.start();
}

module.exports = HeadlessPlayer;