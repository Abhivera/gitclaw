import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { app } from "electron";
import { ensureEnvFile, getEnvPath, loadEnvFile } from "./env.mjs";
export const NEXT_PORT = 13100;
export const desktopToken = randomBytes(32).toString("hex");
const PG_PORT = 15432;

/** @type {import('embedded-postgres').default | null} */
let postgres = null;
let pgControl = null;
let postgresDataDir = null;
/** @type {import('node:child_process').ChildProcess | null} */
let nextProcess = null;
/** @type {import('node:fs').FSWatcher | null} */
let envWatcher = null;
/** @type {NodeJS.Timeout | null} */
let envReloadTimer = null;

export function getStandaloneDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "standalone");
  }

  return path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".next", "standalone");
}

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    let stderr = "";
    let stdout = "";

    child.stdout?.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      console.log(`[gitclaw] ${text.trimEnd()}`);
    });

    child.stderr?.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      console.error(`[gitclaw] ${text.trimEnd()}`);
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(new Error(stderr.trim() || stdout.trim() || `Command failed with exit code ${code}`));
    });
  });
}

async function waitForServer(port, timeoutMs = 120_000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    if (nextProcess && nextProcess.exitCode !== null) {
      throw new Error(`GitClaw server exited before it was ready (code ${nextProcess.exitCode}).`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/desktop/health`, {
        headers: { "x-gitclaw-desktop-token": desktopToken },
        signal: AbortSignal.timeout(2_000),
      });
      if (response.ok && (await response.json()).service === "gitclaw") {
        return;
      }
    } catch {
      // Server not ready yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`GitClaw server did not start on port ${port} within ${timeoutMs / 1000}s`);
}

async function runMigrations(standaloneDir, runtimeEnv) {
  const prismaCli = resolvePrismaCli(standaloneDir);

  await runCommand(process.execPath, [prismaCli, "migrate", "deploy"], {
    cwd: standaloneDir,
    env: runtimeEnv,
    stdio: "pipe",
  });
}

function resolvePrismaCli(standaloneDir) {
  const candidates = [
    path.join(standaloneDir, "node_modules", "prisma", "build", "index.js"),
  ];

  if (!app.isPackaged) {
    candidates.push(
      path.join(standaloneDir, "..", "..", "node_modules", "prisma", "build", "index.js"),
    );
  }

  for (const candidate of candidates) {
    if (requireExists(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    "Prisma CLI not found in the desktop bundle. Run `npm run desktop:build:next` from the repo root.",
  );
}

function buildRuntimeEnv(fileEnv) {
  return {
    ...process.env,
    ...fileEnv,
    GITCLAW_DESKTOP: "1",
    GITCLAW_DESKTOP_TOKEN: desktopToken,
    GITCLAW_CONFIG_PATH: getEnvPath(),
    DATABASE_URL: `postgresql://postgres:postgres@127.0.0.1:${PG_PORT}/gitclaw`,
    APP_URL: `http://127.0.0.1:${NEXT_PORT}`,
    NODE_ENV: "production",
    PORT: String(NEXT_PORT),
    HOSTNAME: "127.0.0.1",
    // Run Node scripts (Prisma CLI, Next standalone) under Electron's embedded Node.
    ELECTRON_RUN_AS_NODE: "1",
  };
}

function attachNextProcessLogging(child) {
  child.stdout?.on("data", (chunk) => {
    console.log(`[gitclaw] ${chunk.toString().trimEnd()}`);
  });

  child.stderr?.on("data", (chunk) => {
    console.error(`[gitclaw] ${chunk.toString().trimEnd()}`);
  });

  child.on("exit", (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`[gitclaw] server exited (code=${code}, signal=${signal})`);
    }
  });
}

async function spawnNextServer(standaloneDir, runtimeEnv) {
  const serverJs = path.join(standaloneDir, "server.js");

  nextProcess = spawn(process.execPath, [serverJs], {
    cwd: standaloneDir,
    env: runtimeEnv,
    stdio: "pipe",
  });

  attachNextProcessLogging(nextProcess);
  await waitForServer(NEXT_PORT);
}

async function stopNextServer() {
  const child = nextProcess;
  if (!child) {
    return;
  }

  nextProcess = null;

  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      resolve(undefined);
    }, 5_000);

    child.once("exit", () => {
      clearTimeout(timeout);
      resolve(undefined);
    });

    child.kill("SIGTERM");
  });
}

