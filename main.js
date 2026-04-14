'use strict';

const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width:     1280,
    height:    800,
    minWidth:  1024,
    minHeight: 700,
    frame:     false,
    fullscreen: true,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0c0f',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // No native menu bar
  Menu.setApplicationMenu(null);

  win.loadFile('index.html');

  // F11 — fullscreen toggle
  win.webContents.on('before-input-event', (_ev, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      win.setFullScreen(!win.isFullScreen());
    }
  });

  // Prevent any external navigation
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (ev, url) => {
    if (url !== win.webContents.getURL()) ev.preventDefault();
  });

  win.on('closed', () => { win = null; });
}

// ── IPC HANDLERS ──────────────────────────────────────────────
ipcMain.on('win-minimize',   () => win?.minimize());
ipcMain.on('win-maximize',   () => win?.isMaximized() ? win.unmaximize() : win.maximize());
ipcMain.on('win-close',      () => win?.close());
ipcMain.on('win-fullscreen', () => win?.setFullScreen(!win.isFullScreen()));

ipcMain.handle('win-set-size', (_ev, w, h) => {
  if (win) { win.setSize(w, h, true); win.center(); }
});

ipcMain.handle('win-is-maximized', () => win?.isMaximized() ?? false);

// ── APP LIFECYCLE ─────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
