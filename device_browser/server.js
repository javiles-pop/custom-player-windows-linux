const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const os = require('os');
const { execSync } = require('child_process');

const app = express();
const upload = multer();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-FWI-Device-Auth');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const CONTENT_DIR = process.platform === 'win32' 
  ? 'C:\\Users\\Public\\Documents\\Four Winds Interactive\\Content'
  : '/var/lib/fwi/content';

// Ensure directory exists
if (!fs.existsSync(CONTENT_DIR)) {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
}

// Helper: Get file extension from URL or content-type
function getFileExtension(url, contentType, fallbackType) {
  const urlExt = path.extname(new URL(url).pathname).toLowerCase();
  if (urlExt && urlExt.length > 1) return urlExt;
  
  const typeMap = {
    'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp',
    'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov',
    'application/pdf': '.pdf', 'text/html': '.html'
  };
  
  if (contentType && typeMap[contentType.split(';')[0].trim()]) {
    return typeMap[contentType.split(';')[0].trim()];
  }
  
  return fallbackType === 'Image' ? '.jpg' : '.mp4';
}

// Helper: Cleanup old channels and versions
function cleanupOldVersions(channelId, currentVersion) {
  try {
    const files = fs.readdirSync(CONTENT_DIR);
    const currentChannelPrefix = `${channelId}.${currentVersion}`;
    
    files.forEach(file => {
      // Skip if it's the current channel
      if (file.startsWith(currentChannelPrefix)) return;
      
      // Remove any other channel directories or ZIPs
      const fullPath = path.join(CONTENT_DIR, file);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory() && file.match(/^[a-f0-9-]+\.\d+$/)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`Removed old channel: ${file}`);
      } else if (file.endsWith('.zip') && file.match(/^[a-f0-9-]+\.\d+\.zip$/)) {
        fs.unlinkSync(fullPath);
        console.log(`Deleted old channel ZIP: ${file}`);
      }
    });
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
}

