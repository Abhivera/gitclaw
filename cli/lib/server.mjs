import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "pipe", ...options });
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

export async function waitForServer(port, timeoutMs = 120_000) {
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

function resolvePrismaCli(appDir) {
  const prismaCli = path.join(appDir, "node_modules", "prisma", "build", "index.js");
  if (!fs.existsSync(prismaCli)) {
    throw new Error("Prisma CLI not found in the GitClaw server bundle.");
  }

  return prismaCli;
}

export async function runMigrations(appDir, runtimeEnv) {
  await runCommand(process.execPath, [resolvePrismaCli(appDir), "migrate", "deploy"], {
    cwd: appDir,
    env: runtimeEnv,
  });
}

export function buildRuntimeEnv({ fileEnv, envPath, databaseUrl, port, host }) {
  return {
    ...process.env,
    ...fileEnv,
    // Desktop mode enables the setup wizard and the dashboard configuration UI,
    // both of which read/write the .env file at GITCLAW_CONFIG_PATH.
    GITCLAW_DESKTOP: "1",
    GITCLAW_CONFIG_PATH: envPath,
    APP_URL: fileEnv.APP_URL?.trim() || `http://localhost:${port}`,
    DATABASE_URL: databaseUrl,
    NODE_ENV: "production",
    PORT: String(port),
    HOSTNAME: host,
  };
}

export function spawnServer(appDir, runtimeEnv) {
  const serverJs = path.join(appDir, "server.js");
  const child = spawn(process.execPath, [serverJs], {
    cwd: appDir,
    env: runtimeEnv,
    stdio: "pipe",
  });

  child.stdout?.on("data", (chunk) => {
    console.log(`[gitclaw] ${chunk.toString().trimEnd()}`);
  });

  child.stderr?.on("data", (chunk) => {
    console.error(`[gitclaw] ${chunk.toString().trimEnd()}`);
  });

  return child;
}

export function stopServer(child) {
  if (!child || child.exitCode !== null) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
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
