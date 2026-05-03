import { HardDrive, Lock, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { RepoInfo } from '../types'

interface Props {
  repos: RepoInfo[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
}

export default function RepoList({ repos, selectedIds, onSelectionChange }: Props) {
  const [search, setSearch] = useState('')
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const filtered = useMemo(
    () =>
      repos.filter(
        (r) =>
          r.fullName.toLowerCase().includes(search.toLowerCase()) ||
          (r.description || '').toLowerCase().includes(search.toLowerCase()),
      ),
    [repos, search],
  )

  const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selectedSet.has(r.id))

  const toggleAll = () => {
    if (allFilteredSelected) {
      const filteredIds = new Set(filtered.map((r) => r.id))
      onSelectionChange(selectedIds.filter((id) => !filteredIds.has(id)))
    } else {
      const newIds = new Set([...selectedIds, ...filtered.map((r) => r.id)])
      onSelectionChange(Array.from(newIds))
    }
  }

  const toggleOne = (id: string) => {
    if (selectedSet.has(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const formatSize = (kb: number) => {
    if (kb < 1024) return `${kb} KB`
    if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`
    return `${(kb / (1024 * 1024)).toFixed(1)} GB`
  }

  const sourceColors: Record<string, string> = {
    owned: 'text-[#d1c6d6] bg-[#8d6e9e]/15 border-[#8d6e9e]/30',
    org: 'text-[#d1c6d6] bg-[#502f4c]/35 border-[#502f4c]/55',
    starred: 'text-[#d1c6d6] bg-[#b29bbd]/20 border-[#b29bbd]/35',
    forked: 'text-[#d1c6d6] bg-[#8d6e9e]/20 border-[#8d6e9e]/40',
    collaborator: 'text-[#d1c6d6] bg-[#502f4c]/25 border-[#502f4c]/45',
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
            strokeWidth={1.85}
            aria-hidden
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repositories…"
            className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/60 py-2 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#8d6e9e]/50 focus:outline-none focus:ring-1 focus:ring-[#8d6e9e]/30"
          />
        </div>
        <span className="shrink-0 text-xs tabular-nums text-zinc-500">
          {selectedIds.length} / {repos.length} selected
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.06]">
        <div className="flex items-center gap-3 border-b border-white/[0.06] bg-zinc-950/50 px-4 py-2.5">
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={toggleAll}
            className="rounded border-zinc-600 bg-zinc-800 text-[#8d6e9e] focus:ring-[#8d6e9e]/35"
          />
          <span className="text-xs font-medium text-zinc-400">{filtered.length} repositories</span>
        </div>

        <div className="max-h-[400px] divide-y divide-white/[0.05] overflow-y-auto">
          {filtered.map((repo) => (
            <label
              key={repo.id}
              className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
            >
              <input
                type="checkbox"
                checked={selectedSet.has(repo.id)}
                onChange={() => toggleOne(repo.id)}
                className="rounded border-zinc-600 bg-zinc-800 text-[#8d6e9e] focus:ring-[#8d6e9e]/35"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-zinc-200">{repo.fullName}</span>
                  {repo.isPrivate && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-[#b29bbd]/40 bg-[#b29bbd]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#d1c6d6]">
                      <Lock className="h-3 w-3" strokeWidth={2} aria-hidden />
                      Private
                    </span>
                  )}
                  <span
                    className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium capitalize ${sourceColors[repo.source] || 'text-zinc-500'}`}
                  >
                    {repo.source}
                  </span>
                </div>
                {repo.description ? (
                  <p className="mt-0.5 truncate text-xs text-zinc-500">{repo.description}</p>
                ) : null}
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 tabular-nums text-xs text-zinc-500">
                <HardDrive className="h-3.5 w-3.5 opacity-70" strokeWidth={1.85} aria-hidden />
                {formatSize(repo.size)}
              </span>
            </label>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-zinc-500">
              {repos.length === 0
                ? 'No repositories found. Check your filters and token.'
                : 'No repositories match your search.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
