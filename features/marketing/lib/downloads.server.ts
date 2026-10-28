import "server-only";

import fs from "node:fs";
import path from "node:path";
import { getSiteUrl } from "@/lib/site-url";
import type { ReleaseDownloads } from "./downloads";
import { REPO } from "./releases";

interface SiteDownloadEntry {
  name: string;
  file: string;
}

interface SiteDownloadManifest {
  version: string;
  tag: string;
  publishedAt?: string;
  windows?: SiteDownloadEntry;
  macosArm64?: SiteDownloadEntry;
  macosX64?: SiteDownloadEntry;
  linuxAppImage?: SiteDownloadEntry;
  linuxDeb?: SiteDownloadEntry;
}

interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name: string;
  html_url: string;
  draft?: boolean;
  prerelease?: boolean;
  assets: GitHubAsset[];
}

export function getDownloadBaseUrl(): string {
  const configured = process.env.DOWNLOAD_BASE_URL?.replace(/\/$/, "");
  if (configured) {
    return configured;
  }
  return `${getSiteUrl()}/downloads`;
}

function toSiteDownload(
  baseUrl: string,
  entry: SiteDownloadEntry | undefined,
  options?: { requireLocalFile?: boolean },
): { name: string; url: string } | undefined {
  if (!entry) return undefined;
  if (options?.requireLocalFile) {
    const filePath = path.join(process.cwd(), "public", "downloads", entry.file);
    if (!fs.existsSync(filePath)) {
      return undefined;
    }
  }
  return {
    name: entry.name,
    url: `${baseUrl}/${encodeURIComponent(entry.file)}`,
  };
}

function parseSiteManifest(
  manifest: SiteDownloadManifest,
  baseUrl: string,
  options?: { requireLocalFile?: boolean },
): ReleaseDownloads | null {
  const windows = toSiteDownload(baseUrl, manifest.windows, options);
  const macosArm64 = toSiteDownload(baseUrl, manifest.macosArm64, options);
  const macosX64 = toSiteDownload(baseUrl, manifest.macosX64, options);
  const linuxAppImage = toSiteDownload(baseUrl, manifest.linuxAppImage, options);
  const linuxDeb = toSiteDownload(baseUrl, manifest.linuxDeb, options);

  if (!windows && !macosArm64 && !macosX64 && !linuxAppImage && !linuxDeb) {
    return null;
  }

  return {
    tag: manifest.tag,
    htmlUrl: `${getSiteUrl()}/quickstart#install`,
    source: "site",
    windows,
    macos: macosArm64 ?? macosX64,
    macosArm64,
    macosX64,
    linuxAppImage,
    linuxDeb,
  };
}

function mergeDownloads(
  preferred: ReleaseDownloads,
  fallback: ReleaseDownloads,
): ReleaseDownloads {
  const windows = preferred.windows ?? fallback.windows;
  const macosArm64 = preferred.macosArm64 ?? fallback.macosArm64;
  const macosX64 = preferred.macosX64 ?? fallback.macosX64;
  const linuxAppImage = preferred.linuxAppImage ?? fallback.linuxAppImage;
  const linuxDeb = preferred.linuxDeb ?? fallback.linuxDeb;

  return {
    tag: preferred.tag || fallback.tag,
    htmlUrl: preferred.htmlUrl || fallback.htmlUrl,
    source: preferred.source,
    windows,
    macos: macosArm64 ?? macosX64 ?? preferred.macos ?? fallback.macos,
    macosArm64,
    macosX64,
    linuxAppImage,
    linuxDeb,
  };
}

function isCompleteRelease(release: ReleaseDownloads): boolean {
  return Boolean(
    release.windows &&
      release.macosArm64 &&
      release.macosX64 &&
      release.linuxAppImage &&
      release.linuxDeb,
  );
}

function pickWindows(assets: GitHubAsset[]): GitHubAsset | undefined {
  const exes = assets.filter((a) => a.name.toLowerCase().endsWith(".exe"));
  const setup = exes.find(
    (a) => /setup|installer/i.test(a.name) && !/blockmap/i.test(a.name),
  );
  return (
    setup ?? exes.find((a) => !a.name.toLowerCase().includes("blockmap")) ?? exes[0]
  );
}

