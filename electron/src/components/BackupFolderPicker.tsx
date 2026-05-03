import { FolderOpen } from 'lucide-react'
import { ipcInvoke } from '../hooks/useIpc'
import { SectionIcon } from './ui/SectionIcon'

interface Props {
  path: string
  onPathChange: (path: string) => void
}

export default function BackupFolderPicker({ path, onPathChange }: Props) {
  const selectFolder = async () => {
    const selected = await ipcInvoke<string | null>('dialog:select-folder')
    if (selected) {
      onPathChange(selected)
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0e141c] p-5 shadow-xl shadow-black/25">
      <div className="mb-5 flex items-center gap-3">
        <SectionIcon icon={FolderOpen} variant="default" />
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Backup folder</h3>
          <p className="text-xs text-zinc-500">Local directory where repositories are cloned and updated.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={path}
          readOnly
          placeholder="No folder selected"
          className="min-w-0 flex-1 cursor-default rounded-xl border border-white/[0.08] bg-zinc-950/60 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600"
        />
        <button
          type="button"
          onClick={selectFolder}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-800/90 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700"
        >
          <FolderOpen className="h-4 w-4 opacity-80" strokeWidth={1.85} aria-hidden />
          Browse
        </button>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-zinc-500">
        Each repo is stored as <code className="rounded bg-zinc-900 px-1 py-0.5 text-[11px] text-zinc-400">owner/name</code> with all remote branches.
      </p>
    </div>
  )
}
