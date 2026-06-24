import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "electron";
import { ensureEnvFile, getEnvPath, loadEnvFile } from "./env.mjs";

const NEXT_PORT = 13100;
const PG_PORT = 15432;

/** @type {import('embedded-postgres').default | null} */
let postgres = null;
/** @type {import('node:child_process').ChildProcess | null} */
let nextProcess = null;

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

  const runtimeEnv = {
    ...process.env,
    ...fileEnv,
    GITCLAW_DESKTOP: "1",
    DATABASE_URL: `postgresql://postgres:postgres@127.0.0.1:${PG_PORT}/gitclaw`,
    APP_URL: `http://127.0.0.1:${NEXT_PORT}`,
    NODE_ENV: "production",
    PORT: String(NEXT_PORT),
    HOSTNAME: "127.0.0.1",
  };

  await runMigrations(standaloneDir, runtimeEnv);

  nextProcess = spawn(process.execPath, [serverJs], {
    cwd: standaloneDir,
    env: runtimeEnv,
    stdio: "pipe",
  });

  nextProcess.stdout?.on("data", (chunk) => {
    console.log(`[gitclaw] ${chunk.toString().trimEnd()}`);
  });

  nextProcess.stderr?.on("data", (chunk) => {
    console.error(`[gitclaw] ${chunk.toString().trimEnd()}`);
  });

  nextProcess.on("exit", (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`[gitclaw] server exited (code=${code}, signal=${signal})`);
    }
  });

  await waitForServer(NEXT_PORT);

  return { port: NEXT_PORT, pgPort: PG_PORT };
}

export async function stopGitClawServer() {
  if (nextProcess) {
    nextProcess.kill("SIGTERM");
    nextProcess = null;
  }

  if (postgres) {
    await postgres.stop();
    postgres = null;
  }
}

function requireExists(filePath) {
  return fs.existsSync(filePath);
}