function pickMacosVariants(assets: GitHubAsset[]): {
  arm64?: GitHubAsset;
  x64?: GitHubAsset;
} {
  const dmgs = assets.filter((a) => a.name.toLowerCase().endsWith(".dmg"));
  return {
    arm64: dmgs.find((a) => /arm64|aarch64|universal/i.test(a.name)),
    x64: dmgs.find((a) => /x64|x86_64|intel|universal/i.test(a.name)),
  };
}

function toGitHubDownload(asset: GitHubAsset | undefined) {
  return asset ? { name: asset.name, url: asset.browser_download_url } : undefined;
}

function pickLinux(assets: GitHubAsset[]): {
  appImage?: GitHubAsset;
  deb?: GitHubAsset;
} {
  const appImage = assets.find((a) => /\.appimage$/i.test(a.name));
  const deb = assets.find((a) => /\.deb$/i.test(a.name));
  return { appImage, deb };
}

function parseGitHubRelease(data: GitHubRelease): ReleaseDownloads | null {
  const assets = data.assets ?? [];
  if (assets.length === 0) return null;

  const win = pickWindows(assets);
  const { arm64: macArm, x64: macIntel } = pickMacosVariants(assets);
  const { appImage, deb } = pickLinux(assets);
  const genericMac = assets.find((a) => /\.dmg$/i.test(a.name) && !/arm64|aarch64|x64|x86_64|intel/i.test(a.name));
  if (!win && !macArm && !macIntel && !genericMac && !appImage && !deb) return null;
  const macosArm64 = toGitHubDownload(macArm);
  const macosX64 = toGitHubDownload(macIntel);

  return {
    tag: data.tag_name,
    htmlUrl: data.html_url,
    source: "github",
    windows: toGitHubDownload(win),
    macos: macosArm64 ?? macosX64 ?? toGitHubDownload(genericMac),
    macosArm64,
    macosX64,
    linuxAppImage: toGitHubDownload(appImage),
    linuxDeb: toGitHubDownload(deb),
  };
}

function readLocalSiteManifest(): ReleaseDownloads | null {
  try {
    const manifestPath = path.join(process.cwd(), "public", "downloads", "downloads.json");
    if (!fs.existsSync(manifestPath)) {
      return null;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as SiteDownloadManifest;
    // Only advertise binaries that are actually present (gitignore excludes installers).
    return parseSiteManifest(manifest, getDownloadBaseUrl(), { requireLocalFile: true });
  } catch {
    return null;
  }
}

async function fetchSiteDownloads(): Promise<ReleaseDownloads | null> {
  // The checked-in manifest can outlive its ignored installers. Only trust a
  // remote manifest when a separate download host was explicitly configured.
  if (!process.env.DOWNLOAD_BASE_URL) return null;
  const baseUrl = getDownloadBaseUrl();

  try {
    const res = await fetch(`${baseUrl}/downloads.json`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;

    const manifest = (await res.json()) as SiteDownloadManifest;
    return parseSiteManifest(manifest, baseUrl);
  } catch {
    return null;
  }
}

async function fetchGitHubDownloads(): Promise<ReleaseDownloads | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=20`, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const releases = (await res.json()) as GitHubRelease[];
    for (const release of releases) {
      if (release.draft || release.prerelease) continue;
      const downloads = parseGitHubRelease(release);
      if (downloads) {
        return downloads;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function fetchLatestDownloads(): Promise<ReleaseDownloads | null> {
  const site = readLocalSiteManifest() ?? (await fetchSiteDownloads());

  // Partial site manifests (e.g. Windows-only) must not block GitHub fallbacks
  // for missing macOS/Linux installers.
  if (site && isCompleteRelease(site)) {
    return site;
  }

  const github = await fetchGitHubDownloads();
  if (site && github) {
    return mergeDownloads(site, github);
  }

  return site ?? github;
}