export async function restartNextServer() {
  const standaloneDir = getStandaloneDir();
  const serverJs = path.join(standaloneDir, "server.js");

  if (!requireExists(serverJs)) {
    throw new Error("Desktop server bundle is missing.");
  }

  ensureEnvFile({ port: NEXT_PORT, pgPort: PG_PORT });
  const fileEnv = loadEnvFile(getEnvPath());
  const runtimeEnv = buildRuntimeEnv(fileEnv);

  await stopNextServer();
  await spawnNextServer(standaloneDir, runtimeEnv);

  return { port: NEXT_PORT, pgPort: PG_PORT };
}

export function watchEnvFile(onReload) {
  stopEnvWatcher();

  const envPath = getEnvPath();
  envWatcher = fs.watch(envPath, () => {
    if (envReloadTimer) {
      clearTimeout(envReloadTimer);
    }

    envReloadTimer = setTimeout(() => {
      envReloadTimer = null;
      onReload();
    }, 500);
  });
}

export function stopEnvWatcher() {
  if (envReloadTimer) {
    clearTimeout(envReloadTimer);
    envReloadTimer = null;
  }

  envWatcher?.close();
  envWatcher = null;
}

export async function startGitClawServer() {
  const standaloneDir = getStandaloneDir();
  const serverJs = path.join(standaloneDir, "server.js");

  if (!requireExists(serverJs)) {
    throw new Error(
      "Desktop server bundle is missing. Run `npm run desktop:build:next` from the repo root.",
    );
  }

  ensureEnvFile({ port: NEXT_PORT, pgPort: PG_PORT });
  const fileEnv = loadEnvFile(getEnvPath());

  // Child processes cannot execute binaries from inside app.asar. Load the
  // complete database runtime from the unpacked dependency tree when installed.
  const embeddedEntry = app.isPackaged
    ? path.join(`${app.getAppPath()}.unpacked`, "node_modules", "embedded-postgres", "dist", "index.js")
    : createRequire(import.meta.url).resolve("embedded-postgres");
  const { default: EmbeddedPostgres } = await import(pathToFileURL(embeddedEntry).href);
  // Electron's lifecycle already awaits stopGitClawServer. The library's Node
  // `exit` hook cannot await cleanup and calls a missing callback on app.exit().
  createRequire(embeddedEntry)("async-exit-hook").unhookEvent("exit");
  const { default: getBinaries } = await import(pathToFileURL(path.join(path.dirname(embeddedEntry), "binary.js")).href);
  pgControl = (await getBinaries()).pg_ctl;
  const dataDir = path.join(app.getPath("userData"), "postgres-data");
  postgresDataDir = dataDir;

  postgres = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: "postgres",
    password: "postgres",
    port: PG_PORT,
    persistent: true,
    initdbFlags: ["--encoding=UTF8"],
    postgresFlags: ["-h", "127.0.0.1"],
  });

  const pgVersionFile = path.join(dataDir, "PG_VERSION");
  if (!fs.existsSync(pgVersionFile)) {
    await postgres.initialise();
  }

  await postgres.start();

  const client = postgres.getPgClient("postgres", "127.0.0.1");
  try {
    await client.connect();
    const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", ["gitclaw"]);
    if (exists.rowCount === 0) await client.query('CREATE DATABASE "gitclaw"');
  } finally {
    await client.end();
  }

  const runtimeEnv = buildRuntimeEnv(fileEnv);
  await runMigrations(standaloneDir, runtimeEnv);
  await spawnNextServer(standaloneDir, runtimeEnv);

  return { port: NEXT_PORT, pgPort: PG_PORT };
}

export async function stopGitClawServer() {
  stopEnvWatcher();
  await stopNextServer();

  if (postgres) {
    const instance = postgres;
    postgres = null;
    if (instance.process && pgControl && postgresDataDir) {
      try {
        // pg_ctl requests a clean checkpoint and shutdown on every OS, whereas
        // embedded-postgres.stop() uses forced taskkill on Windows.
        await runCommand(pgControl, ["stop", "-D", postgresDataDir, "-m", "fast", "-w", "-t", "10"], {
          windowsHide: true, stdio: "pipe",
        });
        instance.process = undefined;
      } catch {
        await instance.stop();
      }
    } else {
      await instance.stop();
    }
  }
}

function requireExists(filePath) {
  return fs.existsSync(filePath);
}
