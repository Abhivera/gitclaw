import simpleGit from 'simple-git'
import fs from 'fs'
import path from 'path'

export class GitService {
  repoExists(repoPath: string): boolean {
    try {
      return (
        fs.existsSync(repoPath) &&
        fs.existsSync(path.join(repoPath, '.git'))
      )
    } catch {
      return false
    }
  }

  async cloneRepo(
    cleanCloneUrl: string,
    authCloneUrl: string,
    destPath: string,
    onProgress?: (stage: string) => void,
  ): Promise<void> {
    const parentDir = path.dirname(destPath)
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true })
    }

    const git = simpleGit()

    onProgress?.('cloning')

    await git.clone(authCloneUrl, destPath, ['--progress'])

    const repoGit = simpleGit(destPath)
    await repoGit.remote(['set-url', 'origin', cleanCloneUrl])

    const branches = await repoGit.branch(['-r'])

    for (const branchPath of branches.all) {
      if (branchPath.includes('HEAD')) continue
      const localName = branchPath.replace(/^origin\//, '')
      try {
        await repoGit.checkout(['-b', localName, branchPath])
      } catch {
        // Branch may already exist (e.g. main/master), skip
      }
    }

    const defaultBranch = branches.all.find(
      (b) => b === 'origin/main' || b === 'origin/master',
    )
    if (defaultBranch) {
      await repoGit.checkout(defaultBranch.replace(/^origin\//, ''))
    }
  }

  async updateRepo(
    repoPath: string,
    cleanCloneUrl: string,
    authCloneUrl: string,
    onProgress?: (stage: string) => void,
  ): Promise<void> {
    const git = simpleGit(repoPath)

    onProgress?.('updating')

    await git.remote(['set-url', 'origin', authCloneUrl])

    await git.fetch(['--all', '--prune', '--progress'])

    const currentBranch = (await git.branch()).current

    try {
      await git.pull('origin', currentBranch, ['--ff-only'])
    } catch {
      // ff-only may fail if diverged, that's ok for backup
    }

    const branches = await git.branch(['-r'])
    const localBranches = await git.branchLocal()

    for (const branchPath of branches.all) {
      if (branchPath.includes('HEAD')) continue
      const localName = branchPath.replace(/^origin\//, '')
      if (!localBranches.all.includes(localName)) {
        try {
          await git.checkout(['-b', localName, branchPath])
        } catch {
          // skip if fails
        }
      }
    }

    if (currentBranch) {
      await git.checkout(currentBranch)
    }

    await git.remote(['set-url', 'origin', cleanCloneUrl])
  }

  async cloneOrUpdate(
    cleanCloneUrl: string,
    repoPath: string,
    authCloneUrl: string,
    onProgress?: (stage: string) => void,
  ): Promise<'cloned' | 'updated'> {
    if (this.repoExists(repoPath)) {
      await this.updateRepo(repoPath, cleanCloneUrl, authCloneUrl, onProgress)
      return 'updated'
    } else {
      await this.cloneRepo(cleanCloneUrl, authCloneUrl, repoPath, onProgress)
      return 'cloned'
    }
  }
}
