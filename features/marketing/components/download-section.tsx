"use client";

import { useSyncExternalStore } from "react";
import {
  AppleLogoIcon,
  RobotIcon,
} from "@phosphor-icons/react";
import { DownloadCard } from "@/features/marketing/components/download-card";
import { WindowsIcon } from "@/features/marketing/components/windows-icon";
import {
  detectPlatform,
  type PlatformKey,
  type ReleaseDownloads,
  URLS,
} from "@/features/marketing/lib/releases";

function subscribeToPlatform() {
  return () => {};
}

function getServerPlatform(): PlatformKey {
  return "linux";
}

function getClientPlatform(): PlatformKey {
  return detectPlatform();
}

type DownloadSectionProps = {
  initialRelease: ReleaseDownloads | null;
};

export function DownloadSection({ initialRelease }: DownloadSectionProps) {
  const platform = useSyncExternalStore(
    subscribeToPlatform,
    getClientPlatform,
    getServerPlatform,
  );

  function suggested(p: PlatformKey): boolean {
    return platform === p;
  }

  return (
    <section aria-labelledby="download-heading" className="mb-14">
      <h2 id="download-heading" className="mb-2 text-center text-sm font-medium text-[#b29bbd]">
        Desktop builds
      </h2>
      <p className="mb-6 text-center text-sm text-zinc-500">
        Prefer a packaged app? Download GitClaw for Windows, macOS, or Linux when installers are
        published on GitHub Releases.
      </p>

      {initialRelease === null && (
        <p className="mb-4 text-center text-sm leading-relaxed text-zinc-500">
          No release with installer files on GitHub yet — the cards below open{" "}
          <a
            href={URLS.releasesLatest}
            className="text-zinc-400 underline decoration-white/15 underline-offset-2 hover:text-[#b29bbd]"
            target="_blank"
            rel="noreferrer"
          >
            Releases
          </a>
          . Self-host with Docker above, or run from source via the{" "}
          <a
            href={URLS.repo}
            className="text-zinc-400 underline decoration-white/15 underline-offset-2 hover:text-[#b29bbd]"
            target="_blank"
            rel="noreferrer"
          >
            repo
          </a>
          .
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <DownloadCard
          title="Windows"
          description="NSIS installer (.exe) for running GitClaw on Windows."
          href={initialRelease?.windows?.url ?? URLS.releasesLatest}
          fileLabel={initialRelease?.windows?.name}
          icon={WindowsIcon}
          highlight={suggested("windows")}
        />
        <DownloadCard
          title="macOS"
          description="Disk image (.dmg). Open and drag GitClaw into Applications."
          href={initialRelease?.macos?.url ?? URLS.releasesLatest}
          fileLabel={initialRelease?.macos?.name}
          icon={AppleLogoIcon}
          highlight={suggested("macos")}
        />
        <DownloadCard
          title="Linux (AppImage)"
          description="Portable binary. chmod +x then run."
          href={initialRelease?.linuxAppImage?.url ?? URLS.releasesLatest}
          fileLabel={initialRelease?.linuxAppImage?.name}
          icon={RobotIcon}
          highlight={suggested("linux")}
        />
        <DownloadCard
          title="Linux (.deb)"
          description="For Debian / Ubuntu. Install with your package manager."
          href={initialRelease?.linuxDeb?.url ?? URLS.releasesLatest}
          fileLabel={initialRelease?.linuxDeb?.name}
          icon={RobotIcon}
          highlight={false}
        />
      </div>
    </section>
  );
}
