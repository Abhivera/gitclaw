import { ipcMain, BrowserWindow } from 'electron'
import { IPC } from '../utils/constants'
import { BackupOrchestrator } from '../services/backup-orchestrator'
import { fetchRemoteRepos } from '../services/remote-repos.facade'
import { getHydratedAppSettings } from '../utils/app-settings'
import type { AppSettings } from '../src/types'

let activeOrchestrator: BackupOrchestrator | null = null

export function registerBackupHandlers(mainWindow: BrowserWindow) {
  ipcMain.handle(IPC.BACKUP_START, async () => {
    if (activeOrchestrator) {
      return { success: false, message: 'Backup already in progress' }
    }

    try {
      const settings: AppSettings = getHydratedAppSettings()

      if (!settings.gitToken || !settings.backupPath) {
        return {
          success: false,
          message: 'Please configure your access token and backup path in Setup',
        }
      }

      if (settings.gitProvider === 'bitbucket' && !settings.bitbucketUsername.trim()) {
        return {
          success: false,
          message: 'Bitbucket requires your username plus an app password',
        }
      }

      let repos = await fetchRemoteRepos(settings.gitProvider, settings.gitToken, settings.repoFilters, {
        gitlabBaseUrl: settings.gitlabBaseUrl,
        bitbucketUsername: settings.bitbucketUsername,
      })

      if (settings.selectedRepoIds.length > 0) {
        const selectedSet = new Set(settings.selectedRepoIds)
        repos = repos.filter((r) => selectedSet.has(r.id))
      }

      if (repos.length === 0) {
        return { success: false, message: 'No repositories to back up' }
      }

      const orchestrator = new BackupOrchestrator()
      activeOrchestrator = orchestrator

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
        activeOrchestrator = null
      })

      orchestrator.run(repos, settings).catch((err) => {
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send(IPC.BACKUP_COMPLETE, {
            totalRepos: repos.length,
            succeeded: 0,
            failed: repos.length,
            skipped: 0,
            duration: 0,
            errors: [{ repoName: 'system', error: err.message }],
          })
        }
        activeOrchestrator = null
      })

      return { success: true, totalRepos: repos.length }
    } catch (err: any) {
      activeOrchestrator = null
      return { success: false, message: err.message }
    }
  })

  ipcMain.handle(IPC.BACKUP_CANCEL, async () => {
    if (activeOrchestrator) {
      activeOrchestrator.cancel()
      activeOrchestrator = null
      return { success: true }
    }
    return { success: false, message: 'No backup in progress' }
  })
}
