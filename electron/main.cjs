const { app, BrowserWindow, Menu, shell, dialog, session } = require('electron');
const fs = require('fs');
const net = require('net');
const path = require('path');
const { pathToFileURL } = require('url');
const { isSameOrigin } = require('./navigation.cjs');

const PREFERRED_PORT = 47287;
const HOST = '127.0.0.1';

function isFree(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => probe.close(() => resolve(true)));
    probe.listen(port, HOST);
  });
}

async function pickPort() {
  for (let port = PREFERRED_PORT; port < PREFERRED_PORT + 20; port++) {
    if (await isFree(port)) return port;
  }
  throw new Error('No free local port for HATS');
}

function resolveLibraryDir(fallbackDir) {
  const candidates = [path.join(app.getPath('documents'), 'HATS'), path.join(fallbackDir, 'library')];
  for (const dir of candidates) {
    try {
      fs.mkdirSync(path.join(dir, 'Imported'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'Exports'), { recursive: true });
      return dir;
    } catch {
    }
  }
  throw new Error('HATS could not create a folder for your themes');
}

async function startServer() {
  const dataDir = path.join(app.getPath('userData'), 'hats-data');
  fs.mkdirSync(dataDir, { recursive: true });
  const libraryDir = resolveLibraryDir(dataDir);
  const port = await pickPort();

  process.env.HATS_STANDALONE = 'true';
  process.env.HATS_ENABLE_LIVE_PREVIEW = 'true';
  process.env.HA_CONFIG_DIR = dataDir;
  process.env.HATS_LIBRARY_DIR = libraryDir;
  process.env.INGRESS_PORT = String(port);

  await import(pathToFileURL(path.join(__dirname, '..', 'server', 'index.js')).href);
  return { port, dataDir, libraryDir };
}

function buildMenu(libraryDir) {
  const template = [
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'Open HATS Folder', click: () => shell.openPath(libraryDir) },
        { label: 'Open Exports Folder', click: () => shell.openPath(path.join(libraryDir, 'Exports')) },
        { label: 'Open Imported Themes Folder', click: () => shell.openPath(path.join(libraryDir, 'Imported')) },
        { type: 'separator' },
        process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow(port) {
  const origin = `http://${HOST}:${port}`;
  const win = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#020617',
    title: 'HATS',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!isSameOrigin(url, origin)) {
      event.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });

  win.loadURL(origin);
  return win;
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let mainWindow = null;

  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    try {
      const { port, libraryDir } = await startServer();
      buildMenu(libraryDir);
      session.defaultSession.on('will-download', (_event, item) => {
        const name = path.basename(item.getFilename() || 'theme.zip');
        item.setSaveDialogOptions({ defaultPath: path.join(libraryDir, 'Exports', name) });
      });
      mainWindow = createWindow(port);
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow(port);
      });
    } catch (err) {
      dialog.showErrorBox('HATS could not start', String(err && err.message ? err.message : err));
      app.quit();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
