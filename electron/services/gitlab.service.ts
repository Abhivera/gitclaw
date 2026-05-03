import type { RepoInfo, RepoFilterSet } from '../src/types'

function normalizeBaseUrl(raw: string): string {
  const t = (raw || 'https://gitlab.com').trim().replace(/\/+$/, '')
  return t || 'https://gitlab.com'
}

interface GitLabUser {
  id: number
  username: string
  name: string
  avatar_url: string
  web_url: string
}

interface GitLabProject {
  id: number
  name: string
  path_with_namespace: string
  http_url_to_repo: string
  visibility: string
  forked_from_project?: { id: number }
  namespace: { kind: 'user' | 'group'; path: string; full_path: string }
  description: string | null
  last_activity_at: string
  statistics?: { repository_size?: number }
}

export class GitLabService {
  private baseUrl: string
  private token: string

  constructor(token: string, gitlabBaseUrl?: string) {
    this.token = token
    this.baseUrl = normalizeBaseUrl(gitlabBaseUrl || '')
  }

  private api(path: string): string {
    const p = path.startsWith('/') ? path : `/${path}`
    return `${this.baseUrl}/api/v4${p}`
  }

  private headers(): HeadersInit {
    return {
      'PRIVATE-TOKEN': this.token,
      'Content-Type': 'application/json',
    }
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
      const res = await fetch(this.api('/user'), { headers: this.headers() })
      if (!res.ok) {
        const text = await res.text()
        return { valid: false, error: text || res.statusText || `HTTP ${res.status}` }
      }
      const data = (await res.json()) as GitLabUser
      return {
        valid: true,
        user: data.username,
        name: data.name || data.username,
        avatarUrl: data.avatar_url,
        profileUrl: data.web_url,
        scopes: undefined,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return { valid: false, error: message }
    }
  }

  private async *paginateProjects(searchParams: string): AsyncGenerator<GitLabProject[]> {
    let page = 1
    for (;;) {
      const url = `${this.api('/projects')}?${searchParams}&per_page=100&page=${page}`
      const res = await fetch(url, { headers: this.headers() })
      if (!res.ok) {
        throw new Error((await res.text()) || res.statusText || `HTTP ${res.status}`)
      }
      const batch = (await res.json()) as GitLabProject[]
      if (!batch.length) break
      yield batch
      if (batch.length < 100) break
      page += 1
    }
  }

  async fetchRepos(filters: RepoFilterSet): Promise<RepoInfo[]> {
    const userRes = await fetch(this.api('/user'), { headers: this.headers() })
    if (!userRes.ok) {
      throw new Error((await userRes.text()) || userRes.statusText)
    }
    const user = (await userRes.json()) as GitLabUser
    const repoMap = new Map<string, RepoInfo>()

    const mapProject = (p: GitLabProject, source: RepoInfo['source']): RepoInfo => {
      const parts = p.path_with_namespace.split('/')
      const name = parts.pop() || p.name
      const owner = parts.join('/') || user.username
      const sizeKb = p.statistics?.repository_size
        ? Math.ceil(p.statistics.repository_size / 1024)
        : 0
      return {
        id: String(p.id),
        name,
        fullName: p.path_with_namespace,
        cloneUrl: p.http_url_to_repo,
        isPrivate: p.visibility === 'private',
        isFork: Boolean(p.forked_from_project),
        owner,
        description: p.description,
        updatedAt: p.last_activity_at || new Date().toISOString(),
        size: sizeKb,
        source,
      }
    }

    const isPersonalOwned = (p: GitLabProject) =>
      !p.forked_from_project && p.namespace.kind === 'user' && p.namespace.path === user.username

    const isFork = (p: GitLabProject) => Boolean(p.forked_from_project)

    const isOrg = (p: GitLabProject) => p.namespace.kind === 'group'

    const isCollaborator = (p: GitLabProject) =>
      p.namespace.kind === 'user' && p.namespace.path !== user.username && !p.forked_from_project

    if (filters.owned) {
      for await (const batch of this.paginateProjects('membership=true')) {
        for (const p of batch) {
          if (isPersonalOwned(p) && !repoMap.has(String(p.id))) {
            repoMap.set(String(p.id), mapProject(p, 'owned'))
          }
        }
      }
    }

    if (filters.forked) {
      for await (const batch of this.paginateProjects('membership=true')) {
        for (const p of batch) {
          if (isFork(p) && !repoMap.has(String(p.id))) {
            repoMap.set(String(p.id), mapProject(p, 'forked'))
          }
        }
      }
    }

    if (filters.organization) {
      for await (const batch of this.paginateProjects('membership=true')) {
        for (const p of batch) {
          if (isOrg(p) && !repoMap.has(String(p.id))) {
            repoMap.set(String(p.id), mapProject(p, 'org'))
          }
        }
      }
    }

    if (filters.collaborator) {
      for await (const batch of this.paginateProjects('membership=true')) {
        for (const p of batch) {
          if (isCollaborator(p) && !repoMap.has(String(p.id))) {
            repoMap.set(String(p.id), mapProject(p, 'collaborator'))
          }
        }
      }
    }

    if (filters.starred) {
      for await (const batch of this.paginateProjects('starred=true')) {
        for (const p of batch) {
          if (!repoMap.has(String(p.id))) {
            repoMap.set(String(p.id), mapProject(p, 'starred'))
          }
        }
      }
    }

    return Array.from(repoMap.values()).sort((a, b) => a.fullName.localeCompare(b.fullName))
  }
}
