import { Octokit } from '@octokit/rest'
import type { RepoInfo, RepoFilterSet } from '../src/types'

export class GitHubService {
  private octokit: Octokit

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
      throttle: {
        onRateLimit: (retryAfter: number, options: any) => {
          console.warn(`Rate limit hit for ${options.url}, retrying after ${retryAfter}s`)
          return true
        },
        onSecondaryRateLimit: (_retryAfter: number, options: any) => {
          console.warn(`Secondary rate limit hit for ${options.url}`)
          return true
        },
      },
    })
  }

  async validateToken(): Promise<{
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
    try {
      const { data, headers } = await this.octokit.rest.users.getAuthenticated()
      const scopes = (headers['x-oauth-scopes'] || '').split(',').map((s: string) => s.trim())
      return {
        valid: true,
        user: data.login,
        name: data.name || data.login,
        avatarUrl: data.avatar_url,
        profileUrl: data.html_url,
        publicRepos: data.public_repos,
        privateRepos: data.total_private_repos ?? 0,
        scopes,
      }
    } catch (err: any) {
      return { valid: false, error: err.message }
    }
  }

  async fetchRepos(filters: RepoFilterSet): Promise<RepoInfo[]> {
    const repoMap = new Map<string, RepoInfo>()

    if (filters.owned) {
      const repos = await this.octokit.paginate(this.octokit.rest.repos.listForAuthenticatedUser, {
        type: 'owner',
        per_page: 100,
      })
      for (const repo of repos) {
        if (!repo.fork) {
          repoMap.set(String(repo.id), this.mapRepo(repo, 'owned'))
        }
      }
    }

    if (filters.forked) {
      const repos = await this.octokit.paginate(this.octokit.rest.repos.listForAuthenticatedUser, {
        type: 'owner',
        per_page: 100,
      })
      for (const repo of repos) {
        if (repo.fork && !repoMap.has(String(repo.id))) {
          repoMap.set(String(repo.id), this.mapRepo(repo, 'forked'))
        }
      }
    }

    if (filters.organization) {
      const repos = await this.octokit.paginate(this.octokit.rest.repos.listForAuthenticatedUser, {
        type: 'all',
        per_page: 100,
      })
      for (const repo of repos) {
        if (repo.owner?.type === 'Organization' && !repoMap.has(String(repo.id))) {
          repoMap.set(String(repo.id), this.mapRepo(repo, 'org'))
        }
      }
    }

    if (filters.collaborator) {
      const repos = await this.octokit.paginate(this.octokit.rest.repos.listForAuthenticatedUser, {
        type: 'member',
        per_page: 100,
      })
      for (const repo of repos) {
        if (!repoMap.has(String(repo.id))) {
          repoMap.set(String(repo.id), this.mapRepo(repo, 'collaborator'))
        }
      }
    }

    if (filters.starred) {
      const repos = await this.octokit.paginate(this.octokit.rest.activity.listReposStarredByAuthenticatedUser, {
        per_page: 100,
      })
      for (const repo of repos) {
        if (!repoMap.has(String(repo.id))) {
          repoMap.set(String(repo.id), this.mapRepo(repo, 'starred'))
        }
      }
    }

    return Array.from(repoMap.values()).sort((a, b) => a.fullName.localeCompare(b.fullName))
  }

  private mapRepo(repo: any, source: RepoInfo['source']): RepoInfo {
    return {
      id: String(repo.id),
      name: repo.name,
      fullName: repo.full_name,
      cloneUrl: repo.clone_url,
      isPrivate: repo.private,
      isFork: repo.fork,
      owner: repo.owner?.login || '',
      description: repo.description,
      updatedAt: repo.updated_at,
      size: repo.size || 0,
      source,
    }
  }
}
