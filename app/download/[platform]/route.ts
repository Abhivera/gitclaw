import { NextResponse } from "next/server";
import {
  resolvePlatformDownload,
  type DownloadTarget,
} from "@/features/marketing/lib/downloads";
import { fetchLatestDownloads } from "@/features/marketing/lib/downloads.server";
import { URLS } from "@/features/marketing/lib/releases";

const PLATFORM_ALIASES: Record<string, DownloadTarget> = {
  windows: "windows",
  win: "windows",
  macos: "macos",
  mac: "macos",
  "macos-arm64": "macos-arm64",
  "macos-x64": "macos-x64",
  linux: "linux",
  appimage: "appimage",
  deb: "deb",
};

type RouteParams = {
  params: Promise<{ platform: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { platform } = await params;
  const key = PLATFORM_ALIASES[platform.toLowerCase()];

  if (!key) {
    return NextResponse.redirect(new URL("/quickstart#desktop-downloads", _request.url));
  }
  if (key === "macos") {
    return NextResponse.redirect(new URL("/quickstart#desktop-downloads", _request.url));
  }

  const release = await fetchLatestDownloads();
  if (!release) {
    return NextResponse.redirect(URLS.releases);
  }

  const target = resolvePlatformDownload(release, key);
  if (!target?.url) {
    return NextResponse.redirect(URLS.releases);
  }

  return NextResponse.redirect(target.url);
}
