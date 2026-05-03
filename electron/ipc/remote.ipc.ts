import { ipcMain } from 'electron'
import { IPC } from '../utils/constants'
import { validateRemoteToken, fetchRemoteRepos } from '../services/remote-repos.facade'
import type { GitProvider, RepoFilterSet } from '../src/types'

export function registerRemoteHandlers() {
  ipcMain.handle(IPC.REMOTE_VALIDATE_TOKEN, async (_event, payload: unknown) => {
    const p = payload as {
      provider: GitProvider
      token: string
      gitlabBaseUrl?: string
      bitbucketUsername?: string
    }
    return validateRemoteToken({
      provider: p.provider,
      token: p.token,
      gitlabBaseUrl: p.gitlabBaseUrl,
      bitbucketUsername: p.bitbucketUsername,
    })
  })

  ipcMain.handle(IPC.REMOTE_FETCH_REPOS, async (_event, payload: unknown) => {
    const p = payload as {
      provider: GitProvider
      token: string
      filters: RepoFilterSet
      gitlabBaseUrl?: string
      bitbucketUsername?: string
    }
    return fetchRemoteRepos(p.provider, p.token, p.filters, {
      gitlabBaseUrl: p.gitlabBaseUrl,
      bitbucketUsername: p.bitbucketUsername,
    })
  })
}
