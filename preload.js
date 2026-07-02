const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openExcelFile: () => ipcRenderer.invoke('dialog:open-excel-file'),
  readExcelFile: (filePath) => ipcRenderer.invoke('excel:read-file', filePath),
  saveExcelFile: (data) => ipcRenderer.invoke('excel:save-file', data),
});