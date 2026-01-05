const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.invoke('win:minimize'),
  maximize: () => ipcRenderer.invoke('win:maximize'),
  close: () => ipcRenderer.invoke('win:close')
})

contextBridge.exposeInMainWorld('fileSystem', {
  selectFiles: () => ipcRenderer.invoke('file:select'),
  listFiles: () => ipcRenderer.invoke('file:list'),
  getFilePath: (fileName) => ipcRenderer.invoke('file:getPath', fileName),
  saveData: (data) => ipcRenderer.invoke('data:save', data),
  loadData: () => ipcRenderer.invoke('data:load')
})