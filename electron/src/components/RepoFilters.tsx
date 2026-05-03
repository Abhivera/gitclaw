import { Building2, GitFork, Star, UserRound, Users } from 'lucide-react'
import type { RepoFilterSet } from '../types'

interface Props {
  filters: RepoFilterSet
  onFilterChange: (filters: RepoFilterSet) => void
}

const filterConfig: Array<{
  key: keyof RepoFilterSet
  label: string
  icon: typeof UserRound
}> = [
  { key: 'owned', label: 'Owned', icon: UserRound },
  { key: 'organization', label: 'Organization', icon: Building2 },
  { key: 'starred', label: 'Starred', icon: Star },
  { key: 'forked', label: 'Forked', icon: GitFork },
  { key: 'collaborator', label: 'Collaborator', icon: Users },
]

export default function RepoFilters({ filters, onFilterChange }: Props) {
  const toggle = (key: keyof RepoFilterSet) => {
    onFilterChange({ ...filters, [key]: !filters[key] })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {filterConfig.map(({ key, label, icon: Icon }) => {
        const on = filters[key]
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all ${
              on
                ? 'border-[#8d6e9e]/45 bg-[#8d6e9e]/15 text-[#d1c6d6] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]'
                : 'border-white/[0.06] bg-zinc-950/50 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400'
            }`}
          >
            <Icon className="h-3.5 w-3.5 opacity-90" strokeWidth={2} aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}
