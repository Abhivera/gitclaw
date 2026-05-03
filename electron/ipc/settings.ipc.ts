import { ipcMain, dialog } from 'electron'
import { IPC } from '../utils/constants'
import store from '../store/store'
import { getHydratedAppSettings } from '../utils/app-settings'

export function registerSettingsHandlers() {
  ipcMain.handle(IPC.SETTINGS_GET, () => {
    return getHydratedAppSettings()
  })

  ipcMain.handle(IPC.SETTINGS_SET, (_event, settings: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(settings)) {
      if (key === 'githubToken' && value != null && String(value).length > 0) {
        store.set('gitToken', String(value))
        store.set('githubToken', '')
        continue
      }
      if (key === 'selectedRepoIds' && Array.isArray(value)) {
        store.set(
          'selectedRepoIds',
          value.map((id) => String(id)) as unknown as string[],
        )
        continue
      }
      // Dynamic keys from renderer match persisted schema
      ;(store as { set: (k: string, v: unknown) => void }).set(key, value)
    }
    return true
  })

  ipcMain.handle(IPC.DIALOG_SELECT_FOLDER, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Backup Folder',
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })
}
