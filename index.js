const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('path')

// 음악 파일 저장 폴더
const musicFolder = path.join(app.getPath('userData'), 'music')

// 음악 폴더가 없으면 생성
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

  // 파일 선택 대화상자
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

    // 선택된 파일들을 music 폴더로 복사
    const copiedFiles = []
    for (const filePath of result.filePaths) {
      try {
        const fileName = path.basename(filePath)
        const destPath = path.join(musicFolder, fileName)
        
        // 파일이 이미 존재하면 덮어쓰지 않음
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

  // 저장된 음악 파일 목록 불러오기
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

  // 파일 경로 가져오기
  ipcMain.handle('file:getPath', (event, fileName) => {
    return path.join(musicFolder, fileName)
  })

  // 데이터 저장
  ipcMain.handle('data:save', async (event, data) => {
    try {
      const dataPath = path.join(app.getPath('userData'), 'playlist.json')
      await fs.promises.writeFile(dataPath, JSON.stringify(data, null, 2))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // 데이터 불러오기
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