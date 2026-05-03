import { Filter, GitBranch, ListChecks, Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useState } from 'react'
import RepoFilters from '../components/RepoFilters'
import RepoList from '../components/RepoList'
import { useSettings } from '../hooks/useSettings'
import { ipcInvoke } from '../hooks/useIpc'
import { PageHeader } from '../components/ui/PageHeader'
import type { RepoFilterSet, RepoInfo } from '../types'

function canFetchRepos(
  gitToken: string,
  gitProvider: 'github' | 'gitlab' | 'bitbucket',
  bitbucketUsername: string,
): boolean {
  if (!gitToken.trim()) return false
  if (gitProvider === 'bitbucket' && !bitbucketUsername.trim()) return false
  return true
}

export default function ReposPage() {
  const { settings, updateSettings, loading } = useSettings()
  const [repos, setRepos] = useState<RepoInfo[]>([])
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchRepos = useCallback(async () => {
    if (!canFetchRepos(settings.gitToken, settings.gitProvider, settings.bitbucketUsername)) {
      setFetchError('Please set your access token (and Bitbucket username if needed) in Setup first.')
      return
    }
    setFetching(true)
    setFetchError(null)
    try {
      const result = await ipcInvoke<RepoInfo[]>('remote:fetch-repos', {
        provider: settings.gitProvider,
        token: settings.gitToken,
        filters: settings.repoFilters,
        gitlabBaseUrl: settings.gitlabBaseUrl,
        bitbucketUsername: settings.bitbucketUsername,
      })
      setRepos(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch repositories'
      setFetchError(message)
    } finally {
      setFetching(false)
    }
  }, [
    settings.gitToken,
    settings.gitProvider,
    settings.repoFilters,
    settings.gitlabBaseUrl,
    settings.bitbucketUsername,
  ])

  const handleFilterChange = async (filters: RepoFilterSet) => {
    await updateSettings({ repoFilters: filters })
  }

  const handleSelectionChange = async (ids: string[]) => {
    await updateSettings({ selectedRepoIds: ids })
  }

  const fetchAllowed = canFetchRepos(settings.gitToken, settings.gitProvider, settings.bitbucketUsername)

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin text-[#8d6e9e]/80" strokeWidth={1.75} aria-hidden />
        <span className="text-sm">Loading…</span>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Repositories"
        description="Choose which kinds of repos to list, fetch from your host, then select what to include in backups."
      />

      <div className="space-y-5">
        <div className="rounded-2xl border border-white/[0.06] bg-[#0e141c] p-5 shadow-xl shadow-black/25">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8d6e9e]/15 text-[#d1c6d6] ring-1 ring-[#8d6e9e]/30">
              <Filter className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.85} aria-hidden />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Repository filters</h3>
              <p className="text-xs text-zinc-500">Include owned, org, starred, forks, or collaborator repos.</p>
            </div>
          </div>

          <RepoFilters filters={settings.repoFilters} onFilterChange={handleFilterChange} />

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={fetchRepos}
              disabled={fetching || !fetchAllowed}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8d6e9e] px-5 py-2.5 text-sm font-semibold text-[#1a0f18] shadow-md shadow-[#502f4c]/40 transition hover:bg-[#b29bbd] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none"
            >
              {fetching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} aria-hidden />
                  Fetching…
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" strokeWidth={2} aria-hidden />
                  Fetch repositories
                </>
              )}
            </button>

            {!fetchAllowed && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#b29bbd]">
                <GitBranch className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Complete token setup first
              </span>
            )}
          </div>

          {fetchError && (
            <div className="mt-4 rounded-xl border border-[#502f4c]/55 bg-[#502f4c]/20 px-4 py-3 text-xs text-[#d1c6d6]">
              {fetchError}
            </div>
          )}
        </div>

        {repos.length > 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-[#0e141c] p-5 shadow-xl shadow-black/25">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8d6e9e]/15 text-[#d1c6d6] ring-1 ring-[#8d6e9e]/30">
                <ListChecks className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.85} aria-hidden />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Select repositories</h3>
                <p className="text-xs text-zinc-500">Search, multi-select, then run a backup when you are ready.</p>
              </div>
            </div>

            <RepoList
              repos={repos}
              selectedIds={settings.selectedRepoIds}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
