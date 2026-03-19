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

  async downloadChannelContent(extractDir, token) {
    const fs = require('fs');
    const path = require('path');
    const fetch = require('node-fetch');
    
    // Check for channel.json (Simple/Daily channels)
    const channelJsonPath = path.join(extractDir, 'channel.json');
    if (fs.existsSync(channelJsonPath)) {
      const channelData = JSON.parse(fs.readFileSync(channelJsonPath, 'utf8'));
      const total = channelData.contentList.length;
      
      for (let i = 0; i < total; i++) {
        const content = channelData.contentList[i];
        console.log(`[CONTENT] [${i + 1}/${total}] Downloading: ${content.id}`);
        
        try {
          const contentRes = await fetch(content.url, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!contentRes.ok) {
            console.error(`[CONTENT] Failed to download ${content.id}: HTTP ${contentRes.status}`);
            continue;
          }
          
          if (content.type === 'Playlist') {
            const playlistJson = await contentRes.json();
            const playlistPath = path.join(extractDir, `${content.id}.json`);
            fs.writeFileSync(playlistPath, JSON.stringify(playlistJson, null, 2));
            console.log(`[CONTENT] Saved playlist: ${content.id}.json`);
            
            const items = Array.isArray(playlistJson) ? playlistJson : (playlistJson.items || []);
            for (let j = 0; j < items.length; j++) {
              const item = items[j];
              const itemUrl = item.URL || item.url;
              const urlPath = new URL(itemUrl).pathname;
              const itemId = urlPath.split('/objects/')[1]?.split('/')[0] || `item-${j}`;
              console.log(`[CONTENT]   [${j + 1}/${items.length}] Downloading: ${itemId}`);
              
              try {
                const itemRes = await fetch(itemUrl, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!itemRes.ok) continue;
                
                const itemBuffer = await itemRes.arrayBuffer();
                const ext = this.getFileExtension(itemUrl, itemRes.headers.get('content-type'), item.MimeType || item.type);
                const itemPath = path.join(extractDir, `${itemId}${ext}`);
                fs.writeFileSync(itemPath, Buffer.from(itemBuffer));
                console.log(`[CONTENT]   Saved: ${itemId}${ext} (${(itemBuffer.byteLength / 1024).toFixed(2)} KB)`);
              } catch (err) {
                console.error(`[CONTENT] Error downloading:`, err.message);
              }
            }
          } else if (content.type === 'App') {
            const contentBuffer = await contentRes.arrayBuffer();
            const contentPath = path.join(extractDir, `${content.id}.dsapp`);
            fs.writeFileSync(contentPath, Buffer.from(contentBuffer));
            console.log(`[CONTENT] Saved: ${content.id}.dsapp (${(contentBuffer.byteLength / 1024).toFixed(2)} KB)`);
          } else {
            const contentBuffer = await contentRes.arrayBuffer();
            const ext = this.getFileExtension(content.url, contentRes.headers.get('content-type'), content.type);
            const contentPath = path.join(extractDir, `${content.id}${ext}`);
            fs.writeFileSync(contentPath, Buffer.from(contentBuffer));
            console.log(`[CONTENT] Saved: ${content.id}${ext} (${(contentBuffer.byteLength / 1024).toFixed(2)} KB)`);
          }
        } catch (err) {
          console.error(`[CONTENT] Error downloading ${content.id}:`, err.message);
        }
      }
      return;
    }
    
    // Check for Deployment.xml (Content Experience Builder)
    const deploymentXmlPath = path.join(extractDir, 'Deployment.xml');
    if (fs.existsSync(deploymentXmlPath)) {
      console.log('[CONTENT] No channel.json found - checking for Deployment.xml (Content Experience Builder)');
      const xml = fs.readFileSync(deploymentXmlPath, 'utf8');

      // Parse AvailableContent blocks to extract URL + CXB content type together
      const contentItems = [];
      const contentBlockRegex = /<Content p3:type="([^"]+)"[^>]*>([\s\S]*?)<\/Content>/g;
      let blockMatch;
      while ((blockMatch = contentBlockRegex.exec(xml)) !== null) {
        const cxbType = blockMatch[1];
        const block = blockMatch[2];
        const pathMatch = block.match(/<Path>([^<]+)<\/Path>/);
        if (pathMatch && (pathMatch[1].startsWith('http') || pathMatch[1].startsWith('\\\\'))) {
          contentItems.push({ url: pathMatch[1], cxbType });
        }
      }

      console.log(`[CONTENT] Found ${contentItems.length} content path(s) in Deployment.xml`);

      for (const { url: contentPath, cxbType } of contentItems) {
        try {
          if (contentPath.startsWith('\\\\')) {
            const fileName = path.basename(contentPath);
            const destPath = path.join(extractDir, fileName);
            console.log(`[CONTENT] Copying from network share: ${fileName}`);
            try {
              fs.copyFileSync(contentPath, destPath);
              const stats = fs.statSync(destPath);
              console.log(`[CONTENT] Saved: ${fileName} (${(stats.size / 1024).toFixed(2)} KB)`);
            } catch (err) {
              console.error(`[CONTENT] Failed to copy ${fileName}:`, err.message);
            }
            continue;
          }

          if (contentPath.includes('/playlist/') && contentPath.includes('/json')) {
            console.log(`[CONTENT] Downloading playlist: ${contentPath}`);
            const playlistRes = await fetch(contentPath, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!playlistRes.ok) continue;
            
            const playlistJson = await playlistRes.json();
            const items = Array.isArray(playlistJson) ? playlistJson : (playlistJson.items || []);
            
            for (let j = 0; j < items.length; j++) {
              const item = items[j];
              const itemUrl = item.URL || item.url;
              if (!itemUrl) continue;
              
              const urlPath = new URL(itemUrl).pathname;
              const itemId = urlPath.split('/objects/')[1]?.split('/')[0] || `item-${j}`;
              console.log(`[CONTENT]   [${j + 1}/${items.length}] Downloading: ${itemId}`);
              
              const itemRes = await fetch(itemUrl, { headers: { 'Authorization': `Bearer ${token}` } });
              if (!itemRes.ok) continue;
              
              const itemBuffer = await itemRes.arrayBuffer();
              const ext = this.getFileExtension(itemUrl, itemRes.headers.get('content-type'), item.MimeType || item.type);
              const itemPath = path.join(extractDir, `${itemId}${ext}`);
              fs.writeFileSync(itemPath, Buffer.from(itemBuffer));
              console.log(`[CONTENT]   Saved: ${itemId}${ext} (${(itemBuffer.byteLength / 1024).toFixed(2)} KB)`);
            }
          } else {
            const urlPath = new URL(contentPath).pathname;
            const contentId = urlPath.split('/objects/')[1]?.split('/')[0];
            if (!contentId) continue;
            
            console.log(`[CONTENT] Downloading content: ${contentId}`);
            const contentRes = await fetch(contentPath, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!contentRes.ok) continue;
            
            const contentBuffer = await contentRes.arrayBuffer();
            const ext = this.getFileExtension(contentPath, contentRes.headers.get('content-type'), cxbType);
            const filePath = path.join(extractDir, `${contentId}${ext}`);
            fs.writeFileSync(filePath, Buffer.from(contentBuffer));
            console.log(`[CONTENT] Saved: ${contentId}${ext} (${(contentBuffer.byteLength / 1024).toFixed(2)} KB)`);
          }
        } catch (err) {
          console.error(`[CONTENT] Error downloading content:`, err.message);
        }
      }
    }
  }

  getFileExtension(url, contentType, fallbackType) {
    const path = require('path');
    const urlExt = path.extname(new URL(url).pathname).toLowerCase();
    if (urlExt && urlExt.length > 1) return urlExt;
    
    const typeMap = {
      'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/svg+xml': '.svg', 'image/gif': '.gif', 'image/webp': '.webp',
      'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
      'audio/mpeg': '.mp3', 'audio/mp3': '.mp3',
      'application/pdf': '.pdf',
      'application/vnd.ms-powerpoint': '.ppt', 'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
      'application/msword': '.doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'text/csv': '.csv', 'application/csv': '.csv',
      'application/x-dsapp': '.dsapp',
      'text/html': '.html', 'application/xhtml+xml': '.html',
      'font/ttf': '.ttf', 'application/x-font-ttf': '.ttf', 'font/opentype': '.otf', 'application/x-font-opentype': '.otf',
      'application/json': '.json', 'text/json': '.json', 'application/xml': '.xml', 'text/xml': '.xml'
    };
    
    if (contentType && typeMap[contentType.split(';')[0].trim()]) {
      return typeMap[contentType.split(';')[0].trim()];
    }

    // CXB content type fallbacks from Deployment.xml p3:type attribute
    const cxbTypeMap = {
      'ExcelContent': '.csv',
      'DocumentContent': '.docx',
      'PdfContent': '.pdf',
      'HtmlContent': '.html',
      'VideoContent': '.mp4',
      'ImageContent': '.jpg',
      'AudioContent': '.mp3',
    };
    if (fallbackType && cxbTypeMap[fallbackType]) return cxbTypeMap[fallbackType];

    // Simple channel fallbacks
    if (fallbackType === 'Image') return '.jpg';
    if (fallbackType === 'Video') return '.mp4';
    if (fallbackType === 'App') return '.dsapp';
    
    return '.bin';
  }

  cleanupOldVersions(contentDir, channelId, currentVersion) {
    try {
      const fs = require('fs');
      const path = require('path');
      const files = fs.readdirSync(contentDir);
      const currentChannelPrefix = `${channelId}.${currentVersion}`;
      
      files.forEach(file => {
        if (file.startsWith(currentChannelPrefix)) return;
        
        const fullPath = path.join(contentDir, file);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory() && file.match(/^.+\.\d+$/)) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`[CLEANUP] Removed old channel: ${file}`);
        } else if (file.endsWith('.zip') && file.match(/^.+\.\d+\.zip$/)) {
          fs.unlinkSync(fullPath);
          console.log(`[CLEANUP] Deleted old channel ZIP: ${file}`);
        }
      });
    } catch (err) {
      console.error('[CLEANUP] Cleanup error:', err.message);
    }
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
        
        const Config = require('./config');
        const config = new Config();
        const downloadUrl = `${config.getApiBase()}/channels/v1/companies/${companyId}/channels/${channelId}/download`;
        console.log(`[CHANNEL] Fetching: ${downloadUrl}`);
        
        const response = await fetch(downloadUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const downloadInfo = await response.json();
        console.log(`[CHANNEL] Downloading channel v${downloadInfo.version}`);
        console.log(`[CHANNEL] Channel URL: ${downloadInfo.channelUrl}`);
        
        const contentResponse = await fetch(downloadInfo.channelUrl);
        if (!contentResponse.ok) {
          throw new Error(`Failed to download ZIP: HTTP ${contentResponse.status}`);
        }
        
        const buffer = await contentResponse.arrayBuffer();
        const filename = `${channelId}.${downloadInfo.version}.zip`;
        const contentDir = this.channelManager.getContentDir();
        const filepath = path.join(contentDir, filename);
        
        if (!fs.existsSync(contentDir)) {
          fs.mkdirSync(contentDir, { recursive: true });
        }
        
        fs.writeFileSync(filepath, Buffer.from(buffer));
        console.log(`[CHANNEL] Downloaded: ${filename} (${(buffer.byteLength / 1024).toFixed(2)} KB)`);
        
        const extractDir = path.join(contentDir, `${channelId}.${downloadInfo.version}`);
        const zip = new AdmZip(filepath);
        zip.extractAllTo(extractDir, true);
        console.log(`[CHANNEL] Extracted to: ${extractDir}`);
        
        await this.downloadChannelContent(extractDir, token);
        
        this.cleanupOldVersions(contentDir, channelId, downloadInfo.version);
        
        const currentChannelInfo = {
          channelId: channelId,
          version: downloadInfo.version,
          path: extractDir,
          name: downloadInfo.channelName,
          lastUpdated: new Date().toISOString()
        };
        
        const trackerPath = path.join(contentDir, 'current-channel.json');
        fs.writeFileSync(trackerPath, JSON.stringify(currentChannelInfo, null, 2));
        console.log(`[CHANNEL] Updated current channel tracker: ${trackerPath}`);
        console.log(`[CHANNEL] Channel downloaded: ${downloadInfo.channelName} v${downloadInfo.version}`);
        
        res.json({ 
          success: true, 
          name: downloadInfo.channelName, 
          version: downloadInfo.version,
          path: extractDir
        });
      } catch (error) {
        console.error('[CHANNEL] Download failed:', error);
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
      await this.deviceManager.initialize();
      
      const port = process.env.PORT || 3001;
      this.app.listen(port, () => {
        console.log(`[HTTP] Headless player HTTP server running on port ${port}`);
        console.log(`[HTTP] Content directory: ${this.channelManager.getContentDir()}`);
        console.log(`[HTTP] System info available at: http://localhost:${port}/system/info`);
      });
      
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

if (require.main === module) {
  const player = new HeadlessPlayer();
  player.start();
}

module.exports = HeadlessPlayer;
