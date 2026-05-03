import { EventEmitter } from 'events'
import path from 'path'
import { GitService } from './git.service'
import { CompressService } from './compress.service'
import { buildAuthenticatedCloneUrl } from './git-auth.util'
import { createLimiter } from '../utils/concurrency'
import type {
  RepoInfo,
  AppSettings,
  RepoBackupStatus,
  LogEntry,
  BackupSummary,
} from '../src/types'

export class BackupOrchestrator extends EventEmitter {
  private gitService = new GitService()
  private compressService = new CompressService()
  private cancelled = false
  private lastProgressEmit = 0

  cancel() {
    this.cancelled = true
  }

  private log(level: LogEntry['level'], message: string, repoName?: string) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message: this.sanitizeLog(message),
      repoName,
    }
    this.emit('log', entry)
  }

  private sanitizeLog(message: string): string {
    // Remove any tokens from log messages
    return message.replace(/https:\/\/[^@]+@/g, 'https://***@')
  }

  private emitProgress(status: RepoBackupStatus) {
    const now = Date.now()
    // Throttle progress events to ~10/sec
    if (now - this.lastProgressEmit >= 100 || status.stage === 'done' || status.stage === 'failed') {
      this.emit('progress', status)
      this.lastProgressEmit = now
    }
  }

  async run(repos: RepoInfo[], settings: AppSettings): Promise<BackupSummary> {
    const startTime = Date.now()
    const limit = createLimiter(settings.concurrencyLimit || 5)
    const results: Array<{ repo: RepoInfo; success: boolean; error?: string }> = []

    this.cancelled = false

    const archivesDir = path.join(settings.backupPath, '.archives')

    this.log('info', `Starting backup of ${repos.length} repositories (concurrency: ${settings.concurrencyLimit})`)

    const tasks = repos.map((repo) =>
      limit(async () => {
        if (this.cancelled) {
          results.push({ repo, success: false, error: 'Cancelled' })
          this.emitProgress({
            repoId: repo.id,
            repoName: repo.fullName,
            stage: 'skipped',
            progress: 0,
          })
          return
        }

        const status: RepoBackupStatus = {
          repoId: repo.id,
          repoName: repo.fullName,
          stage: 'pending',
          progress: 0,
          startedAt: Date.now(),
        }

        try {
          const pathSegments = repo.fullName.split('/').filter(Boolean)
          const repoDir = path.join(settings.backupPath, ...pathSegments)

          const action = this.gitService.repoExists(repoDir) ? 'updating' : 'cloning'
          status.stage = action
          status.progress = 10
          this.emitProgress(status)
          this.log('info', `${action === 'cloning' ? 'Cloning' : 'Updating'} ${repo.fullName}`, repo.fullName)

          const authCloneUrl = buildAuthenticatedCloneUrl(
            repo.cloneUrl,
            settings.gitProvider,
            settings.gitToken,
            settings.bitbucketUsername,
          )

          const result = await this.gitService.cloneOrUpdate(
            repo.cloneUrl,
            repoDir,
            authCloneUrl,
          )

          if (this.cancelled) {
            results.push({ repo, success: false, error: 'Cancelled' })
            return
          }

          status.progress = 40
          this.emitProgress(status)
          this.log('info', `${result === 'cloned' ? 'Cloned' : 'Updated'} ${repo.fullName}`, repo.fullName)

          // Step 2: Compress
          status.stage = 'compressing'
          status.progress = 50
          this.emitProgress(status)
          this.log('info', `Compressing ${repo.fullName}`, repo.fullName)

          await this.compressService.compressRepo(repoDir, archivesDir)

          if (this.cancelled) {
            results.push({ repo, success: false, error: 'Cancelled' })
            return
          }

          status.progress = 85
          this.emitProgress(status)

          // Done
          status.stage = 'done'
          status.progress = 100
          status.completedAt = Date.now()
          this.emitProgress(status)
          this.log('info', `Completed ${repo.fullName}`, repo.fullName)
          results.push({ repo, success: true })
        } catch (err: any) {
          status.stage = 'failed'
          status.error = err.message
          status.completedAt = Date.now()
          this.emitProgress(status)
          this.log('error', `Failed ${repo.fullName}: ${err.message}`, repo.fullName)
          results.push({ repo, success: false, error: err.message })
        }
      }),
    )

    await Promise.all(tasks)

    const summary: BackupSummary = {
      totalRepos: repos.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success && r.error !== 'Cancelled').length,
      skipped: results.filter((r) => r.error === 'Cancelled').length,
      duration: Date.now() - startTime,
      errors: results
        .filter((r) => !r.success && r.error !== 'Cancelled')
        .map((r) => ({ repoName: r.repo.fullName, error: r.error! })),
    }

    this.log(
      'info',
      `Backup complete: ${summary.succeeded} succeeded, ${summary.failed} failed, ${summary.skipped} skipped (${(summary.duration / 1000).toFixed(1)}s)`,
    )

    this.emit('complete', summary)
    return summary
  }
}
