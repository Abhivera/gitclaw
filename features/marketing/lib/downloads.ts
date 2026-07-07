export type PlatformKey = "windows" | "macos" | "linux";

export interface ReleaseDownloads {
  windows?: { name: string; url: string };
  macos?: { name: string; url: string };
  macosArm64?: { name: string; url: string };
  macosX64?: { name: string; url: string };
  linuxAppImage?: { name: string; url: string };
  linuxDeb?: { name: string; url: string };
  tag: string;
  htmlUrl: string;
  source: "site" | "github";
}

export function detectPlatform(): PlatformKey {
  if (typeof navigator === "undefined") return "linux";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "macos";
  return "linux";
}

export function resolveMacDownload(
  release: ReleaseDownloads | null,
): { name: string; url: string } | undefined {
  if (!release) return undefined;

  if (typeof navigator !== "undefined") {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("mac") && ua.includes("intel") && release.macosX64) {
      return release.macosX64;
    }
  }

  return release.macosArm64 ?? release.macosX64 ?? release.macos;
}

export function resolvePlatformDownload(
  release: ReleaseDownloads | null,
  platform: PlatformKey,
): { name: string; url: string } | undefined {
  if (!release) return undefined;

  switch (platform) {
    case "windows":
      return release.windows;
    case "macos":
      return resolveMacDownload(release);
    case "linux":
      return release.linuxAppImage ?? release.linuxDeb;
  }
}

export function getPrimaryDownloadUrl(
  release: ReleaseDownloads | null,
  fallbackUrl: string,
): string {
  if (!release) {
    return fallbackUrl;
  }

  return (
    release.windows?.url ??
    release.macosArm64?.url ??
    release.macosX64?.url ??
    release.linuxAppImage?.url ??
    release.linuxDeb?.url ??
    release.htmlUrl
  );
}
