import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'
import BackupFolderPicker from '../components/BackupFolderPicker'
import TokenInput from '../components/TokenInput'
import { PageHeader } from '../components/ui/PageHeader'

function hasValidToken(
  gitToken: string,
  gitProvider: 'github' | 'gitlab' | 'bitbucket',
  bitbucketUsername: string,
): boolean {
  if (!gitToken.trim()) return false
  if (gitProvider === 'bitbucket' && !bitbucketUsername.trim()) return false
  return true
}

export default function SetupPage() {
  const { settings, updateSettings, loading } = useSettings()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin text-[#8d6e9e]/80" strokeWidth={1.75} aria-hidden />
        <span className="text-sm">Loading settings…</span>
      </div>
    )
  }

  const isReady = hasValidToken(settings.gitToken, settings.gitProvider, settings.bitbucketUsername) && settings.backupPath

  return (
    <div>
      <PageHeader
        title="Setup"
        description="Connect GitHub, GitLab, or Bitbucket, then pick a local backup folder."
      />

      <div className="space-y-5">
        <TokenInput
          provider={settings.gitProvider}
          onProviderChange={(gitProvider) => updateSettings({ gitProvider })}
          token={settings.gitToken}
          onTokenChange={(gitToken) => updateSettings({ gitToken })}
          gitlabBaseUrl={settings.gitlabBaseUrl}
          onGitlabBaseUrlChange={(gitlabBaseUrl) => updateSettings({ gitlabBaseUrl })}
          bitbucketUsername={settings.bitbucketUsername}
          onBitbucketUsernameChange={(bitbucketUsername) => updateSettings({ bitbucketUsername })}
        />

        <BackupFolderPicker
          path={settings.backupPath}
          onPathChange={(backupPath) => updateSettings({ backupPath })}
        />

        {isReady && (
          <div className="flex flex-col gap-4 rounded-2xl border border-[#8d6e9e]/30 bg-[#8d6e9e]/[0.08] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#8d6e9e]/15 ring-1 ring-[#8d6e9e]/30">
                <CheckCircle2 className="h-6 w-6 text-[#d1c6d6]" strokeWidth={1.75} aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#d1c6d6]">Setup complete</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  Open <span className="font-medium text-zinc-300">Repositories</span> to fetch and select what to back up.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/repos')}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#8d6e9e] px-5 py-3 text-sm font-semibold text-[#1a0f18] shadow-lg shadow-[#502f4c]/40 transition hover:bg-[#b29bbd]"
            >
              Go to Repositories
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
