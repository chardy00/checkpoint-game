'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron:  true,
  minimize:    ()      => ipcRenderer.send('win-minimize'),
  maximize:    ()      => ipcRenderer.send('win-maximize'),
  close:       ()      => ipcRenderer.send('win-close'),
  fullscreen:  ()      => ipcRenderer.send('win-fullscreen'),
  setSize:     (w, h)  => ipcRenderer.invoke('win-set-size', w, h),
  isMaximized: ()      => ipcRenderer.invoke('win-is-maximized'),
});
