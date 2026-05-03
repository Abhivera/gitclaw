import store from '../store/store'
import type { AppSettings, GitProvider } from '../src/types'

function normalizeSelectedRepoIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((id) => String(id))
}

/** Read persisted store fields and apply legacy migrations (githubToken → gitToken, numeric repo ids). */
export function getHydratedAppSettings(): AppSettings {
  const gitTokenStored = store.get('gitToken') as string | undefined
  const legacyGithub = (store.get('githubToken') as string) || ''
  const gitToken = String(gitTokenStored ?? '').trim() || String(legacyGithub).trim()

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
    cloudProvider: store.get('cloudProvider'),
    cloudConfig: store.get('cloudConfig'),
    repoFilters: store.get('repoFilters'),
    selectedRepoIds: normalizeSelectedRepoIds(store.get('selectedRepoIds')),
    schedule: store.get('schedule'),
    concurrencyLimit: store.get('concurrencyLimit'),
  }
}
