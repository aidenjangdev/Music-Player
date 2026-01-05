const { app, BrowserWindow, ipcMain } = require('electron')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,                 // ✅ 타이틀바 완전 제거
    backgroundMaterial: 'acrylic',
    autoHideMenuBar: true,

    webPreferences: {
      preload: __dirname + '/preload.js'
    }
  })

  win.loadFile('index.html')

  ipcMain.handle('win:minimize', () => win.minimize())
  ipcMain.handle('win:maximize', () => {
    win.isMaximized() ? win.unmaximize() : win.maximize()
  })
  ipcMain.handle('win:close', () => win.close())
}

app.whenReady().then(createWindow)
