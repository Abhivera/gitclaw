import { NavLink } from 'react-router-dom'
import {
  ArrowUpRight,
  Check,
  CircleAlert,
  FolderGit2,
  Github,
  GitBranch,
  HardDriveDownload,
  Loader2,
  Settings2,
  SlidersHorizontal,
} from 'lucide-react'
import { useSettings } from '../hooks/useSettings'

const nav = [
  { to: '/setup', label: 'Setup', icon: SlidersHorizontal },
  { to: '/repos', label: 'Repositories', icon: FolderGit2 },
  { to: '/backup', label: 'Backup', icon: HardDriveDownload },
  { to: '/settings', label: 'Settings', icon: Settings2 },
] as const

export default function Sidebar() {
  const { settings, loading } = useSettings()
  const tokenOk =
    Boolean(settings.gitToken?.trim()) &&
    (settings.gitProvider !== 'bitbucket' || Boolean(settings.bitbucketUsername?.trim()))
  const isReady = Boolean(tokenOk && settings.backupPath)

  return (
    <aside className="flex w-[15.5rem] shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0e14]/95 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <div className="border-b border-white/[0.06] px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8d6e9e]/35 via-[#502f4c]/25 to-[#b29bbd]/25 ring-1 ring-[#8d6e9e]/30 shadow-lg shadow-black/40">
            <Github className="h-[1.35rem] w-[1.35rem] text-[#d1c6d6]" strokeWidth={2} aria-hidden />
            <div className="absolute -bottom-0.5 -right-0.5 flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-md bg-zinc-950 ring-1 ring-zinc-600/80">
              <GitBranch className="h-2.5 w-2.5 text-[#b29bbd]" strokeWidth={2.5} aria-hidden />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold tracking-tight text-zinc-50">GitClaw</h1>
            <p className="text-[11px] leading-snug text-zinc-500">Git host backup, local-first</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-[#8d6e9e]/15 text-[#d1c6d6] shadow-[inset_0_0_0_1px_rgba(141,110,158,0.25)]'
                  : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <span
                    className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-[#b29bbd] shadow-[0_0_12px_rgba(178,155,189,0.55)]"
                    aria-hidden
                  />
                ) : null}
                <span
                  className={[
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 transition-colors',
                    isActive
                      ? 'bg-[#8d6e9e]/20 text-[#d1c6d6] ring-[#8d6e9e]/35'
                      : 'bg-zinc-800/60 text-zinc-500 ring-zinc-700/50 group-hover:bg-zinc-800 group-hover:text-zinc-300',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.85} aria-hidden />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3">
        <div
          className={[
            'rounded-xl border p-3.5 transition-colors',
            isReady
              ? 'border-[#8d6e9e]/30 bg-[#8d6e9e]/[0.08]'
              : 'border-white/[0.06] bg-zinc-900/40',
          ].join(' ')}
        >
          <div className="flex items-start gap-3">
            <div
              className={[
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1',
                isReady
                  ? 'bg-[#8d6e9e]/20 text-[#d1c6d6] ring-[#8d6e9e]/35'
                  : 'bg-zinc-800 text-zinc-500 ring-zinc-700/60',
              ].join(' ')}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden />
              ) : isReady ? (
                <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              ) : (
                <CircleAlert className="h-4 w-4" strokeWidth={2} aria-hidden />
              )}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-medium ${isReady ? 'text-[#d1c6d6]' : 'text-zinc-400'}`}>
                {isReady ? 'Ready to backup' : 'Setup required'}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                {isReady
                  ? 'Your repos can be cloned and updated from the Backup tab.'
                  : 'Add a token (and Bitbucket username if needed) plus a backup folder in Setup.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-white/[0.06] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium tabular-nums text-zinc-600">v1.0.0</span>
          <NavLink
            to="/settings"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 ring-1 ring-transparent transition-colors hover:bg-white/[0.04] hover:text-[#b29bbd] hover:ring-white/[0.06]"
            title="Settings"
          >
            <Settings2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </NavLink>
        </div>
        <a
          href="https://gitclaw.online"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-1 text-[10px] text-zinc-600 transition-colors hover:text-[#b29bbd]"
        >
          gitclaw.online
          <ArrowUpRight className="h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100" strokeWidth={2} />
        </a>
      </div>
    </aside>
  )
}
