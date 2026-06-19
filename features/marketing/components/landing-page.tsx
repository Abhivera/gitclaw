"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  AppleLogoIcon,
  ArrowUpRightIcon,
  GitPullRequestIcon,
  RobotIcon,
  ShieldIcon,
  SparkleIcon,
  TerminalIcon,
  WrenchIcon,
} from "@phosphor-icons/react";
import { DownloadCard } from "@/features/marketing/components/download-card";
import { WindowsIcon } from "@/features/marketing/components/windows-icon";
import {
  detectPlatform,
  REPO,
  type PlatformKey,
  type ReleaseDownloads,
  URLS,
} from "@/features/marketing/lib/releases";

type LandingPageProps = {
  initialRelease: ReleaseDownloads | null;
};

function subscribeToPlatform() {
  return () => {};
}

function getServerPlatform(): PlatformKey {
  return "linux";
}

function getClientPlatform(): PlatformKey {
  return detectPlatform();
}

export function LandingPage({ initialRelease }: LandingPageProps) {
  const platform = useSyncExternalStore(
    subscribeToPlatform,
    getClientPlatform,
    getServerPlatform,
  );
  const release = initialRelease;

  function suggested(p: PlatformKey): boolean {
    return platform === p;
  }

  return (
    <div className="marketing-landing min-h-screen bg-[#070a0f] text-zinc-100">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.5]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 85% 50% at 50% -20%, rgba(141, 110, 158, 0.2), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(80, 47, 76, 0.18), transparent 45%)",
        }}
      />

      <main className="relative mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <header className="mb-14 text-center sm:mb-16">
          <div className="mb-6 flex justify-center">
            <div className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/[0.08] shadow-lg shadow-black/40 sm:p-5">
              <Image
                src="/logo2.svg"
                alt="GitClaw"
                width={260}
                height={174}
                className="mx-auto h-auto w-[min(100%,220px)] object-contain sm:w-[260px]"
                priority
              />
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Self-hosted AI code reviewer for your pull requests
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg leading-relaxed text-zinc-400">
            <strong className="font-medium text-zinc-300">GitClaw</strong> is an open-source,
            self-hosted AI reviewer — like CodeRabbit, but on your infrastructure. It automatically
            analyzes pull requests and delivers feedback on{" "}
            <strong className="font-medium text-zinc-300">code quality</strong>,{" "}
            <strong className="font-medium text-zinc-300">security</strong>,{" "}
            <strong className="font-medium text-zinc-300">performance</strong>, and{" "}
            <strong className="font-medium text-zinc-300">maintainability</strong> directly inside{" "}
            <strong className="font-medium text-zinc-300">GitHub</strong>,{" "}
            <strong className="font-medium text-zinc-300">GitLab</strong>, and{" "}
            <strong className="font-medium text-zinc-300">Bitbucket</strong>.
          </p>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-500">
            Open source (MIT). Source, issues, and releases on{" "}
            <a
              href={URLS.repo}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#b29bbd] underline decoration-[#8d6e9e]/40 underline-offset-2 transition hover:text-[#d1c6d6] hover:decoration-[#8d6e9e]/70"
            >
              github.com/{REPO}
            </a>
            .
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#8d6e9e]/35 bg-[#8d6e9e]/15 px-4 py-2 font-medium text-zinc-100 transition hover:border-[#8d6e9e]/55 hover:bg-[#8d6e9e]/25"
            >
              Sign in to dashboard
            </Link>
            <a
              href={URLS.repo}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-zinc-300 transition hover:border-[#8d6e9e]/35 hover:text-white"
            >
              Open source on GitHub
              <ArrowUpRightIcon className="h-3.5 w-3.5 opacity-70" aria-hidden />
            </a>
            <a
              href={URLS.releasesLatest}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
            >
              All releases
            </a>
          </div>
        </header>

        <section
          aria-labelledby="features-heading"
          className="mb-14 rounded-2xl border border-white/[0.08] bg-[#0a0e14]/80 px-5 py-6 sm:px-8 sm:py-7"
        >
          <h2
            id="features-heading"
            className="text-center text-base font-semibold tracking-tight text-white"
          >
            AI reviews where your team already works
          </h2>
          <ul className="mx-auto mt-5 max-w-xl space-y-3 text-sm leading-relaxed text-zinc-400">
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-[#8d6e9e]" aria-hidden>
                <GitPullRequestIcon className="h-4 w-4" />
              </span>
              <span>
                <strong className="text-zinc-300">Automatic PR analysis</strong> — hooks into new
                and updated pull requests, reads the diff, and posts inline comments on the lines
                that matter.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-[#8d6e9e]" aria-hidden>
                <ShieldIcon className="h-4 w-4" />
              </span>
              <span>
                <strong className="text-zinc-300">Security &amp; code quality</strong> — surfaces
                vulnerabilities, risky patterns, and style issues before code merges.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-[#8d6e9e]" aria-hidden>
                <SparkleIcon className="h-4 w-4" />
              </span>
              <span>
                <strong className="text-zinc-300">Performance insights</strong> — flags inefficient
                hot paths, unnecessary work, and regressions that slow your app down.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-[#8d6e9e]" aria-hidden>
                <WrenchIcon className="h-4 w-4" />
              </span>
              <span>
                <strong className="text-zinc-300">Maintainability feedback</strong> — highlights
                complexity, duplication, and design choices that will cost you later.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-[#8d6e9e]" aria-hidden>
                <RobotIcon className="h-4 w-4" />
              </span>
              <span>
                <strong className="text-zinc-300">Self-hosted &amp; multi-forge</strong> — run on
                your own servers with your models and keys. Works with GitHub, GitLab (including
                self-managed), and Bitbucket.
              </span>
            </li>
          </ul>
        </section>

        <section
          aria-labelledby="self-host-heading"
          className="mb-14 rounded-2xl border border-white/[0.08] bg-[#0a0e14]/90 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
        >
          <div className="mb-4 flex items-center gap-2 text-[#b29bbd]">
            <TerminalIcon className="h-4 w-4" aria-hidden />
            <h2 id="self-host-heading" className="text-sm font-medium">
              Self-host on your infrastructure
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">
            Download the desktop server for your platform below, or clone the repo and follow the
            setup guide to connect your forge and start reviewing pull requests in minutes.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-black/40 p-4 font-mono text-xs leading-relaxed text-zinc-300 ring-1 ring-white/[0.06] sm:text-sm">
            {`git clone https://github.com/${REPO}.git\ncd gitclaw\n# See README for forge webhooks, API keys, and model config`}
          </pre>
          <p className="mt-4 text-xs text-zinc-600">
            Full instructions in the{" "}
            <a
              href={URLS.repo}
              className="text-[#8d6e9e] hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              open-source repository
            </a>
            .
          </p>
        </section>

        <section aria-labelledby="download-heading" className="mb-14">
          <h2 id="download-heading" className="mb-2 text-center text-sm font-medium text-[#b29bbd]">
            Download
          </h2>
          <p className="mb-6 text-center text-sm text-zinc-500">
            Install GitClaw on Windows, macOS, or Linux to run your self-hosted AI reviewer locally.
          </p>
          {release === null && (
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
              . Push a version tag (e.g. <code className="text-zinc-400">v1.0.0</code>) to build
              artifacts, or run from source via the{" "}
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
        </section>

        <footer className="mt-16 text-center text-xs text-zinc-600">
          <p>
            MIT License · open source ·{" "}
            <a
              href={URLS.repo}
              className="text-zinc-500 hover:text-[#b29bbd]"
              target="_blank"
              rel="noreferrer"
            >
              {REPO}
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
