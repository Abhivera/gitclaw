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
): { name: string; url: string } | undefined {
  if (!entry) return undefined;
  return {
    name: entry.name,
    url: `${baseUrl}/${encodeURIComponent(entry.file)}`,
  };
}

function parseSiteManifest(manifest: SiteDownloadManifest, baseUrl: string): ReleaseDownloads | null {
  const windows = toSiteDownload(baseUrl, manifest.windows);
  const macosArm64 = toSiteDownload(baseUrl, manifest.macosArm64);
  const macosX64 = toSiteDownload(baseUrl, manifest.macosX64);
  const linuxAppImage = toSiteDownload(baseUrl, manifest.linuxAppImage);
  const linuxDeb = toSiteDownload(baseUrl, manifest.linuxDeb);

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
    arm64: dmgs.find((a) => /arm64/i.test(a.name)),
    x64: dmgs.find((a) => /x64|intel/i.test(a.name)) ?? dmgs[0],
  };
}

function toGitHubDownload(asset: GitHubAsset | undefined) {
  return asset ? { name: asset.name, url: asset.browser_download_url } : undefined;
}

function pickLinux(assets: GitHubAsset[]): {
  appImage?: GitHubAsset;
  deb?: GitHubAsset;
} {
  const appImage = assets.find((a) => a.name.endsWith(".AppImage"));
  const deb = assets.find((a) => a.name.endsWith(".deb"));
  return { appImage, deb };
}

function parseGitHubRelease(data: GitHubRelease): ReleaseDownloads | null {
  const assets = data.assets ?? [];
  if (assets.length === 0) return null;

  const win = pickWindows(assets);
  const { arm64: macArm, x64: macIntel } = pickMacosVariants(assets);
  const { appImage, deb } = pickLinux(assets);
  const macosArm64 = toGitHubDownload(macArm);
  const macosX64 = toGitHubDownload(macIntel);

  return {
    tag: data.tag_name,
    htmlUrl: data.html_url,
    source: "github",
    windows: toGitHubDownload(win),
    macos: macosArm64 ?? macosX64,
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
    return parseSiteManifest(manifest, getDownloadBaseUrl());
  } catch {
    return null;
  }
}

async function fetchSiteDownloads(): Promise<ReleaseDownloads | null> {
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
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=20`, {
    headers: { Accept: "application/vnd.github+json" },
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;

  const releases = (await res.json()) as GitHubRelease[];
  for (const release of releases) {
    const downloads = parseGitHubRelease(release);
    if (downloads) {
      return downloads;
    }
  }

  return null;
}

export async function fetchLatestDownloads(): Promise<ReleaseDownloads | null> {
  const local = readLocalSiteManifest();
  if (local) {
    return local;
  }

  const site = await fetchSiteDownloads();
  if (site) {
    return site;
  }

  return fetchGitHubDownloads();
}
