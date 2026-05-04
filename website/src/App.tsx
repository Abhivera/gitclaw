import { useEffect, useState, type ComponentType } from 'react'
import {
  Apple,
  ArrowUpRight,
  CalendarClock,
  HardDriveDownload,
  Loader2,
  Terminal,
} from 'lucide-react'
import {
  detectPlatform,
  fetchLatestDownloads,
  type PlatformKey,
  type ReleaseDownloads,
  REPO,
  URLS,
} from './lib/releases'

const INSTALL_SH = `curl -fsSL ${URLS.rawMain}/install.sh | bash`
const INSTALL_PS = `irm ${URLS.rawMain}/install.ps1 | iex`

function WindowsIcon({ className }: { className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 5.45l7.5-1v7.35H3V5.45zm0 8.15h7.5v7.35L3 19.95v-6.35zm8.25-9.2L21 3v9.95h-9.75V4.4zm0 10.1H21V21l-9.75-1.35v-5.15z" />
    </svg>
  )
}

function DownloadCard({
  title,
  description,
  href,
  fileLabel,
  icon: Icon,
  highlight,
}: {
  title: string
  description: string
  href: string
  fileLabel?: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  highlight?: boolean
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={[
        'group flex flex-col rounded-2xl border p-5 transition',
        highlight
          ? 'border-[#8d6e9e]/45 bg-[#8d6e9e]/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
          : 'border-white/[0.08] bg-[#0a0e14]/80 hover:border-[#8d6e9e]/25 hover:bg-[#0d1219]',
      ].join(' ')}
    >
        <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8d6e9e]/15 ring-1 ring-[#8d6e9e]/30">
          <Icon className="h-5 w-5 text-[#d1c6d6]" strokeWidth={1.75} />
        </div>
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:text-[#b29bbd]"
          aria-hidden
        />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-zinc-50">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-zinc-500">{description}</p>
      {fileLabel && (
        <p className="mt-3 truncate font-mono text-xs text-zinc-600" title={fileLabel}>
          {fileLabel}
        </p>
      )}
    </a>
  )
}

export default function App() {
  const [release, setRelease] = useState<ReleaseDownloads | null | undefined>(undefined)
  /** True only when the GitHub API request fails (network, etc.). Missing releases are normal, not an error. */
  const [loadFailed, setLoadFailed] = useState(false)
  const platform = detectPlatform()

  useEffect(() => {
    let cancelled = false
    fetchLatestDownloads()
      .then((data) => {
        if (!cancelled) {
          setRelease(data)
          setLoadFailed(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRelease(null)
          setLoadFailed(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  function suggested(p: PlatformKey): boolean {
    return platform === p
  }

  return (
    <div className="min-h-screen bg-[#070a0f] text-zinc-100">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.5]"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 85% 50% at 50% -20%, rgba(141, 110, 158, 0.2), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(80, 47, 76, 0.18), transparent 45%)',
        }}
      />

      <main className="relative mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <header className="mb-14 text-center sm:mb-16">
          <div className="mb-6 flex justify-center">
            <div className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/[0.08] shadow-lg shadow-black/40 sm:p-5">
              <img
                src="/white-icon-black-bg.png"
                alt="GitClaw"
                width={200}
                height={120}
                className="mx-auto h-auto w-[min(100%,220px)] object-contain sm:w-[260px]"
                decoding="async"
                fetchPriority="high"
              />
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            GitClaw — local GitHub, GitLab & Bitbucket Backup Scheduler
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg leading-relaxed text-zinc-400">
            <strong className="font-medium text-zinc-300">GitHub backup</strong>,{' '}
            <strong className="font-medium text-zinc-300">GitLab backup</strong>, and{' '}
            <strong className="font-medium text-zinc-300">Bitbucket backup</strong> on your own disk:
            clone, fetch, and pull with filters and parallel jobs. Includes a{' '}
            <strong className="font-medium text-zinc-300">backup scheduler</strong> (daily, weekly, or
            monthly) and system tray integration. Open-source desktop app for Windows, Linux, and
            macOS.
          </p>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-500">
            GitClaw is{' '}
            <span className="text-zinc-400">open source</span> (MIT). Code and issues live on{' '}
            <a
              href={URLS.repo}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#b29bbd] underline decoration-[#8d6e9e]/40 underline-offset-2 transition hover:text-[#d1c6d6] hover:decoration-[#8d6e9e]/70"
            >
              github.com/{REPO}
            </a>
            .
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
            <a
              href={URLS.repo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-zinc-300 transition hover:border-[#8d6e9e]/35 hover:text-white"
            >
              Open source on GitHub
              <ArrowUpRight className="h-3.5 w-3.5 opacity-70" aria-hidden />
            </a>
            <a
              href={URLS.releasesLatest}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
            >
              All releases
            </a>
          </div>
        </header>

        <section
          aria-labelledby="features-heading"
          className="mb-14 rounded-2xl border border-white/[0.08] bg-[#0a0e14]/80 px-5 py-6 sm:px-8 sm:py-7"
        >
          <h2 id="features-heading" className="text-center text-base font-semibold tracking-tight text-white">
            Why use GitClaw for git backup?
          </h2>
          <ul className="mx-auto mt-5 max-w-xl space-y-3 text-sm leading-relaxed text-zinc-400">
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-[#8d6e9e]" aria-hidden>
                <HardDriveDownload className="h-4 w-4" strokeWidth={2} />
              </span>
              <span>
                <strong className="text-zinc-300">Multi-host backup</strong> — one app for{' '}
                <strong className="text-zinc-300">GitHub</strong>, <strong className="text-zinc-300">GitLab</strong>{' '}
                (including self-managed URLs), and <strong className="text-zinc-300">Bitbucket</strong>{' '}
                using a token; repos stay as normal git folders on your machine.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-[#8d6e9e]" aria-hidden>
                <CalendarClock className="h-4 w-4" strokeWidth={2} />
              </span>
              <span>
                <strong className="text-zinc-300">Backup scheduler</strong> — plan{' '}
                <strong className="text-zinc-300">daily, weekly, or monthly</strong> runs so clones stay
                fresh without manual reminders; works alongside the tray menu.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-[#8d6e9e]" aria-hidden>
                <Terminal className="h-4 w-4" strokeWidth={2} />
              </span>
              <span>
                <strong className="text-zinc-300">Incremental git backup</strong> — first run clones;
                later runs update branches in place. Tune concurrency and watch per-repo progress in
                the UI.
              </span>
            </li>
          </ul>
        </section>


        <section
          aria-labelledby="cli-heading"
          className="rounded-2xl border border-white/[0.08] bg-[#0a0e14]/90 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
        >
          <div className="mb-4 flex items-center gap-2 text-[#b29bbd]">
            <Terminal className="h-4 w-4" aria-hidden />
            <h2 id="cli-heading" className="text-sm font-medium">
              Install from the terminal
            </h2>
          </div>
          <p className="mb-3 text-sm text-zinc-500">macOS & Linux (requires bash, curl or wget):</p>
          <pre className="overflow-x-auto rounded-xl bg-black/40 p-4 font-mono text-xs leading-relaxed text-zinc-300 ring-1 ring-white/[0.06] sm:text-sm">
            {INSTALL_SH}
          </pre>
          <p className="mb-3 mt-5 text-sm text-zinc-500">Windows (PowerShell):</p>
          <pre className="overflow-x-auto rounded-xl bg-black/40 p-4 font-mono text-xs leading-relaxed text-zinc-300 ring-1 ring-white/[0.06] sm:text-sm">
            {INSTALL_PS}
          </pre>
          <p className="mt-4 text-xs text-zinc-600">
            Scripts live in the{' '}
            <a href={URLS.repo} className="text-[#8d6e9e] hover:underline" target="_blank" rel="noreferrer">
              open-source repo
            </a>
            . Review before piping to a shell.
          </p>
        </section>

        <section aria-labelledby="download-heading" className="mb-14">
          <h2 id="download-heading" className="mb-2 text-center text-sm font-medium text-[#b29bbd]">
            Download
          </h2>
          {release === undefined ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0a0e14]/60 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#8d6e9e]/70" aria-hidden />
              <span className="text-sm text-zinc-500">Loading latest release…</span>
            </div>
          ) : (
            <>
              {loadFailed && (
                <p className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100/90">
                  Could not load release info from GitHub. The download cards still open the{' '}
                  <a
                    href={URLS.releasesLatest}
                    className="font-medium text-amber-50 underline underline-offset-2 hover:text-white"
                    target="_blank"
                    rel="noreferrer"
                  >
                    releases page
                  </a>
                  .
                </p>
              )}
              {release === null && !loadFailed && (
                <p className="mb-4 text-center text-sm leading-relaxed text-zinc-500">
                  No release with installer files on GitHub yet — the cards below open{' '}
                  <a
                    href={URLS.releasesLatest}
                    className="text-zinc-400 underline decoration-white/15 underline-offset-2 hover:text-[#b29bbd]"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Releases
                  </a>
                  . Maintainers: push a version tag (e.g. <code className="text-zinc-400">v1.0.0</code>) to build
                  artifacts in CI, or build locally from the{' '}
                  <a
                    href={URLS.repo}
                    className="text-zinc-400 underline decoration-white/15 underline-offset-2 hover:text-[#b29bbd]"
                    target="_blank"
                    rel="noreferrer"
                  >
                    repo
                  </a>
                  .
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <DownloadCard
                  title="Windows"
                  description="NSIS installer (.exe) from the latest release."
                  href={release?.windows?.url ?? URLS.releasesLatest}
                  fileLabel={release?.windows?.name}
                  icon={WindowsIcon}
                  highlight={suggested('windows')}
                />
                <DownloadCard
                  title="macOS"
                  description="Disk image (.dmg). Open and drag GitClaw into Applications."
                  href={release?.macos?.url ?? URLS.releasesLatest}
                  fileLabel={release?.macos?.name}
                  icon={Apple}
                  highlight={suggested('macos')}
                />
                <DownloadCard
                  title="Linux (AppImage)"
                  description="Portable binary. chmod +x then run."
                  href={release?.linuxAppImage?.url ?? URLS.releasesLatest}
                  fileLabel={release?.linuxAppImage?.name}
                  icon={HardDriveDownload}
                  highlight={suggested('linux')}
                />
                <DownloadCard
                  title="Linux (.deb)"
                  description="For Debian / Ubuntu. Install with your package manager."
                  href={release?.linuxDeb?.url ?? URLS.releasesLatest}
                  fileLabel={release?.linuxDeb?.name}
                  icon={HardDriveDownload}
                  highlight={false}
                />
              </div>
            </>
          )}
        </section>

    

        <footer className="mt-16 text-center text-xs text-zinc-600">
          <p>
            MIT License · open source ·{' '}
            <a href={URLS.repo} className="text-zinc-500 hover:text-[#b29bbd]" target="_blank" rel="noreferrer">
              {REPO}
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}
