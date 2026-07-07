import { NextResponse } from "next/server";
import { fetchLatestDownloads } from "@/features/marketing/lib/downloads.server";
import {
  resolveMacDownload,
  type PlatformKey,
} from "@/features/marketing/lib/downloads";
import { getSiteUrl } from "@/lib/site-url";

const PLATFORM_ALIASES: Record<string, PlatformKey | "deb"> = {
  windows: "windows",
  win: "windows",
  macos: "macos",
  mac: "macos",
  linux: "linux",
  appimage: "linux",
  deb: "deb",
};

type RouteParams = {
  params: Promise<{ platform: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { platform } = await params;
  const key = PLATFORM_ALIASES[platform.toLowerCase()];

  if (!key) {
    return NextResponse.redirect(new URL("/quickstart#install", getSiteUrl()));
  }

  const release = await fetchLatestDownloads();
  if (!release) {
    return NextResponse.redirect(new URL("https://github.com/Abhivera/gitclaw/releases/latest"));
  }

  let target: { url: string } | undefined;
  if (key === "deb") {
    target = release.linuxDeb;
  } else if (key === "macos") {
    target = resolveMacDownload(release);
  } else if (key === "windows") {
    target = release.windows;
  } else {
    target = release.linuxAppImage ?? release.linuxDeb;
  }

  if (!target?.url) {
    return NextResponse.redirect(new URL("/quickstart#install", getSiteUrl()));
  }

  return NextResponse.redirect(target.url);
}
