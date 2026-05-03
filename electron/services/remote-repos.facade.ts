import type { GitProvider, RepoFilterSet, RepoInfo } from '../src/types'
import { GitHubService } from './github.service'
import { GitLabService } from './gitlab.service'
import { BitbucketService } from './bitbucket.service'

export interface RemoteValidatePayload {
  provider: GitProvider
  token: string
  gitlabBaseUrl?: string
  bitbucketUsername?: string
}

export async function validateRemoteToken(payload: RemoteValidatePayload): Promise<{
  valid: boolean
  user?: string
  name?: string
  avatarUrl?: string
  profileUrl?: string
  publicRepos?: number
  privateRepos?: number
  scopes?: string[]
  error?: string
}> {
  const { provider, token, gitlabBaseUrl, bitbucketUsername } = payload
  switch (provider) {
    case 'github':
      return new GitHubService(token).validateToken()
    case 'gitlab':
      return new GitLabService(token, gitlabBaseUrl).validateToken()
    case 'bitbucket':
      return new BitbucketService(bitbucketUsername || '', token).validateToken()
    default:
      return { valid: false, error: 'Unknown provider' }
  }
}

export async function fetchRemoteRepos(
  provider: GitProvider,
  token: string,
  filters: RepoFilterSet,
  opts: { gitlabBaseUrl?: string; bitbucketUsername?: string },
): Promise<RepoInfo[]> {
  switch (provider) {
    case 'github':
      return new GitHubService(token).fetchRepos(filters)
    case 'gitlab':
      return new GitLabService(token, opts.gitlabBaseUrl).fetchRepos(filters)
    case 'bitbucket':
      return new BitbucketService(opts.bitbucketUsername || '', token).fetchRepos(filters)
    default:
      throw new Error('Unknown provider')
  }
}
