/**
 * Packs the prepared `.next/standalone` bundle into `cli/standalone.tgz` for
 * publishing. npm always excludes nested `node_modules` directories from
 * published packages, so the bundle is shipped as a tarball and extracted to
 * `~/.gitclaw/app/<version>` on first run.
 *
 * Run from the repo root after `cli:build:next`: `npm run cli:pack`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as tar from "tar";

const cliDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.join(cliDir, "..");
const standaloneDir = path.join(rootDir, ".next", "standalone");

if (!fs.existsSync(path.join(standaloneDir, "server.js"))) {
  throw new Error("`.next/standalone` not found. Run `npm run cli:build:next` first.");
}

// Keep the published package version in lockstep with the repo version.
const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const cliPkgPath = path.join(cliDir, "package.json");
const cliPkg = JSON.parse(fs.readFileSync(cliPkgPath, "utf8"));

if (cliPkg.version !== rootPkg.version) {
  cliPkg.version = rootPkg.version;
  fs.writeFileSync(cliPkgPath, `${JSON.stringify(cliPkg, null, 2)}\n`, "utf8");
  console.log(`[cli] Synced package version to ${rootPkg.version}`);
}

const tarballPath = path.join(cliDir, "standalone.tgz");
fs.rmSync(tarballPath, { force: true });

// Desktop installers in public/downloads (hundreds of MB) are a website
// feature; keep only the manifest out of that folder.
function filter(entryPath) {
  const normalized = entryPath.replaceAll("\\", "/").replace(/^\.\//, "");
  if (!normalized.startsWith("public/downloads/")) {
    return true;
  }

  return normalized === "public/downloads/downloads.json";
}

await tar.create(
  { gzip: true, file: tarballPath, cwd: standaloneDir, portable: true, filter },
  fs.readdirSync(standaloneDir),
);

const sizeMb = (fs.statSync(tarballPath).size / (1024 * 1024)).toFixed(1);
console.log(`[cli] Created ${path.relative(rootDir, tarballPath)} (${sizeMb} MB)`);
