export const REPO = "Abhivera/gitclaw" as const;

export const URLS = {
  releasesLatest: `https://github.com/${REPO}/releases/latest`,
  repo: `https://github.com/${REPO}`,
  quickstart: "/quickstart",
  download: "/download",
  apiLatest: `https://api.github.com/repos/${REPO}/releases/latest`,
  rawMain: `https://raw.githubusercontent.com/${REPO}/main`,
} as const;

export type { PlatformKey, ReleaseDownloads } from "./downloads";
export {
  detectPlatform,
  getPrimaryDownloadUrl,
  resolveMacDownload,
  resolvePlatformDownload,
} from "./downloads";
