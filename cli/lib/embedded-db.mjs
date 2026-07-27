import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { getPostgresDataDir, getRuntimeDir } from "./paths.mjs";

// Matches the version bundled with the desktop app (desktop/package.json).
const EMBEDDED_POSTGRES_VERSION = "17.10.0-beta.17";

// Offset from the desktop app's 15432 so both can run on the same machine.
export const DEFAULT_EMBEDDED_DB_PORT = 15433;

function installEmbeddedPostgres(runtimeDir) {
  return new Promise((resolve, reject) => {
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    const child = spawn(
      npm,
      [
        "install",
        `embedded-postgres@${EMBEDDED_POSTGRES_VERSION}`,
        "--prefix",
        runtimeDir,
        "--no-audit",
        "--no-fund",
        "--loglevel=error",
      ],
      { stdio: "inherit", shell: process.platform === "win32" },
    );

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(new Error(`Failed to download embedded PostgreSQL (npm exit code ${code})`));
    });
  });
}

/**
 * The PostgreSQL binaries (~50 MB) are not shipped in the npm package; they are
 * installed on demand into `~/.gitclaw/runtime` the first time `--embedded-db`
 * is used.
 */
async function loadEmbeddedPostgres() {
  const runtimeDir = getRuntimeDir();
  const requireFromRuntime = createRequire(path.join(runtimeDir, "index.js"));

  let entry;
  try {
    entry = requireFromRuntime.resolve("embedded-postgres");
  } catch {
    console.log("[gitclaw] Downloading embedded PostgreSQL (one-time setup) ...");
    fs.mkdirSync(runtimeDir, { recursive: true });
    await installEmbeddedPostgres(runtimeDir);
    entry = requireFromRuntime.resolve("embedded-postgres");
  }

  const mod = await import(pathToFileURL(entry).href);
  return mod.default?.default ?? mod.default ?? mod;
}

export async function startEmbeddedPostgres({ port }) {
  const EmbeddedPostgres = await loadEmbeddedPostgres();
  const dataDir = getPostgresDataDir();

  const postgres = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: "postgres",
    password: "postgres",
    port,
    persistent: true,
  });

  if (!fs.existsSync(path.join(dataDir, "PG_VERSION"))) {
    console.log("[gitclaw] Initialising embedded PostgreSQL data directory ...");
    await postgres.initialise();
  }

  console.log(`[gitclaw] Starting embedded PostgreSQL on port ${port} ...`);
  await postgres.start();

  return {
    connectionString: `postgresql://postgres:postgres@127.0.0.1:${port}/gitclaw`,
    stop: () => postgres.stop(),
  };
}
