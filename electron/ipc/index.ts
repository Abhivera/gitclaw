import { BrowserWindow } from 'electron'
import { registerSettingsHandlers } from './settings.ipc'
import { registerRemoteHandlers } from './remote.ipc'
import { registerGitHandlers } from './git.ipc'
import { registerBackupHandlers } from './backup.ipc'
import { registerSchedulerHandlers } from './scheduler.ipc'

export function registerAllHandlers(mainWindow: BrowserWindow) {
  registerSettingsHandlers()
  registerRemoteHandlers()
  registerGitHandlers()
  registerBackupHandlers(mainWindow)
  registerSchedulerHandlers(mainWindow)
}
