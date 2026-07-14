import { NextResponse } from "next/server";
import {
  resolvePlatformDownload,
  type DownloadTarget,
} from "@/features/marketing/lib/downloads";
import { fetchLatestDownloads } from "@/features/marketing/lib/downloads.server";
import { URLS } from "@/features/marketing/lib/releases";
import { getSiteUrl } from "@/lib/site-url";

const PLATFORM_ALIASES: Record<string, DownloadTarget> = {
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
    return NextResponse.redirect(URLS.releasesLatest);
  }

  const target = resolvePlatformDownload(release, key);
  if (!target?.url) {
    return NextResponse.redirect(new URL("/quickstart#install", getSiteUrl()));
  }

  return NextResponse.redirect(target.url);
}
