import { ipcMain } from 'electron'
import { IPC } from '../utils/constants'
import { GitService } from '../services/git.service'

const gitService = new GitService()

export function registerGitHandlers() {
  ipcMain.handle(
    IPC.GIT_CLONE,
    async (_event, cleanCloneUrl: string, destPath: string, authCloneUrl: string) => {
      try {
        const result = await gitService.cloneOrUpdate(cleanCloneUrl, destPath, authCloneUrl)
        return { success: true, action: result }
      } catch (err: any) {
        return { success: false, message: err.message }
      }
    },
  )

  ipcMain.handle(
    IPC.GIT_PULL,
    async (_event, repoPath: string, cleanCloneUrl: string, authCloneUrl: string) => {
      try {
        await gitService.updateRepo(repoPath, cleanCloneUrl, authCloneUrl)
        return { success: true }
      } catch (err: any) {
        return { success: false, message: err.message }
      }
    },
  )
}
