import { ipcMain, BrowserWindow } from 'electron'
import { IPC } from '../utils/constants'
import { SchedulerService } from '../services/scheduler.service'
import { BackupOrchestrator } from '../services/backup-orchestrator'
import { fetchRemoteRepos } from '../services/remote-repos.facade'
import { updateTrayMenu } from '../tray'
import { getHydratedAppSettings } from '../utils/app-settings'
import store from '../store/store'
import type { ScheduleConfig } from '../src/types'

const scheduler = new SchedulerService()

export function registerSchedulerHandlers(mainWindow: BrowserWindow) {
  scheduler.setTrigger(async () => {
    const settings = getHydratedAppSettings()

    if (!settings.gitToken || !settings.backupPath) return
    if (settings.gitProvider === 'bitbucket' && !settings.bitbucketUsername.trim()) return

    try {
      let repos = await fetchRemoteRepos(settings.gitProvider, settings.gitToken, settings.repoFilters, {
        gitlabBaseUrl: settings.gitlabBaseUrl,
        bitbucketUsername: settings.bitbucketUsername,
      })

      if (settings.selectedRepoIds.length > 0) {
        const selectedSet = new Set(settings.selectedRepoIds)
        repos = repos.filter((r) => selectedSet.has(r.id))
      }

      if (repos.length === 0) return

      const orchestrator = new BackupOrchestrator()

      orchestrator.on('progress', (status) => {
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send(IPC.BACKUP_PROGRESS, status)
        }
      })

      orchestrator.on('log', (entry) => {
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send(IPC.BACKUP_LOG, entry)
        }
      })

      orchestrator.on('complete', (summary) => {
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send(IPC.BACKUP_COMPLETE, summary)
        }
      })

      await orchestrator.run(repos, settings)
    } catch (err) {
      console.error('Scheduled backup failed:', err)
    }
  })

  const currentSchedule = store.get('schedule')
  if (currentSchedule.enabled) {
    scheduler.start(currentSchedule)
    updateTrayMenu(mainWindow, scheduler.getNextRun(currentSchedule) || undefined)
  }

  ipcMain.handle(IPC.SCHEDULE_GET, () => {
    return getHydratedAppSettings().schedule
  })

  ipcMain.handle(IPC.SCHEDULE_SET, (_event, schedule: ScheduleConfig) => {
    store.set('schedule', schedule)
    scheduler.start(schedule)
    updateTrayMenu(mainWindow, scheduler.getNextRun(schedule) || undefined)
    return true
  })
}
