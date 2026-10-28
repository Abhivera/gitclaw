import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextResponse } from "next/server";
import { DownloadSection } from "../features/marketing/components/download-section";
import * as downloadHelpers from "../features/marketing/lib/downloads";
import { URLS } from "../features/marketing/lib/releases";
import { resolvePlatformDownload, type ReleaseDownloads } from "../features/marketing/lib/downloads";

// Isolate server-only imports, disk availability, and network responses.
function loadDownloads(options: {
  files?: string[];
  releases?: unknown[];
  offline?: boolean;
} = {}) {
  const requests: string[] = [];
  const exports: { fetchLatestDownloads?: () => Promise<ReleaseDownloads | null> } = {};
  const manifest = { tag: "v0.1.1", windows: { name: "setup.exe", file: "setup.exe" } };
  const source = readFileSync(new URL("../features/marketing/lib/downloads.server.ts", import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText, {
    exports,
    process: { env: {}, cwd: () => "/site" },
    require: (name: string) => {
      if (name === "server-only") return {};
      if (name === "node:path") return path;
      if (name === "node:fs") return {
        existsSync: (file: string) => file.endsWith("downloads.json") || (options.files ?? []).includes(path.basename(file)),
        readFileSync: () => JSON.stringify(manifest),
      };
      if (name === "./releases") return { REPO: "Abhivera/gitclaw" };
      if (name === "@/lib/site-url") return { getSiteUrl: () => "https://gitclaw.test" };
      throw new Error(`Unexpected import: ${name}`);
    },
    fetch: async (url: string) => {
      requests.push(url);
      if (options.offline) throw new Error("Network unavailable");
      return { ok: true, json: async () => options.releases ?? [] };
    },
  });
  return { fetch: exports.fetchLatestDownloads!, requests };
}

const release = (names: string[], extra = {}) => ({
  tag_name: "v0.1.2", html_url: "https://github.com/Abhivera/gitclaw/releases/tag/v0.1.2",
  assets: names.map((name) => ({ name, browser_download_url: `https://downloads.test/${name}` })),
  ...extra,
});

test("missing local installers are not advertised from the checked-in manifest", async () => {
  const downloads = loadDownloads();
  assert.equal(await downloads.fetch(), null);
  assert.equal(downloads.requests.length, 1);
  assert.match(downloads.requests[0], /^https:\/\/api.github.com\//);
});

test("GitHub outages preserve available local installers", async () => {
  const downloads = loadDownloads({ files: ["setup.exe"], offline: true });
  assert.equal((await downloads.fetch())?.windows?.url, "https://gitclaw.test/downloads/setup.exe");
  assert.equal(await loadDownloads({ offline: true }).fetch(), null);
});

test("stable desktop assets fill missing platforms and unrelated releases are skipped", async () => {
  const downloads = await loadDownloads({ files: ["setup.exe"], releases: [
    release(["preview-arm64.dmg"], { prerelease: true }),
    release(["draft-arm64.dmg"], { draft: true }),
    release(["cli.tgz"]),
    release(["GitClaw-arm64.dmg", "GitClaw-x64.dmg", "GitClaw.AppImage", "GitClaw.deb"]),
  ] }).fetch();
  assert.equal(downloads?.windows?.name, "setup.exe");
  assert.equal(downloads?.macosArm64?.name, "GitClaw-arm64.dmg");
  assert.equal(downloads?.macosX64?.name, "GitClaw-x64.dmg");
  assert.equal(downloads?.linuxAppImage?.name, "GitClaw.AppImage");
  assert.equal(downloads?.linuxDeb?.name, "GitClaw.deb");
});

test("universal and unlabelled macOS installers remain available", async () => {
  const universal = await loadDownloads({ releases: [release(["GitClaw-universal.dmg"])] }).fetch();
  assert.equal(universal?.macosArm64?.name, "GitClaw-universal.dmg");
  assert.equal(universal?.macosX64?.name, "GitClaw-universal.dmg");
  const generic = await loadDownloads({ releases: [release(["GitClaw.dmg"])] }).fetch();
  assert.equal(generic?.macos?.name, "GitClaw.dmg");
});

test("format-specific Linux links never download the other package format", () => {
  const downloads: ReleaseDownloads = {
    tag: "v1", htmlUrl: "", source: "github", linuxDeb: { name: "app.deb", url: "https://downloads.test/app.deb" },
  };
  assert.equal(resolvePlatformDownload(downloads, "appimage"), undefined);
  assert.equal(resolvePlatformDownload(downloads, "linux"), downloads.linuxDeb);
  assert.equal(resolvePlatformDownload(downloads, "deb"), downloads.linuxDeb);
});

function loadDownloadRoute(downloads: ReleaseDownloads | null) {
  type Handler = (request: Request, context: { params: Promise<{ platform: string }> }) => Promise<Response>;
  const exports: { GET?: Handler } = {};
  const source = readFileSync(new URL("../app/download/[platform]/route.ts", import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, {
    exports, URL,
    require: (name: string) => {
      if (name === "next/server") return { NextResponse };
      if (name.endsWith("/downloads")) return downloadHelpers;
      if (name.endsWith("/downloads.server")) return { fetchLatestDownloads: async () => downloads };
      if (name.endsWith("/releases")) return { URLS };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return (platform: string) => exports.GET!(new Request(`https://preview.test/download/${platform}`), {
    params: Promise.resolve({ platform }),
  });
}

const completeDownloads: ReleaseDownloads = {
  tag: "v0.1.2", htmlUrl: URLS.releases, source: "github",
  windows: { name: "setup.exe", url: "https://downloads.test/setup.exe" },
  macosArm64: { name: "arm64.dmg", url: "https://downloads.test/arm64.dmg" },
  macosX64: { name: "x64.dmg", url: "https://downloads.test/x64.dmg" },
  linuxAppImage: { name: "app.AppImage", url: "https://downloads.test/app.AppImage" },
  linuxDeb: { name: "app.deb", url: "https://downloads.test/app.deb" },
};

test("every frontend installer link redirects to its exact published asset", async () => {
  const html = renderToStaticMarkup(createElement(DownloadSection, { initialRelease: completeDownloads }));
  const route = loadDownloadRoute(completeDownloads);
  const targets = {
    windows: completeDownloads.windows, "macos-arm64": completeDownloads.macosArm64,
    "macos-x64": completeDownloads.macosX64, appimage: completeDownloads.linuxAppImage,
    deb: completeDownloads.linuxDeb,
  };
  for (const [platform, asset] of Object.entries(targets)) {
    assert.ok(html.includes(`href="/download/${platform}"`));
    const response = await route(platform);
    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), asset?.url);
  }
  assert.ok(html.includes("Your first review"));
  assert.ok(html.includes("Linux installation commands"));
});

test("unavailable builds have no download links and direct requests have a valid fallback", async () => {
  const html = renderToStaticMarkup(createElement(DownloadSection, { initialRelease: null }));
  assert.ok(!html.includes('href="/download/'));
  assert.equal((html.match(/Installer currently unavailable/g) ?? []).length, 5);
  const response = await loadDownloadRoute(null)("windows");
  assert.equal(response.headers.get("location"), URLS.releases);
  const missingFormat = await loadDownloadRoute({ ...completeDownloads, linuxAppImage: undefined })("appimage");
  assert.equal(missingFormat.headers.get("location"), URLS.releases);
});

test("Mac aliases open the architecture selector on the current host", async () => {
  for (const platform of ["mac", "macos", "unknown"]) {
    const response = await loadDownloadRoute(completeDownloads)(platform);
    assert.equal(response.headers.get("location"), "https://preview.test/quickstart#desktop-downloads");
  }
  for (const [alias, asset] of [["win", completeDownloads.windows], ["WINDOWS", completeDownloads.windows], ["linux", completeDownloads.linuxAppImage]] as const) {
    assert.equal((await loadDownloadRoute(completeDownloads)(alias)).headers.get("location"), asset?.url);
  }
});
