import {
  Archive,
  CheckCircle2,
  ListTree,
  Loader2,
  Play,
  ScrollText,
  Square,
  Trash2,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { ipcInvoke } from '../hooks/useIpc'
import { useBackupProgress } from '../hooks/useBackupProgress'
import { PageHeader } from '../components/ui/PageHeader'
import type { RepoBackupStage } from '../types'

const stageLabels: Record<RepoBackupStage, string> = {
  pending: 'Pending',
  cloning: 'Cloning',
  updating: 'Updating',
  compressing: 'Compressing',
  done: 'Done',
  failed: 'Failed',
  skipped: 'Skipped',
}

const stageColors: Record<RepoBackupStage, string> = {
  pending: 'text-zinc-500',
  cloning: 'text-[#b29bbd]',
  updating: 'text-[#b29bbd]',
  compressing: 'text-[#8d6e9e]',
  done: 'text-[#d1c6d6]',
  failed: 'text-[#d1c6d6]',
  skipped: 'text-zinc-500',
}

export default function BackupPage() {
  const { statuses, logs, summary, running, start, reset, setRunning } = useBackupProgress()
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleStart = async () => {
    start()
    const result = await ipcInvoke<{
      success: boolean
      message?: string
      totalRepos?: number
    }>('backup:start')
    if (!result.success) {
      setRunning(false)
      alert(result.message || 'Failed to start backup')
    }
  }

  const handleCancel = async () => {
    await ipcInvoke('backup:cancel')
  }

  const completed = statuses.filter(
    (s) => s.stage === 'done' || s.stage === 'failed' || s.stage === 'skipped',
  ).length
  const total = statuses.length || 1
  const overallPercent = Math.round((completed / total) * 100)

  return (
    <div>
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Backup"
          description="Run a backup of your selected repositories, watch per-repo progress, and inspect logs."
        />
        <div className="flex shrink-0 flex-wrap gap-2 sm:pt-1">
          {!running && (
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex items-center gap-2 rounded-xl bg-[#8d6e9e] px-5 py-2.5 text-sm font-semibold text-[#1a0f18] shadow-md shadow-[#502f4c]/40 transition hover:bg-[#b29bbd]"
            >
              <Play className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              <span className="-ml-0.5">Start backup</span>
            </button>
          )}
          {running && (
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-2 rounded-xl border border-[#502f4c]/60 bg-[#502f4c]/30 px-5 py-2.5 text-sm font-semibold text-[#d1c6d6] transition hover:bg-[#502f4c]/45"
            >
              <Square className="h-4 w-4 fill-current" strokeWidth={2} aria-hidden />
              Cancel
            </button>
          )}
          {summary && !running && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-900/60 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
            >
              <Trash2 className="h-4 w-4 opacity-80" strokeWidth={1.85} aria-hidden />
              Clear
            </button>
          )}
        </div>
      </div>

      {summary && (
        <div className="mb-5 rounded-2xl border border-white/[0.06] bg-[#0e141c] p-5 shadow-xl shadow-black/25">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8d6e9e]/15 text-[#d1c6d6] ring-1 ring-[#8d6e9e]/30">
              <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">Backup finished</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={summary.totalRepos} label="Total" tone="neutral" />
            <Stat value={summary.succeeded} label="Succeeded" tone="success" />
            <Stat value={summary.failed} label="Failed" tone="danger" />
            <Stat value={summary.skipped} label="Skipped" tone="muted" />
          </div>

          <p className="mt-4 text-center text-xs text-zinc-500">
            Duration {(summary.duration / 1000).toFixed(1)}s
          </p>

          {summary.errors.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-[#d1c6d6]">Errors</p>
              {summary.errors.map((e, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[#502f4c]/40 bg-[#502f4c]/20 px-3 py-2 text-xs text-[#d1c6d6]"
                >
                  <span className="font-semibold text-[#d1c6d6]">{e.repoName}:</span> {e.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {running && statuses.length > 0 && (
        <div className="mb-5 rounded-2xl border border-white/[0.06] bg-[#0e141c] p-5 shadow-xl shadow-black/25">
          <div className="mb-2 flex justify-between text-xs text-zinc-500">
            <span>
              {completed} of {statuses.length} repositories
            </span>
            <span className="tabular-nums text-zinc-400">{overallPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-950 ring-1 ring-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#502f4c] to-[#8d6e9e] transition-all duration-300"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>
      )}

      {statuses.length > 0 && (
        <div className="mb-5 rounded-2xl border border-white/[0.06] bg-[#0e141c] p-5 shadow-xl shadow-black/25">
          <div className="mb-4 flex items-center gap-2">
            <ListTree className="h-4 w-4 text-zinc-500" strokeWidth={1.85} aria-hidden />
            <h3 className="text-sm font-semibold text-zinc-100">Repository status</h3>
          </div>
          <div className="max-h-64 divide-y divide-white/[0.05] overflow-y-auto rounded-xl border border-white/[0.06] bg-zinc-950/40">
            {statuses
              .sort((a, b) => {
                const order: Record<RepoBackupStage, number> = {
                  cloning: 0,
                  updating: 0,
                  compressing: 1,
                  pending: 2,
                  done: 3,
                  failed: 3,
                  skipped: 4,
                }
                return (order[a.stage] ?? 9) - (order[b.stage] ?? 9)
              })
              .map((s) => (
                <div key={s.repoId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`w-24 shrink-0 text-xs font-medium ${stageColors[s.stage]}`}>
                      {stageLabels[s.stage]}
                    </span>
                    <span className="truncate text-sm text-zinc-300">{s.repoName}</span>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-2">
                    {s.stage !== 'done' &&
                      s.stage !== 'failed' &&
                      s.stage !== 'skipped' &&
                      s.stage !== 'pending' && (
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-900">
                          <div
                            className="h-full rounded-full bg-[#8d6e9e] transition-all"
                            style={{ width: `${s.progress}%` }}
                          />
                        </div>
                      )}
                    {s.error && (
                      <span className="max-w-40 truncate text-xs text-[#d1c6d6]" title={s.error}>
                        {s.error}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-[#0e141c] p-5 shadow-xl shadow-black/25">
          <div className="mb-4 flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-zinc-500" strokeWidth={1.85} aria-hidden />
            <h3 className="text-sm font-semibold text-zinc-100">Log</h3>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-xl border border-white/[0.06] bg-zinc-950/80 p-3 font-mono text-xs leading-relaxed">
            {logs.map((entry, i) => (
              <div key={i} className="flex gap-2 py-0.5">
                <span className="shrink-0 whitespace-nowrap text-zinc-600">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={
                    entry.level === 'error'
                      ? 'text-[#d1c6d6]'
                      : entry.level === 'warn'
                        ? 'text-[#b29bbd]'
                        : 'text-zinc-500'
                  }
                >
                  {entry.message}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {!running && !summary && statuses.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/[0.08] bg-zinc-900/25 px-8 py-14 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/80 ring-1 ring-white/[0.06]">
            <Archive className="h-8 w-8 text-zinc-500" strokeWidth={1.35} aria-hidden />
          </div>
          <p className="text-sm font-medium text-zinc-300">No backup running</p>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-zinc-500">
            Press <span className="font-semibold text-[#b29bbd]">Start backup</span> to clone or update your
            selected repositories.
          </p>
        </div>
      )}
    </div>
  )
}

function Stat({
  value,
  label,
  tone,
}: {
  value: number
  label: string
  tone: 'neutral' | 'success' | 'danger' | 'muted'
}) {
  const colors = {
    neutral: 'text-zinc-100',
    success: 'text-[#d1c6d6]',
    danger: 'text-[#b29bbd]',
    muted: 'text-zinc-500',
  }
  return (
    <div className="rounded-xl border border-white/[0.05] bg-zinc-950/50 p-3 text-center ring-1 ring-black/20">
      <div className={`text-2xl font-bold tabular-nums ${colors[tone]}`}>{value}</div>
      <div className="mt-0.5 text-[11px] font-medium text-zinc-500">{label}</div>
    </div>
  )
}
