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
} from "@/features/marketing/lib/downloads";
import { URLS } from "@/features/marketing/lib/releases";

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
    <section id="desktop-downloads" aria-labelledby="download-heading" className="mb-14 scroll-mt-8">
      <h2 id="download-heading" className="mb-2 text-center text-sm font-medium text-[#b29bbd]">
        Desktop builds
      </h2>
      <p className="mb-6 text-center text-sm text-zinc-500">
        Download GitClaw for Windows, macOS, or Linux. Choose the installer for your machine.
      </p>

      {initialRelease === null && (
        <p className="mb-4 text-center text-sm leading-relaxed text-zinc-500">
          Desktop downloads are currently unavailable. Check the{" "}
          <a href={URLS.releases} className="text-zinc-400 underline underline-offset-2">
            GitHub releases
          </a>{" "}
          or see the{" "}
          <a
            href={`${URLS.quickstart}#install`}
            className="text-zinc-400 underline decoration-white/15 underline-offset-2 hover:text-[#b29bbd]"
          >
            Quickstart guide
          </a>{" "}
          for Docker and manual install, or run from source on{" "}
          <a
            href={URLS.repo}
            className="text-zinc-400 underline decoration-white/15 underline-offset-2 hover:text-[#b29bbd]"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          .
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <DownloadCard
          title="Windows"
          description="64-bit (x64) Windows installer. Run the .exe, choose an install location, then open GitClaw."
          href={initialRelease?.windows ? `${URLS.download}/windows` : undefined}
          fileLabel={initialRelease?.windows?.name}
          icon={WindowsIcon}
          highlight={suggested("windows")}
        />
        <DownloadCard
          title="macOS · Apple Silicon"
          description="For M-series Macs (arm64). Open the .dmg, drag GitClaw into Applications, then launch it."
          href={initialRelease?.macosArm64 ? `${URLS.download}/macos-arm64` : undefined}
          fileLabel={initialRelease?.macosArm64?.name}
          icon={AppleLogoIcon}
          highlight={suggested("macos")}
        />
        <DownloadCard
          title="macOS · Intel"
          description="For Intel Macs. Open the .dmg and drag GitClaw into Applications."
          href={initialRelease?.macosX64 ? `${URLS.download}/macos-x64` : undefined}
          fileLabel={initialRelease?.macosX64?.name}
          icon={AppleLogoIcon}
          highlight={false}
        />
        {initialRelease?.macos && !initialRelease.macosArm64 && !initialRelease.macosX64 && (
          <DownloadCard
            title="macOS"
            description="Open the .dmg and drag GitClaw into Applications. Check the release notes for supported Macs."
            href={initialRelease.macos.url}
            fileLabel={initialRelease.macos.name}
            icon={AppleLogoIcon}
            highlight={suggested("macos")}
          />
        )}
        <DownloadCard
          title="Linux (AppImage)"
          description="Portable app for x64 Linux. Make the file executable, then run it as your normal desktop user. Requires FUSE 2."
          href={initialRelease?.linuxAppImage ? `${URLS.download}/appimage` : undefined}
          fileLabel={initialRelease?.linuxAppImage?.name}
          icon={RobotIcon}
          highlight={suggested("linux")}
        />
        <DownloadCard
          title="Linux (.deb)"
          description="For x64 Debian / Ubuntu. Install with your package manager, then open GitClaw from your applications menu."
          href={initialRelease?.linuxDeb ? `${URLS.download}/deb` : undefined}
          fileLabel={initialRelease?.linuxDeb?.name}
          icon={RobotIcon}
          highlight={false}
        />
      </div>
      <p className="mt-4 text-center text-sm text-zinc-500">
        <a href={URLS.releases} className="text-zinc-400 underline underline-offset-2">
          View release notes and all available installers on GitHub
        </a>
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0a0e14]/80 p-5">
          <h3 className="text-base font-semibold text-zinc-50">Before you install</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Node.js, Docker, Git, and a separate database are not required for local
            reviews. GitClaw includes its own local PostgreSQL database.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            On a Mac, open Apple menu → About This Mac. Choose Apple Silicon if you
            see an Apple M-series chip, or Intel if you see an Intel processor.
          </p>
          <details className="mt-4 text-sm text-zinc-400">
            <summary className="cursor-pointer font-medium text-[#d1c6d6]">
              Linux installation commands
            </summary>
            <p className="mt-3 leading-relaxed">
              In the folder containing your download, replace VERSION with the
              version in the downloaded filename.
            </p>
            <p className="mt-3 font-medium">Debian / Ubuntu (recommended)</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs"><code>{"sudo apt install ./GitClaw-VERSION-x64.deb"}</code></pre>
            <p className="mt-3 font-medium">AppImage</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs"><code>{"chmod +x ./GitClaw-VERSION-x64.AppImage\n./GitClaw-VERSION-x64.AppImage"}</code></pre>
            <p className="mt-3 leading-relaxed">
              If AppImage reports a missing FUSE library, install FUSE 2 using
              your distribution’s package manager, or use the .deb on Debian / Ubuntu.
              Launch the app as your normal user, without sudo.
            </p>
          </details>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0a0e14]/80 p-5">
          <h3 className="text-base font-semibold text-zinc-50">Your first review</h3>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-zinc-400">
            <li>Open GitClaw. The first launch initializes the local database and may take about a minute.</li>
            <li>Choose an AI provider and enter its API key, or connect a running local model server and specify its model name.</li>
            <li>Open Local review, choose a source folder, and inspect the included files and AI destination.</li>
            <li>Confirm the review to send the selected code to your chosen model and see findings.</li>
          </ol>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Cloud models need internet access and may charge for API usage. Your
            source files are not executed or modified during a local review.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            GitHub, GitLab, and Bitbucket connections are optional for local reviews.
            For automatic pull request reviews, configure a provider and public
            webhook URL in Integrations, and keep GitClaw running.
          </p>
        </div>
      </div>
    </section>
  );
}
