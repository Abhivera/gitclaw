/** GitHub releases (installers: .exe, .dmg, .deb, AppImage). */
export const GITHUB_LATEST_RELEASE =
  'https://github.com/Abhivera/gitclaw/releases/latest'

export type PlatformInstallRow = {
  id: string
  label: string
  command: string
  /** Official Git downloads / install docs */
  docUrl: string
}

/** Install Git — GitClaw shells out to `git` on your PATH. */
export const GIT_INSTALL_ROWS: PlatformInstallRow[] = [
  {
    id: 'linux',
    label: 'Linux (Debian / Ubuntu)',
    command: 'sudo apt update && sudo apt install -y git',
    docUrl: 'https://git-scm.com/download/linux',
  },
  {
    id: 'windows',
    label: 'Windows',
    command: 'winget install --id Git.Git -e --source winget',
    docUrl: 'https://git-scm.com/download/win',
  },
  {
    id: 'macos',
    label: 'macOS',
    command: 'brew install git',
    docUrl: 'https://git-scm.com/download/mac',
  },
]
