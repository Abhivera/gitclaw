import store from '../store/store'
import type { AppSettings, GitProvider } from '../src/types'

function normalizeSelectedRepoIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((id) => String(id))
}

/** Read persisted store fields (repo ids normalized to strings). */
export function getHydratedAppSettings(): AppSettings {
  const gitToken = String(store.get('gitToken') ?? '').trim()

  const rawProvider = store.get('gitProvider') as GitProvider | undefined
  const gitProvider: GitProvider =
    rawProvider === 'gitlab' || rawProvider === 'bitbucket' || rawProvider === 'github'
      ? rawProvider
      : 'github'

  return {
    gitProvider,
    gitToken,
    gitlabBaseUrl: (store.get('gitlabBaseUrl') as string) || 'https://gitlab.com',
    bitbucketUsername: (store.get('bitbucketUsername') as string) || '',
    backupPath: store.get('backupPath'),
    repoFilters: store.get('repoFilters'),
    selectedRepoIds: normalizeSelectedRepoIds(store.get('selectedRepoIds')),
    schedule: store.get('schedule'),
    concurrencyLimit: store.get('concurrencyLimit'),
  }
}
