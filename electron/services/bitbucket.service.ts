import type { RepoInfo, RepoFilterSet } from '../src/types'

const API = 'https://api.bitbucket.org/2.0'

interface BbUser {
  uuid: string
  username: string
  display_name: string
  links: { avatar?: { href: string }; html?: { href: string } }
}

interface BbRepo {
  uuid: string
  slug: string
  full_name: string
  name: string
  description: string | null
  is_private: boolean
  parent?: { uuid: string }
  links: { clone?: Array<{ name: string; href: string }> }
  owner: { uuid: string; username?: string }
  workspace?: { slug: string; type?: string }
  updated_on: string
  size?: number
}

interface BbPage<T> {
  values: T[]
  next?: string
}

export class BitbucketService {
  private authHeader: string

  constructor(username: string, appPassword: string) {
    const u = (username || '').trim()
    const p = (appPassword || '').trim()
    this.authHeader = `Basic ${Buffer.from(`${u}:${p}`, 'utf8').toString('base64')}`
  }

  private headers(): HeadersInit {
    return { Authorization: this.authHeader, Accept: 'application/json' }
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
      const res = await fetch(`${API}/user`, { headers: this.headers() })
      if (!res.ok) {
        const text = await res.text()
        return { valid: false, error: text || res.statusText || `HTTP ${res.status}` }
      }
      const data = (await res.json()) as BbUser
      return {
        valid: true,
        user: data.username,
        name: data.display_name || data.username,
        avatarUrl: data.links?.avatar?.href,
        profileUrl: data.links?.html?.href,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return { valid: false, error: message }
    }
  }

  private async fetchPage<T>(url: string): Promise<BbPage<T>> {
    const res = await fetch(url, { headers: this.headers() })
    if (!res.ok) {
      throw new Error((await res.text()) || res.statusText || `HTTP ${res.status}`)
    }
    return (await res.json()) as BbPage<T>
  }

  private async *paginate<T>(firstUrl: string): AsyncGenerator<T[]> {
    let next: string | null = firstUrl
    while (next) {
      const page: BbPage<T> = await this.fetchPage<T>(next)
      if (page.values?.length) yield page.values
      next = page.next || null
    }
  }

  private httpsCloneHref(repo: BbRepo): string {
    const clones = repo.links?.clone || []
    const https = clones.find((c) => c.name === 'https')
    return https?.href || `https://bitbucket.org/${repo.full_name}.git`
  }

  private stableId(repo: BbRepo): string {
    return repo.uuid.replace(/[{}]/g, '')
  }

  async fetchRepos(filters: RepoFilterSet): Promise<RepoInfo[]> {
    const userRes = await fetch(`${API}/user`, { headers: this.headers() })
    if (!userRes.ok) {
      throw new Error((await userRes.text()) || userRes.statusText)
    }
    const me = (await userRes.json()) as BbUser
    const myUuid = me.uuid

    const byUuid = new Map<string, BbRepo>()

    for await (const workspaces of this.paginate<{ slug: string }>(
      `${API}/workspaces?role=member&pagelen=100`,
    )) {
      for (const ws of workspaces) {
        const slug = ws.slug
        for await (const repos of this.paginate<BbRepo>(
          `${API}/repositories/${encodeURIComponent(slug)}?pagelen=100`,
        )) {
          for (const r of repos) {
            byUuid.set(r.uuid, r)
          }
        }
      }
    }

    if (byUuid.size === 0) {
      for await (const repos of this.paginate<BbRepo>(
        `${API}/repositories/${encodeURIComponent(me.username)}?pagelen=100`,
      )) {
        for (const r of repos) {
          byUuid.set(r.uuid, r)
        }
      }
    }

    const repoMap = new Map<string, RepoInfo>()

    const mapRepo = (r: BbRepo, source: RepoInfo['source']): RepoInfo => {
      const [owner, name] = r.full_name.includes('/')
        ? (() => {
            const i = r.full_name.indexOf('/')
            return [r.full_name.slice(0, i), r.full_name.slice(i + 1)]
          })()
        : [r.owner.username || '', r.slug]
      const sizeKb = r.size != null ? Math.ceil(r.size / 1024) : 0
      return {
        id: this.stableId(r),
        name: r.slug,
        fullName: r.full_name,
        cloneUrl: this.httpsCloneHref(r),
        isPrivate: r.is_private,
        isFork: Boolean(r.parent),
        owner,
        description: r.description,
        updatedAt: r.updated_on,
        size: sizeKb,
        source,
      }
    }

    const isOwned = (r: BbRepo) => !r.parent && r.owner.uuid === myUuid
    const isFork = (r: BbRepo) => Boolean(r.parent)
    const isOrg = (r: BbRepo) => (r.workspace?.type || '').toLowerCase() === 'team'
    const isCollaborator = (r: BbRepo) =>
      !isOwned(r) && !isFork(r) && !isOrg(r) && r.owner.uuid !== myUuid

    const all = [...byUuid.values()]

    if (filters.owned) {
      for (const r of all) {
        if (isOwned(r) && !repoMap.has(this.stableId(r))) {
          repoMap.set(this.stableId(r), mapRepo(r, 'owned'))
        }
      }
    }
    if (filters.forked) {
      for (const r of all) {
        if (isFork(r) && !repoMap.has(this.stableId(r))) {
          repoMap.set(this.stableId(r), mapRepo(r, 'forked'))
        }
      }
    }
    if (filters.organization) {
      for (const r of all) {
        if (isOrg(r) && !repoMap.has(this.stableId(r))) {
          repoMap.set(this.stableId(r), mapRepo(r, 'org'))
        }
      }
    }
    if (filters.collaborator) {
      for (const r of all) {
        if (isCollaborator(r) && !repoMap.has(this.stableId(r))) {
          repoMap.set(this.stableId(r), mapRepo(r, 'collaborator'))
        }
      }
    }
    // Bitbucket Cloud has no GitHub-style "starred repos" list in the same sense; skip.

    return Array.from(repoMap.values()).sort((a, b) => a.fullName.localeCompare(b.fullName))
  }
}
