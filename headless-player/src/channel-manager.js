const fs = require('fs');
const path = require('path');
const os = require('os');
const AdmZip = require('adm-zip');
const fetch = require('node-fetch');

class ChannelManager {
  constructor() {
    this.contentDir = this.getContentDir();
    this.ensureContentDir();
  }

  saveChannel(body, file) {
    try {
      const { channelId, version } = body;
      const filename = `${channelId}.${version}.zip`;
      const filepath = path.join(this.contentDir, filename);
      
      fs.writeFileSync(filepath, file.buffer);
      console.log(`Saved channel: ${filename}`);
      
      return { success: true, path: filepath };
    } catch (error) {
      console.error('Failed to save channel:', error);
      throw error;
    }
  }

  getContentDir() {
    return process.platform === 'win32' 
      ? 'C:\\Users\\Public\\Documents\\Four Winds Interactive\\Content'
      : path.join(os.homedir(), 'Poppulo', 'Content');
  }

  ensureContentDir() {
    if (!fs.existsSync(this.contentDir)) {
      fs.mkdirSync(this.contentDir, { recursive: true });
    }
  }

  async downloadChannel({ channelId, companyId, token }) {
    try {
      const environment = process.env.ENVIRONMENT || 'dev';
      const apiBase = this.getApiBase(environment);
      const downloadUrl = `${apiBase}/channels/v1/companies/${companyId}/channels/${channelId}/download`;
      
      console.log(`Downloading channel ${channelId}...`);
      
      const response = await fetch(downloadUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const downloadInfo = await response.json();
      console.log(`Channel v${downloadInfo.version}: ${downloadInfo.channelName}`);
      
      // Download ZIP
      const contentResponse = await fetch(downloadInfo.channelUrl);
      if (!contentResponse.ok) {
        throw new Error(`Failed to download ZIP: HTTP ${contentResponse.status}`);
      }
      
      const buffer = await contentResponse.arrayBuffer();
      const filename = `${channelId}.${downloadInfo.version}.zip`;
      const filepath = path.join(this.contentDir, filename);
      fs.writeFileSync(filepath, Buffer.from(buffer));
      
      // Extract and process
      const extractDir = path.join(this.contentDir, `${channelId}.${downloadInfo.version}`);
      const zip = new AdmZip(filepath);
      zip.extractAllTo(extractDir, true);
      
      // Process content based on channel type
      await this.processChannelContent(extractDir, token);
      
      // Cleanup old versions
      this.cleanupOldVersions(channelId, downloadInfo.version);
      
      // Update current channel tracker
      this.updateCurrentChannelTracker({
        channelId,
        version: downloadInfo.version,
        path: extractDir,
        name: downloadInfo.channelName,
        lastUpdated: new Date().toISOString()
      });
      
      return { 
        success: true, 
        path: extractDir, 
        version: downloadInfo.version, 
        name: downloadInfo.channelName 
      };
    } catch (error) {
      console.error('Channel download failed:', error);
      throw error;
    }
  }

  async processChannelContent(extractDir, token) {
    // Check for channel.json (Simple/Daily channels)
    const channelJsonPath = path.join(extractDir, 'channel.json');
    if (fs.existsSync(channelJsonPath)) {
      await this.processSimpleChannel(extractDir, channelJsonPath, token);
      return;
    }

    // Check for Deployment.xml (Content Experience Builder)
    const deploymentXmlPath = path.join(extractDir, 'Deployment.xml');
    if (fs.existsSync(deploymentXmlPath)) {
      await this.processCXBChannel(extractDir, deploymentXmlPath, token);
    }
  }

  async processSimpleChannel(extractDir, channelJsonPath, token) {
    const channelData = JSON.parse(fs.readFileSync(channelJsonPath, 'utf8'));
    
    for (let i = 0; i < channelData.contentList.length; i++) {
      const content = channelData.contentList[i];
      console.log(`[${i + 1}/${channelData.contentList.length}] Downloading: ${content.id}`);
      
      try {
        await this.downloadContent(content, extractDir, token);
      } catch (error) {
        console.error(`Failed to download ${content.id}:`, error.message);
      }
    }
  }

  async processCXBChannel(extractDir, deploymentXmlPath, token) {
    const xml = fs.readFileSync(deploymentXmlPath, 'utf8');
    const pathMatches = xml.match(/<Path>([^<]+)<\/Path>/g) || [];
    const contentPaths = pathMatches
      .map(m => m.replace(/<\/?Path>/g, ''))
      .filter(p => p && (p.startsWith('http') || p.startsWith('\\\\')));
    
    console.log(`Found ${contentPaths.length} content path(s) in Deployment.xml`);
    
    for (const contentPath of contentPaths) {
      try {
        await this.downloadContentPath(contentPath, extractDir, token);
      } catch (error) {
        console.error(`Failed to download content:`, error.message);
      }
    }
  }

  async downloadContent(content, extractDir, token) {
    const contentRes = await fetch(content.url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!contentRes.ok) {
      throw new Error(`HTTP ${contentRes.status}`);
    }
    
    if (content.type === 'Playlist') {
      const playlistJson = await contentRes.json();
      const playlistPath = path.join(extractDir, `${content.id}.json`);
      fs.writeFileSync(playlistPath, JSON.stringify(playlistJson, null, 2));
      
      // Download playlist items
      const items = Array.isArray(playlistJson) ? playlistJson : (playlistJson.items || []);
      for (const item of items) {
        if (item.URL || item.url) {
          await this.downloadPlaylistItem(item, extractDir, token);
        }
      }
    } else {
      const contentBuffer = await contentRes.arrayBuffer();
      const ext = this.getFileExtension(content.url, contentRes.headers.get('content-type'), content.type);
      const contentPath = path.join(extractDir, `${content.id}${ext}`);
      fs.writeFileSync(contentPath, Buffer.from(contentBuffer));
      console.log(`Saved: ${content.id}${ext}`);
    }
  }

  async downloadContentPath(contentPath, extractDir, token) {
    // Handle UNC network paths
    if (contentPath.startsWith('\\\\')) {
      const fileName = path.basename(contentPath);
      const destPath = path.join(extractDir, fileName);
      fs.copyFileSync(contentPath, destPath);
      console.log(`Copied: ${fileName}`);
      return;
    }

    // Handle HTTP/HTTPS URLs
    if (contentPath.includes('/playlist/') && contentPath.includes('/json')) {
      await this.downloadPlaylistUrl(contentPath, extractDir, token);
    } else {
      await this.downloadDirectContent(contentPath, extractDir, token);
    }
  }

  async downloadPlaylistItem(item, extractDir, token) {
    const itemUrl = item.URL || item.url;
    const urlPath = new URL(itemUrl).pathname;
    const itemId = urlPath.split('/objects/')[1]?.split('/')[0] || `item-${Date.now()}`;
    
    const itemRes = await fetch(itemUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (itemRes.ok) {
      const itemBuffer = await itemRes.arrayBuffer();
      const ext = this.getFileExtension(itemUrl, itemRes.headers.get('content-type'), item.MimeType || item.type);
      const itemPath = path.join(extractDir, `${itemId}${ext}`);
      fs.writeFileSync(itemPath, Buffer.from(itemBuffer));
      console.log(`Saved: ${itemId}${ext}`);
    }
  }

  async downloadPlaylistUrl(contentPath, extractDir, token) {
    console.log(`Downloading playlist: ${contentPath}`);
    const playlistRes = await fetch(contentPath, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!playlistRes.ok) return;
    
    const playlistJson = await playlistRes.json();
    const items = Array.isArray(playlistJson) ? playlistJson : (playlistJson.items || []);
    
    for (let j = 0; j < items.length; j++) {
      const item = items[j];
      const itemUrl = item.URL || item.url;
      if (!itemUrl) continue;
      
      const urlPath = new URL(itemUrl).pathname;
      const itemId = urlPath.split('/objects/')[1]?.split('/')[0] || `item-${j}`;
      console.log(`  [${j + 1}/${items.length}] Downloading: ${itemId}`);
      
      const itemRes = await fetch(itemUrl, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!itemRes.ok) continue;
      
      const itemBuffer = await itemRes.arrayBuffer();
      const ext = this.getFileExtension(itemUrl, itemRes.headers.get('content-type'), item.MimeType || item.type);
      const itemPath = path.join(extractDir, `${itemId}${ext}`);
      fs.writeFileSync(itemPath, Buffer.from(itemBuffer));
      console.log(`  Saved: ${itemId}${ext} (${(itemBuffer.byteLength / 1024).toFixed(2)} KB)`);
    }
  }

  async downloadDirectContent(contentPath, extractDir, token) {
    const urlPath = new URL(contentPath).pathname;
    const contentId = urlPath.split('/objects/')[1]?.split('/')[0];
    if (!contentId) return;
    
    console.log(`Downloading content: ${contentId}`);
    const contentRes = await fetch(contentPath, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!contentRes.ok) return;
    
    const contentBuffer = await contentRes.arrayBuffer();
    const ext = this.getFileExtension(contentPath, contentRes.headers.get('content-type'), null);
    const filePath = path.join(extractDir, `${contentId}${ext}`);
    fs.writeFileSync(filePath, Buffer.from(contentBuffer));
    console.log(`Saved: ${contentId}${ext} (${(contentBuffer.byteLength / 1024).toFixed(2)} KB)`);
  }

  getFileExtension(url, contentType, fallbackType) {
    const urlExt = path.extname(new URL(url).pathname).toLowerCase();
    if (urlExt && urlExt.length > 1) return urlExt;
    
    const typeMap = {
      'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/svg+xml': '.svg', 'image/gif': '.gif', 'image/webp': '.webp',
      'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
      'audio/mpeg': '.mp3', 'audio/mp3': '.mp3',
      'application/pdf': '.pdf',
      'application/vnd.ms-powerpoint': '.ppt', 'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
      'application/x-dsapp': '.dsapp', 'application/octet-stream': '.dsapp',
      'text/html': '.html', 'application/xhtml+xml': '.html',
      'font/ttf': '.ttf', 'application/x-font-ttf': '.ttf', 'font/opentype': '.otf', 'application/x-font-opentype': '.otf',
      'application/json': '.json', 'text/json': '.json', 'application/xml': '.xml', 'text/xml': '.xml'
    };
    
    if (contentType && typeMap[contentType.split(';')[0].trim()]) {
      return typeMap[contentType.split(';')[0].trim()];
    }
    
    if (fallbackType === 'Image') return '.jpg';
    if (fallbackType === 'Video') return '.mp4';
    if (fallbackType === 'App') return '.dsapp';
    
    return '.mp4';
  }

  cleanupOldVersions(channelId, currentVersion) {
    try {
      const files = fs.readdirSync(this.contentDir);
      const currentChannelPrefix = `${channelId}.${currentVersion}`;
      
      files.forEach(file => {
        if (file.startsWith(currentChannelPrefix)) return;
        
        const fullPath = path.join(this.contentDir, file);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory() && file.match(/^.+\.\d+$/)) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          console.log(`Removed old channel: ${file}`);
        } else if (file.endsWith('.zip') && file.match(/^.+\.\d+\.zip$/)) {
          fs.unlinkSync(fullPath);
          console.log(`Deleted old channel ZIP: ${file}`);
        }
      });
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }
  }

  updateCurrentChannelTracker(channelInfo) {
    const trackerPath = path.join(this.contentDir, 'current-channel.json');
    fs.writeFileSync(trackerPath, JSON.stringify(channelInfo, null, 2));
    console.log(`Updated current channel tracker: ${channelInfo.name}`);
  }

  getApiBase(environment) {
    const endpoints = {
      'dev': 'https://api-cloudtest1.fwi-dev.com',
      'staging': 'https://api-staging.fwi-dev.com',
      'prod': 'https://api.fwicloud.com',
      'prod-eu': 'https://api.eu1.fwicloud.com',
      'prod-ap': 'https://api.ap1.fwicloud.com'
    };
    return endpoints[environment] || endpoints['dev'];
  }
}

module.exports = ChannelManager;