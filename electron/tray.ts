import { Tray, Menu, app, BrowserWindow, nativeImage } from 'electron'
import fs from 'fs'
import path from 'path'

const APP_LABEL = 'GitClaw'

function resolveTrayIconPath(): string | undefined {
  const candidates = [
    path.join(__dirname, '../dist/icon.png'),
    path.join(__dirname, '../public/icon.png'),
    path.join(app.getAppPath(), 'dist/icon.png'),
    path.join(app.getAppPath(), 'public/icon.png'),
    path.join(process.resourcesPath || '', 'icon.png'),
  ]
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p
  }
  return undefined
}

function loadTrayIcon(): Electron.NativeImage {
  const iconPath = resolveTrayIconPath()
  if (iconPath) {
    const img = nativeImage.createFromPath(iconPath)
    if (!img.isEmpty()) {
      const size = process.platform === 'win32' ? 16 : 22
      return img.resize({ width: size, height: size })
    }
  }
  return nativeImage.createEmpty()
}

let tray: Tray | null = null

export function createTray(mainWindow: BrowserWindow) {
  const icon = loadTrayIcon()
  tray = new Tray(icon)
  tray.setToolTip(APP_LABEL)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `Open ${APP_LABEL}`,
      click: () => mainWindow.show(),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        ;(app as any).isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    mainWindow.show()
  })
}

export function updateTrayMenu(mainWindow: BrowserWindow, nextRun?: string) {
  if (!tray) return

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `Open ${APP_LABEL}`,
      click: () => mainWindow.show(),
    },
    ...(nextRun
      ? [{ label: `Next backup: ${nextRun}`, enabled: false } as Electron.MenuItemConstructorOptions]
      : []),
    { type: 'separator' as const },
    {
      label: 'Quit',
      click: () => {
        ;(app as any).isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)
}
