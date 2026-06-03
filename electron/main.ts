import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { engine } from './clicker/engine'
import type { Settings } from './shared/types'

let win: BrowserWindow | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 460,
    height: 680,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    hasShadow: false,
    roundedCorners: true,
    thickFrame: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('ready-to-show', () => win?.show())

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpc() {
  ipcMain.handle('settings:get', () => engine.getSettings())
  ipcMain.handle('settings:save', (_e, s: Settings) => engine.saveSettings(s))
  ipcMain.handle('clicker:start', () => engine.start())
  ipcMain.handle('clicker:stop', () => engine.stop())
  ipcMain.handle('clicker:toggle', () => engine.toggle())
  ipcMain.handle('bind:capture', (_e, slot: 'start' | 'hold') => engine.captureBind(slot))
  ipcMain.handle('bind:cancel', () => engine.cancelCapture())
  ipcMain.handle('window:minimize', () => win?.minimize())
  ipcMain.handle('window:close', () => win?.close())
  ipcMain.handle('window:toggle-pin', () => {
    if (!win) return false
    const next = !win.isAlwaysOnTop()
    win.setAlwaysOnTop(next)
    return next
  })

  engine.on('state', (state) => {
    win?.webContents.send('state:change', state)
  })
}

app.whenReady().then(() => {
  registerIpc()
  engine.init()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  engine.shutdown()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  engine.shutdown()
})
