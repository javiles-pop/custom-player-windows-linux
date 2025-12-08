const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function startNodeServer() {
  const isDev = !app.isPackaged;
  const serverPath = isDev 
    ? path.join(__dirname, 'server.js')
    : path.join(process.resourcesPath, 'server.bundle.js');
  
  console.log('=== Node Server Startup ===');
  console.log('isDev:', isDev);
  console.log('__dirname:', __dirname);
  console.log('process.resourcesPath:', process.resourcesPath);
  console.log('serverPath:', serverPath);
  console.log('Server exists:', require('fs').existsSync(serverPath));
  console.log('process.execPath:', process.execPath);
  
  // Use Electron's embedded Node runtime
  serverProcess = spawn(process.execPath, [serverPath], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { 
      ...process.env, 
      ELECTRON_RUN_AS_NODE: '1' // Run as Node.js instead of Electron
    }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log('[Server]', data.toString().trim());
  });

  serverProcess.stderr.on('data', (data) => {
    console.error('[Server Error]', data.toString().trim());
  });

  serverProcess.on('error', (err) => {
    console.error('[Server Failed]', err);
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`[Server Exit] code: ${code}, signal: ${signal}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the app from dist folder
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // Open DevTools
  mainWindow.webContents.openDevTools();

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  startNodeServer();
  
  // Wait a moment for server to start
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
