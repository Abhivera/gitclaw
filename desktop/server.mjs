import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "electron";
import { ensureEnvFile, getEnvPath, loadEnvFile } from "./env.mjs";
export const NEXT_PORT = 13100;
const PG_PORT = 15432;

/** @type {import('embedded-postgres').default | null} */
let postgres = null;
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

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(new Error(stderr.trim() || `Command failed with exit code ${code}`));
    });
  });
}

async function waitForServer(port, timeoutMs = 120_000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}`);
      if (response.status < 500) {
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
  const prismaCli = path.join(standaloneDir, "node_modules", "prisma", "build", "index.js");

  await runCommand(process.execPath, [prismaCli, "migrate", "deploy"], {
    cwd: standaloneDir,
    env: runtimeEnv,
    stdio: "inherit",
  });
}

function buildRuntimeEnv(fileEnv) {
  return {
    ...process.env,
    ...fileEnv,
    GITCLAW_DESKTOP: "1",
    GITCLAW_CONFIG_PATH: getEnvPath(),
    DATABASE_URL: `postgresql://postgres:postgres@127.0.0.1:${PG_PORT}/gitclaw`,
    APP_URL: `http://127.0.0.1:${NEXT_PORT}`,
    NODE_ENV: "production",
    PORT: String(NEXT_PORT),
    HOSTNAME: "127.0.0.1",
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

  const { default: EmbeddedPostgres } = await import("embedded-postgres");
  const dataDir = path.join(app.getPath("userData"), "postgres-data");

  postgres = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: "postgres",
    password: "postgres",
    port: PG_PORT,
    persistent: true,
  });

  await postgres.initialise();
  await postgres.start();

  const runtimeEnv = buildRuntimeEnv(fileEnv);
  await runMigrations(standaloneDir, runtimeEnv);
  await spawnNextServer(standaloneDir, runtimeEnv);

  return { port: NEXT_PORT, pgPort: PG_PORT };
}

export async function stopGitClawServer() {
  stopEnvWatcher();
  await stopNextServer();

  if (postgres) {
    await postgres.stop();
    postgres = null;
  }
}

function requireExists(filePath) {
  return fs.existsSync(filePath);
}
