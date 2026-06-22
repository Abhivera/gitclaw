"use client";

import { useEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import {
  AppleLogoIcon,
  RobotIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
import { DownloadCard } from "@/features/marketing/components/download-card";
import { WindowsIcon } from "@/features/marketing/components/windows-icon";
import {
  detectPlatform,
  fetchLatestDownloads,
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
  initialRelease?: ReleaseDownloads | null;
};

export function DownloadSection({ initialRelease }: DownloadSectionProps) {
  const platform = useSyncExternalStore(
    subscribeToPlatform,
    getClientPlatform,
    getServerPlatform,
  );
  const [release, setRelease] = useState<ReleaseDownloads | null | undefined>(
    initialRelease,
  );
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (initialRelease !== undefined) {
      return;
    }

    let cancelled = false;

    fetchLatestDownloads()
      .then((data) => {
        if (!cancelled) {
          setRelease(data);
          setLoadFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRelease(null);
          setLoadFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialRelease]);

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

      {release === undefined ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-[#0a0e14]/60 py-16">
          <SpinnerIcon className="h-8 w-8 animate-spin text-[#8d6e9e]/70" aria-hidden />
          <span className="text-sm text-zinc-500">Loading latest release…</span>
        </div>
      ) : (
        <>
          {loadFailed && (
            <p className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100/90">
              Could not load release info from GitHub. The download cards still open the{" "}
              <a
                href={URLS.releasesLatest}
                className="font-medium text-amber-50 underline underline-offset-2 hover:text-white"
                target="_blank"
                rel="noreferrer"
              >
                releases page
              </a>
              .
            </p>
          )}
          {release === null && !loadFailed && (
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
              href={release?.windows?.url ?? URLS.releasesLatest}
              fileLabel={release?.windows?.name}
              icon={WindowsIcon}
              highlight={suggested("windows")}
            />
            <DownloadCard
              title="macOS"
              description="Disk image (.dmg). Open and drag GitClaw into Applications."
              href={release?.macos?.url ?? URLS.releasesLatest}
              fileLabel={release?.macos?.name}
              icon={AppleLogoIcon}
              highlight={suggested("macos")}
            />
            <DownloadCard
              title="Linux (AppImage)"
              description="Portable binary. chmod +x then run."
              href={release?.linuxAppImage?.url ?? URLS.releasesLatest}
              fileLabel={release?.linuxAppImage?.name}
              icon={RobotIcon}
              highlight={suggested("linux")}
            />
            <DownloadCard
              title="Linux (.deb)"
              description="For Debian / Ubuntu. Install with your package manager."
              href={release?.linuxDeb?.url ?? URLS.releasesLatest}
              fileLabel={release?.linuxDeb?.name}
              icon={RobotIcon}
              highlight={false}
            />
          </div>
        </>
      )}
    </section>
  );
}
