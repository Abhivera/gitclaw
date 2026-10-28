export type PlatformKey = "windows" | "macos" | "linux";
export type DownloadTarget = PlatformKey | "appimage" | "deb" | "macos-arm64" | "macos-x64";

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

  // Modern Apple Silicon browsers can also advertise "Intel" in their user agent.
  // The download screen offers explicit architectures instead of guessing from it.
  return release.macosArm64 ?? release.macosX64 ?? release.macos;
}

export function resolvePlatformDownload(
  release: ReleaseDownloads | null,
  platform: DownloadTarget,
): { name: string; url: string } | undefined {
  if (!release) return undefined;

  switch (platform) {
    case "windows":
      return release.windows;
    case "macos":
      return resolveMacDownload(release);
    case "macos-arm64":
      return release.macosArm64;
    case "macos-x64":
      return release.macosX64;
    case "linux":
      return release.linuxAppImage ?? release.linuxDeb;
    case "appimage":
      return release.linuxAppImage;
    case "deb":
      return release.linuxDeb;
  }
}
