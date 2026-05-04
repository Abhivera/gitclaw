import { app, BrowserWindow, shell } from 'electron'
import fs from 'fs'
import path from 'path'
import { registerAllHandlers } from './ipc'
import { createTray } from './tray'

app.setName('GitClaw')

process.env.DIST_ELECTRON = path.join(__dirname)
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(__dirname, '../public')
  : process.env.DIST

let mainWindow: BrowserWindow | null = null

function resolveWindowIconPath(): string | undefined {
  const candidates = [
    path.join(__dirname, '../dist/icon.png'),
    path.join(__dirname, '../public/icon.png'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return undefined
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    title: 'GitClaw',
    icon: resolveWindowIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(process.env.DIST!, 'index.html'))
  }

  mainWindow.on('close', (e) => {
    if (!(app as any).isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()
  registerAllHandlers(mainWindow!)
  createTray(mainWindow!)
})

app.on('before-quit', () => {
  ;(app as any).isQuitting = true
})

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show()
  } else {
    createWindow()
  }
})

export function getMainWindow() {
  return mainWindow
}
