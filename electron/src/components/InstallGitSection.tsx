import { useState } from 'react'
import { Check, Copy, Download, ExternalLink, Terminal } from 'lucide-react'
import { SectionIcon } from './ui/SectionIcon'
import { GITHUB_LATEST_RELEASE, GIT_INSTALL_ROWS } from '../constants/platformInstall'

export function InstallGitSection() {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      window.setTimeout(() => setCopiedId(null), 2000)
    } catch {
      setCopiedId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/[0.06] bg-[#0e141c] p-5 shadow-xl shadow-black/25">
        <div className="mb-5 flex items-start gap-3">
          <SectionIcon icon={Terminal} variant="accent" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-zinc-100">Install Git</h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              GitClaw uses the <code className="rounded bg-zinc-900/80 px-1 py-0.5 text-[11px] text-zinc-400">git</code>{' '}
              CLI. If clones or updates fail, install Git for your OS, then restart GitClaw.
            </p>
          </div>
        </div>

        <ul className="space-y-3">
          {GIT_INSTALL_ROWS.map((row) => {
            const copied = copiedId === row.id
            return (
              <li
                key={row.id}
                className="rounded-xl border border-white/[0.06] bg-zinc-950/35 px-3 py-3 sm:flex sm:items-center sm:gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">{row.label}</p>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-[#d8ccd9] sm:whitespace-nowrap sm:break-normal">
                    {row.command}
                  </pre>
                </div>
                <div className="mt-3 flex shrink-0 items-center gap-2 sm:mt-0">
                  <a
                    href={row.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium text-zinc-400 ring-1 ring-white/[0.08] transition-colors hover:bg-white/[0.04] hover:text-[#c4b5ce] hover:ring-zinc-600"
                  >
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => copy(row.id, row.command)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium text-zinc-300 ring-1 ring-[#8d6e9e]/35 transition-colors hover:bg-[#8d6e9e]/10 hover:text-[#e8dff0]"
                    aria-label={`Copy command for ${row.label}`}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-[#a3d9a5]" strokeWidth={2} aria-hidden />
                    ) : (
                      <Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-[#0e141c] p-5 shadow-xl shadow-black/25">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <SectionIcon icon={Download} variant="accent" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Download GitClaw</h3>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-zinc-500">
                Installers for Windows, Linux, and macOS are attached to each GitHub release (.exe, .deb, AppImage,
                .dmg).
              </p>
            </div>
          </div>
          <a
            href={GITHUB_LATEST_RELEASE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[#8d6e9e]/20 px-4 py-2.5 text-sm font-medium text-[#e8dff0] ring-1 ring-[#8d6e9e]/40 transition-colors hover:bg-[#8d6e9e]/30 sm:self-center"
          >
            Latest release
            <ExternalLink className="h-4 w-4 opacity-80" strokeWidth={2} aria-hidden />
          </a>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-zinc-600">
          <strong className="font-medium text-zinc-500">Linux (.deb):</strong> download the{' '}
          <code className="text-zinc-500">gitclaw_*_amd64.deb</code> asset, then run{' '}
          <code className="rounded bg-zinc-900/80 px-1 py-0.5 font-mono text-[10px] text-zinc-400">
            sudo apt install ./gitclaw_*_amd64.deb
          </code>{' '}
          from the folder that contains the file.
        </p>
      </div>
    </div>
  )
}
