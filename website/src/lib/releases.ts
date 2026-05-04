/** Canonical public repository (open source). */
export const REPO = 'Abhivera/gitclaw' as const

export const URLS = {
  releasesLatest: `https://github.com/${REPO}/releases/latest`,
  repo: `https://github.com/${REPO}`,
  apiLatest: `https://api.github.com/repos/${REPO}/releases/latest`,
  rawMain: `https://raw.githubusercontent.com/${REPO}/main`,
} as const

export type PlatformKey = 'windows' | 'macos' | 'linux'

export interface ReleaseDownloads {
  windows?: { name: string; url: string }
  macos?: { name: string; url: string }
  linuxAppImage?: { name: string; url: string }
  linuxDeb?: { name: string; url: string }
  tag: string
  htmlUrl: string
}

interface GitHubAsset {
  name: string
  browser_download_url: string
}

interface GitHubRelease {
  tag_name: string
  html_url: string
  assets: GitHubAsset[]
}

function pickWindows(assets: GitHubAsset[]): GitHubAsset | undefined {
  const exes = assets.filter((a) => a.name.toLowerCase().endsWith('.exe'))
  const setup = exes.find((a) => /setup|installer/i.test(a.name) && !/blockmap/i.test(a.name))
  return setup ?? exes.find((a) => !a.name.toLowerCase().includes('blockmap')) ?? exes[0]
}

function pickMacos(assets: GitHubAsset[]): GitHubAsset | undefined {
  const dmgs = assets.filter((a) => a.name.toLowerCase().endsWith('.dmg'))
  return dmgs[0]
}

function pickLinux(assets: GitHubAsset[]): { appImage?: GitHubAsset; deb?: GitHubAsset } {
  const appImage = assets.find((a) => a.name.endsWith('.AppImage'))
  const deb = assets.find((a) => a.name.endsWith('.deb'))
  return { appImage, deb }
}

export async function fetchLatestDownloads(): Promise<ReleaseDownloads | null> {
  const res = await fetch(URLS.apiLatest, {
    headers: { Accept: 'application/vnd.github+json' },
  })
  if (!res.ok) return null
  const data = (await res.json()) as GitHubRelease
  const assets = data.assets ?? []
  if (assets.length === 0) return null

  const win = pickWindows(assets)
  const mac = pickMacos(assets)
  const { appImage, deb } = pickLinux(assets)

  return {
    tag: data.tag_name,
    htmlUrl: data.html_url,
    windows: win ? { name: win.name, url: win.browser_download_url } : undefined,
    macos: mac ? { name: mac.name, url: mac.browser_download_url } : undefined,
    linuxAppImage: appImage
      ? { name: appImage.name, url: appImage.browser_download_url }
      : undefined,
    linuxDeb: deb ? { name: deb.name, url: deb.browser_download_url } : undefined,
  }
}

export function detectPlatform(): PlatformKey {
  if (typeof navigator === 'undefined') return 'linux'
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('win')) return 'windows'
  if (ua.includes('mac')) return 'macos'
  return 'linux'
}
