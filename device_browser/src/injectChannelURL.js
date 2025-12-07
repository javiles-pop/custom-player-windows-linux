// Inject channel URL display into the page
(function() {
  function createURLDisplay() {
    const div = document.createElement('div');
    div.id = 'channel-url-display';
    div.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 40px;
      background-color: #1a1a1a;
      color: #ffffff;
      border-radius: 8px;
      max-width: 80%;
      word-break: break-all;
      font-size: 24px;
      font-family: monospace;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      z-index: 9999;
    `;
    document.body.appendChild(div);
    return div;
  }
  
  let currentChannelURL = '';
  let channelData = null;
  let currentChannelId = '';
  let currentChannelVersion = '';
  
  async function downloadChannel(channelId, versionId, companyId) {
    try {
      const token = window.DeviceAPI.getState().appSettings.token;
      const response = await fetch('http://localhost:3001/channel/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, companyId, token })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      console.log('Channel downloaded:', result.name, result.version);
      currentChannelId = channelId;
      currentChannelVersion = result.version;
      
      return result;
    } catch (error) {
      console.error('Failed to download channel:', error);
      return null;
    }
  }
  
  function updateDisplay(channelURL) {
    currentChannelURL = channelURL;
    let display = document.getElementById('channel-url-display');
    if (!display) {
      display = createURLDisplay();
    }
    
    if (channelURL) {
      display.innerHTML = `<h2 style="margin-top: 0; margin-bottom: 20px; color: #00d4ff;">Current Channel URL:</h2><div style="padding: 20px; background-color: #2a2a2a; border-radius: 4px; font-size: 18px;">${channelURL}</div>`;
    } else {
      display.innerHTML = `<h2 style="margin-top: 0; margin-bottom: 20px; color: #00d4ff;">Current Channel URL:</h2><div style="padding: 20px; background-color: #2a2a2a; border-radius: 4px;">No URL configured</div>`;
    }
    
    checkMenuVisibility();
  }
  
  function checkMenuVisibility() {
    const display = document.getElementById('channel-url-display');
    if (!display) return;
    
    const launchScreen = document.getElementById('launch-screen');
    const menu = document.querySelector('.shim-menu-fullscreen');
    
    if (launchScreen || (menu && menu.classList.contains('active'))) {
      display.style.display = 'none';
    } else {
      display.style.display = 'block';
    }
  }
  
  // Listen for shadow updates and requests via postMessage
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHADOW_UPDATE') {
      updateDisplay(event.data.CurrentURL || '');
    }
    
    if (event.data && event.data.type === 'CHANNEL_ASSIGNED') {
      const { channel, companyId } = event.data;
      console.log('Channel assigned:', channel);
      downloadChannel(channel.id, channel.versionId, companyId);
    }
    
    if (event.data && event.data.type === 'CHANNEL_UPDATE') {
      const { channel, version } = event.data;
      if (channel === currentChannelId && version !== currentChannelVersion) {
        console.log('New channel version:', version);
        const companyId = window.DeviceAPI.getState().fwiCloud.provisionedDevicePayload?.companyId;
        downloadChannel(channel, version, companyId);
      }
    }
    
    if (event.data && event.data.type === 'REQUEST_CHANNEL_URL') {
      window.postMessage({ type: 'SHADOW_UPDATE', CurrentURL: currentChannelURL }, '*');
    }
  });
  
  // Watch for menu open/close and launch screen
  const menuObserver = new MutationObserver(() => {
    checkMenuVisibility();
  });
  
  const bodyObserver = new MutationObserver(() => {
    checkMenuVisibility();
  });
  
  // Start observing when DOM is ready
  setTimeout(() => {
    const menu = document.querySelector('.shim-menu-fullscreen');
    if (menu) {
      menuObserver.observe(menu, { attributes: true, attributeFilter: ['class'] });
    }
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }, 1000);
})();
