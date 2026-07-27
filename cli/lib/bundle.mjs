import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as tar from "tar";
import { getAppsDir } from "./paths.mjs";

const packageRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export function getPackageVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"));
  return pkg.version;
}

const EXTRACT_MARKER = ".gitclaw-extract-complete";

/**
 * Extracts the bundled Next.js standalone server into `~/.gitclaw/app/<version>`
 * on first run. Global npm install locations may be read-only, so the bundle is
 * unpacked into the user's home directory instead of the package directory.
 */
export async function ensureAppBundle() {
  const version = getPackageVersion();
  const appDir = path.join(getAppsDir(), version);
  const marker = path.join(appDir, EXTRACT_MARKER);

  if (fs.existsSync(marker)) {
    return appDir;
  }

  const tarball = path.join(packageRoot, "standalone.tgz");
  if (!fs.existsSync(tarball)) {
    throw new Error(
      "standalone.tgz is missing from the gitclaw-cli package. " +
        "If you are running from the repository, build it first with `npm run cli:build`.",
    );
  }

  console.log(`[gitclaw] Extracting server bundle (v${version}) to ${appDir} ...`);
  fs.rmSync(appDir, { recursive: true, force: true });
  fs.mkdirSync(appDir, { recursive: true });
  await tar.extract({ file: tarball, cwd: appDir });
  fs.writeFileSync(marker, new Date().toISOString(), "utf8");

  pruneOldVersions(version);

  return appDir;
}

function pruneOldVersions(currentVersion) {
  const appsDir = getAppsDir();

  for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === currentVersion) {
      continue;
    }

    try {
      fs.rmSync(path.join(appsDir, entry.name), { recursive: true, force: true });
      console.log(`[gitclaw] Removed old server bundle v${entry.name}`);
    } catch {
      // A previous version may still be running; leave it in place.
    }
  }
}
