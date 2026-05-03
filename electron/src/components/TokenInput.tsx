import {
  CheckCircle2,
  ClipboardPaste,
  Eye,
  EyeOff,
  ExternalLink,
  Github,
  Gitlab,
  Boxes,
  KeyRound,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { ipcInvoke } from '../hooks/useIpc'
import { SectionIcon } from './ui/SectionIcon'
import type { GitProvider } from '../types'

interface TokenValidation {
  valid: boolean
  user?: string
  name?: string
  avatarUrl?: string
  profileUrl?: string
  publicRepos?: number
  privateRepos?: number
  scopes?: string[]
  error?: string
}

interface Props {
  provider: GitProvider
  onProviderChange: (provider: GitProvider) => void
  token: string
  onTokenChange: (token: string) => void
  gitlabBaseUrl: string
  onGitlabBaseUrlChange: (url: string) => void
  bitbucketUsername: string
  onBitbucketUsernameChange: (username: string) => void
}

const PROVIDER_TABS: Array<{ id: GitProvider; label: string; Icon: typeof Github }> = [
  { id: 'github', label: 'GitHub', Icon: Github },
  { id: 'gitlab', label: 'GitLab', Icon: Gitlab },
  { id: 'bitbucket', label: 'Bitbucket', Icon: Boxes },
]

export default function TokenInput({
  provider,
  onProviderChange,
  token,
  onTokenChange,
  gitlabBaseUrl,
  onGitlabBaseUrlChange,
  bitbucketUsername,
  onBitbucketUsernameChange,
}: Props) {
  const [validating, setValidating] = useState(false)
  const [status, setStatus] = useState<TokenValidation | null>(null)
  const [showToken, setShowToken] = useState(false)

  const steps = useMemo(() => {
    if (provider === 'gitlab') {
      return [
        { title: 'GitLab', sub: 'User settings → Access tokens', hint: 'gitlab.com/-/user_settings/personal_access_tokens', Icon: ExternalLink },
        { title: 'Create token', sub: 'api or read_api + read_repository', Icon: KeyRound },
        { title: 'Self-managed?', sub: 'Set instance URL below if not gitlab.com', Icon: SlidersHorizontal },
        { title: 'Paste here', sub: 'Generate & copy', Icon: ClipboardPaste },
      ]
    }
    if (provider === 'bitbucket') {
      return [
        { title: 'Bitbucket', sub: 'Personal settings → App passwords', hint: 'bitbucket.org/account/settings/app-passwords/', Icon: ExternalLink },
        { title: 'Username', sub: 'Your Bitbucket username (not email)', Icon: KeyRound },
        { title: 'App password', sub: 'Repositories: Read', Icon: SlidersHorizontal },
        { title: 'Paste here', sub: 'Password goes in the token field', Icon: ClipboardPaste },
      ]
    }
    return [
      { title: 'GitHub', sub: 'Developer settings', hint: 'github.com/settings/developers', Icon: ExternalLink },
      { title: 'Create token', sub: 'Personal access tokens → classic', Icon: KeyRound },
      { title: 'Scopes', sub: 'repo + read:org', Icon: SlidersHorizontal },
      { title: 'Paste here', sub: 'Generate & copy', Icon: ClipboardPaste },
    ]
  }, [provider])

  const HeaderIcon = PROVIDER_TABS.find((p) => p.id === provider)?.Icon ?? Github

  const canValidate =
    token.trim().length > 0 && (provider !== 'bitbucket' || bitbucketUsername.trim().length > 0)

  const validate = async () => {
    if (!canValidate) return
    setValidating(true)
    setStatus(null)
    try {
      const result = await ipcInvoke<TokenValidation>('remote:validate-token', {
        provider,
        token,
        gitlabBaseUrl: provider === 'gitlab' ? gitlabBaseUrl : undefined,
        bitbucketUsername: provider === 'bitbucket' ? bitbucketUsername : undefined,
      })
      setStatus(result)
    } catch {
      setStatus({ valid: false, error: 'Failed to validate token' })
    } finally {
      setValidating(false)
    }
  }

  const disconnect = () => {
    onTokenChange('')
    setStatus(null)
  }

  const placeholder =
    provider === 'github'
      ? 'ghp_xxxxxxxxxxxxxxxxxxxx'
      : provider === 'gitlab'
        ? 'glpat-xxxxxxxxxxxxxxxxxxxx'
        : 'Bitbucket app password'

  const title =
    provider === 'github' ? 'GitHub' : provider === 'gitlab' ? 'GitLab' : 'Bitbucket'

  const subtitle =
    provider === 'github'
      ? 'Use a personal access token (classic or fine-grained).'
      : provider === 'gitlab'
        ? 'Personal access token with API scope to list projects and clone over HTTPS.'
        : 'Your Bitbucket username plus an app password (with repository read).'

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0e141c] p-5 shadow-xl shadow-black/25">
      <div className="mb-4 flex flex-wrap gap-2">
        {PROVIDER_TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              onProviderChange(id)
              setStatus(null)
            }}
            className={[
              'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors',
              provider === id
                ? 'border-[#8d6e9e]/50 bg-[#8d6e9e]/15 text-[#d1c6d6]'
                : 'border-white/[0.06] bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200',
            ].join(' ')}
          >
            <Icon className="h-3.5 w-3.5 opacity-90" strokeWidth={2} aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="mb-5 flex items-center gap-3">
        <SectionIcon icon={HeaderIcon} variant="accent" />
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{title} account</h3>
          <p className="text-xs text-zinc-500">{subtitle}</p>
        </div>
      </div>

      {provider === 'gitlab' && (
        <div className="mb-3">
          <label className="mb-1 block text-[11px] font-medium text-zinc-500">GitLab base URL</label>
          <input
            type="url"
            value={gitlabBaseUrl}
            onChange={(e) => onGitlabBaseUrlChange(e.target.value)}
            placeholder="https://gitlab.com"
            className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/60 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#8d6e9e]/50 focus:outline-none focus:ring-1 focus:ring-[#8d6e9e]/30"
          />
        </div>
      )}

      {provider === 'bitbucket' && (
        <div className="mb-3">
          <label className="mb-1 block text-[11px] font-medium text-zinc-500">Bitbucket username</label>
          <input
            type="text"
            value={bitbucketUsername}
            onChange={(e) => {
              onBitbucketUsernameChange(e.target.value)
              setStatus(null)
            }}
            autoComplete="username"
            placeholder="your_workspace_username"
            className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/60 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#8d6e9e]/50 focus:outline-none focus:ring-1 focus:ring-[#8d6e9e]/30"
          />
        </div>
      )}

      <div className="mb-3 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={(e) => {
              onTokenChange(e.target.value)
              setStatus(null)
            }}
            autoComplete="off"
            placeholder={placeholder}
            className="w-full rounded-xl border border-white/[0.08] bg-zinc-950/60 py-2.5 pl-4 pr-[4.5rem] text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#8d6e9e]/50 focus:outline-none focus:ring-1 focus:ring-[#8d6e9e]/30"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-300"
          >
            {showToken ? <EyeOff className="h-3.5 w-3.5" strokeWidth={2} /> : <Eye className="h-3.5 w-3.5" strokeWidth={2} />}
            {showToken ? 'Hide' : 'Show'}
          </button>
        </div>
        <button
          type="button"
          onClick={validate}
          disabled={validating || !canValidate}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#8d6e9e] px-5 py-2.5 text-sm font-semibold text-[#1a0f18] shadow-md shadow-[#502f4c]/40 transition hover:bg-[#b29bbd] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none"
        >
          {validating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} aria-hidden />
              …
            </>
          ) : (
            'Connect'
          )}
        </button>
      </div>

      {status?.valid && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#d1c6d6] shadow-[0_0_8px_rgba(209,198,214,0.7)]" />
          <span className="text-zinc-500">Connected as</span>
          {status.avatarUrl ? (
            <img src={status.avatarUrl} alt={status.user ?? ''} className="h-6 w-6 rounded-full ring-1 ring-white/10" />
          ) : null}
          <span className="font-semibold text-zinc-200">{status.user}</span>
          <button type="button" onClick={disconnect} className="text-[#b29bbd] hover:text-[#d1c6d6]">
            Log out
          </button>
        </div>
      )}

      {status && !status.valid && (
        <div className="mb-3 rounded-xl border border-[#502f4c]/55 bg-[#502f4c]/20 px-3 py-2 text-xs text-[#d1c6d6]">
          {status.error}
        </div>
      )}

      <div className="mt-4 rounded-xl border border-white/[0.06] bg-zinc-950/40 p-4">
        <p className="mb-4 text-xs font-semibold text-zinc-300">Create a token in four steps</p>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {steps.map((s, i) => (
            <div key={`${provider}-${s.title}`} className="relative min-w-0">
              {i < steps.length - 1 && (
                <div
                  className="absolute left-[calc(50%+1.25rem)] top-4 hidden h-px w-[calc(100%-2.5rem)] bg-gradient-to-r from-zinc-700/80 to-transparent lg:block"
                  aria-hidden
                />
              )}
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800/90 ring-1 ring-zinc-700/60">
                  <s.Icon className="h-4 w-4 text-zinc-400" strokeWidth={1.85} aria-hidden />
                </div>
              </div>
              <p className="text-[11px] font-semibold text-zinc-300">
                {i + 1}. {s.title}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">{s.sub}</p>
              {s.hint ? (
                <p className="mt-1 truncate text-[10px] text-[#b29bbd]" title={s.hint}>
                  {s.hint}
                </p>
              ) : null}
            </div>
          ))}

          <div className="flex flex-col items-center justify-start lg:items-start">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#8d6e9e]/15 ring-1 ring-[#8d6e9e]/30">
              <CheckCircle2 className="h-4 w-4 text-[#d1c6d6]" strokeWidth={2} aria-hidden />
            </div>
            <p className="text-[11px] font-semibold text-[#d1c6d6]">Done</p>
            <p className="mt-0.5 text-center text-[10px] text-zinc-500 lg:text-left">Validate with Connect.</p>
          </div>
        </div>

        {provider === 'bitbucket' && (
          <p className="mt-4 border-t border-white/[0.06] pt-3 text-[11px] leading-relaxed text-zinc-500">
            The starred filter is not available for Bitbucket; other filters list workspaces you belong to.
          </p>
        )}
        {provider === 'github' && (
          <p className="mt-4 border-t border-white/[0.06] pt-3 text-[11px] leading-relaxed text-zinc-500">
            Fine-grained tokens work if repository access covers the repos you need.
          </p>
        )}
      </div>
    </div>
  )
}
