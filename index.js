const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('path')

const musicFolder = path.join(app.getPath('userData'), 'music')

if (!fs.existsSync(musicFolder)) {
  fs.mkdirSync(musicFolder, { recursive: true })
}

let mainWindow = null

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    backgroundMaterial: 'acrylic',
    autoHideMenuBar: true,
    icon: 'assets/icon.ico',
    webPreferences: {
      preload: __dirname + '/preload.js',
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow = win

  win.loadFile('index.html')

  ipcMain.handle('win:minimize', () => win.minimize())
  ipcMain.handle('win:maximize', () => {
    win.isMaximized() ? win.unmaximize() : win.maximize()
  })
  ipcMain.handle('win:close', () => win.close())

  ipcMain.handle('file:select', async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'mp4', 'webm'] }
      ]
    })

    if (result.canceled) {
      return { canceled: true }
    }

    const copiedFiles = []
    for (const filePath of result.filePaths) {
      try {
        const fileName = path.basename(filePath)
        const destPath = path.join(musicFolder, fileName)
        
        if (!fs.existsSync(destPath)) {
          await fs.promises.copyFile(filePath, destPath)
        }
        
        copiedFiles.push({
          success: true,
          fileName: fileName,
          path: destPath
        })
      } catch (error) {
        console.error('파일 복사 실패:', error)
        copiedFiles.push({
          success: false,
          error: error.message
        })
      }
    }

    return { canceled: false, files: copiedFiles }
  })

  ipcMain.handle('file:list', async () => {
    try {
      const files = await fs.promises.readdir(musicFolder)
      return files.filter(file => {
        const ext = path.extname(file).toLowerCase()
        return ['.mp3', '.wav', '.ogg', '.m4a', '.mp4', '.webm'].includes(ext)
      })
    } catch (error) {
      return []
    }
  })

  ipcMain.handle('file:getPath', (event, fileName) => {
    return path.join(musicFolder, fileName)
  })

  ipcMain.handle('data:save', async (event, data) => {
    try {
      const dataPath = path.join(app.getPath('userData'), 'playlist.json')
      await fs.promises.writeFile(dataPath, JSON.stringify(data, null, 2))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('data:load', async () => {
    try {
      const dataPath = path.join(app.getPath('userData'), 'playlist.json')
      if (fs.existsSync(dataPath)) {
        const data = await fs.promises.readFile(dataPath, 'utf-8')
        return JSON.parse(data)
      }
      return null
    } catch (error) {
      return null
    }
  })

    ipcMain.handle('delete-file', async (event, fileName) => {
    try {
        const filePath = path.join(musicFolder, fileName); // audioDirectory → musicFolder
        await fs.promises.unlink(filePath);
        return { success: true };
    } catch (error) {
        console.error('파일 삭제 실패:', error);
        return { success: false, error: error.message };
    }
    });
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})