app.post('/channel/download', express.json(), async (req, res) => {
  try {
    const { channelId, companyId, token } = req.body;
    
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
    
    const contentResponse = await fetch(downloadInfo.channelUrl);
    if (!contentResponse.ok) {
      throw new Error(`Failed to download ZIP: HTTP ${contentResponse.status}`);
    }
    
    const buffer = await contentResponse.arrayBuffer();
    const filename = `${channelId}.${downloadInfo.version}.zip`;
    const filepath = path.join(CONTENT_DIR, filename);
    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log(`Downloaded: ${filename} (${(buffer.byteLength / 1024).toFixed(2)} KB)`);
    
    // Extract ZIP
    const extractDir = path.join(CONTENT_DIR, `${channelId}.${downloadInfo.version}`);
    const zip = new AdmZip(filepath);
    zip.extractAllTo(extractDir, true);
    console.log(`Extracted to: ${extractDir}`);
    
    // Read channel.json
    const channelJsonPath = path.join(extractDir, 'channel.json');
    if (!fs.existsSync(channelJsonPath)) {
      throw new Error('channel.json not found in ZIP');
    }
    const channelData = JSON.parse(fs.readFileSync(channelJsonPath, 'utf8'));
    
    // Download content files with progress
    const total = channelData.contentList.length;
    for (let i = 0; i < total; i++) {
      const content = channelData.contentList[i];
      console.log(`[${i + 1}/${total}] Downloading: ${content.id}`);
      
      try {
        const contentRes = await fetch(content.url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!contentRes.ok) {
          console.error(`Failed to download ${content.id}: HTTP ${contentRes.status}`);
          continue;
        }
        
        if (content.type === 'Playlist') {
          const playlistJson = await contentRes.json();
          const playlistPath = path.join(extractDir, `${content.id}.json`);
          fs.writeFileSync(playlistPath, JSON.stringify(playlistJson, null, 2));
          console.log(`Saved playlist: ${content.id}.json`);
          
          // Download playlist items
          const items = Array.isArray(playlistJson) ? playlistJson : (playlistJson.items || []);
          for (let j = 0; j < items.length; j++) {
            const item = items[j];
            const itemUrl = item.URL || item.url;
            const urlPath = new URL(itemUrl).pathname;
            const itemId = urlPath.split('/objects/')[1]?.split('/')[0] || `item-${j}`;
            console.log(`  [${j + 1}/${items.length}] Downloading: ${itemId}`);
            
            try {
              const itemRes = await fetch(itemUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (!itemRes.ok) {
                console.error(`Failed: HTTP ${itemRes.status}`);
                continue;
              }
              
              const itemBuffer = await itemRes.arrayBuffer();
              const ext = getFileExtension(itemUrl, itemRes.headers.get('content-type'), item.MimeType || item.type);
              const itemPath = path.join(extractDir, `${itemId}${ext}`);
              fs.writeFileSync(itemPath, Buffer.from(itemBuffer));
              console.log(`  Saved: ${itemId}${ext} (${(itemBuffer.byteLength / 1024).toFixed(2)} KB)`);
            } catch (err) {
              console.error(`Error downloading:`, err.message);
            }
          }
        } else {
          const contentBuffer = await contentRes.arrayBuffer();
          const ext = getFileExtension(content.url, contentRes.headers.get('content-type'), content.type);
          const contentPath = path.join(extractDir, `${content.id}${ext}`);
          fs.writeFileSync(contentPath, Buffer.from(contentBuffer));
          console.log(`Saved: ${content.id}${ext} (${(contentBuffer.byteLength / 1024).toFixed(2)} KB)`);
        }
      } catch (err) {
        console.error(`Error downloading ${content.id}:`, err.message);
      }
    }
    
    // Cleanup old versions
    cleanupOldVersions(channelId, downloadInfo.version);
    
    res.json({ success: true, path: extractDir, version: downloadInfo.version, name: downloadInfo.channelName });
  } catch (error) {
    console.error('Failed to download channel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/channel/save', upload.single('file'), (req, res) => {
  try {
    const { channelId, version } = req.body;
    const filename = `${channelId}.${version}.zip`;
    const filepath = path.join(CONTENT_DIR, filename);
    
    fs.writeFileSync(filepath, req.file.buffer);
    console.log(`Saved channel: ${filename}`);
    
    res.json({ success: true, path: filepath });
  } catch (error) {
    console.error('Failed to save channel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// System info endpoint
app.get('/system/info', (req, res) => {
  try {
    const platform = process.platform;
    let systemInfo = {
      serialNumber: 'UNKNOWN',
      deviceType: platform === 'win32' ? 'Windows' : platform === 'linux' ? 'Linux' : platform,
      makeModel: 'Unknown',
      operatingSystem: 'Unknown',
    };

    if (platform === 'win32') {
      try {
        const wmic = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();
        systemInfo.serialNumber = wmic('wmic bios get serialnumber').split('\n')[1].trim();
        const cpuName = wmic('wmic cpu get name').split('\n')[1].trim();
        const cpuManufacturer = wmic('wmic cpu get manufacturer').split('\n')[1].trim();
        systemInfo.makeModel = `${cpuManufacturer} ${cpuName}`;
        const osCaption = wmic('wmic os get caption').split('\n')[1].trim();
        systemInfo.operatingSystem = osCaption;
      } catch (err) {
        console.error('Error getting Windows system info:', err.message);
      }
    } else if (platform === 'linux') {
      try {
        const exec = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();
        systemInfo.serialNumber = exec('cat /sys/class/dmi/id/product_serial 2>/dev/null || echo UNKNOWN');
        const cpuModel = exec('cat /proc/cpuinfo | grep "model name" | head -1 | cut -d":" -f2').trim();
        systemInfo.makeModel = cpuModel || 'Unknown CPU';
        const osRelease = exec('cat /etc/os-release | grep PRETTY_NAME | cut -d"=" -f2').replace(/"/g, '');
        systemInfo.operatingSystem = osRelease || 'Linux';
      } catch (err) {
        console.error('Error getting Linux system info:', err.message);
      }
    }

    res.json({ success: true, ...systemInfo });
  } catch (error) {
    console.error('Failed to get system info:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Network stub endpoints (not implemented for browser player)
app.get('/network/config', (req, res) => {
  res.json({ 
    success: true, 
    payload: { 
      dnsServerList: [],
      dhcp: true 
    } 
  });
});

app.get('/network/interfaces', (req, res) => {
  res.json({ 
    success: true, 
    payload: { 
      ethernet: { hasLink: false, ipAddressList: [] },
      wifi: { hasLink: false, ipAddressList: [] }
    } 
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Channel server running on port ${PORT}`);
  console.log(`Saving content to: ${CONTENT_DIR}`);
});
