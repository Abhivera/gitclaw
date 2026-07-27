#!/usr/bin/env node
import fs from "node:fs";
import { parseArgs } from "node:util";
import { ensureAppBundle, getPackageVersion } from "../lib/bundle.mjs";
import { DEFAULT_EMBEDDED_DB_PORT, startEmbeddedPostgres } from "../lib/embedded-db.mjs";
import { ensureEnvFile, loadEnvFile } from "../lib/env.mjs";
import { getEnvPath, getGitclawHome } from "../lib/paths.mjs";
import {
  buildRuntimeEnv,
  runMigrations,
  spawnServer,
  stopServer,
  waitForServer,
} from "../lib/server.mjs";

const HELP = `GitClaw — self-hosted AI pull request reviewer

Usage:
  gitclaw <command> [options]

Commands:
  start      Run database migrations and start the GitClaw server
  init       Create the configuration file (~/.gitclaw/.env) and print its path
  migrate    Run database migrations only
  doctor     Print environment and configuration diagnostics

Options:
  --port <port>       Port to listen on (default: 3000)
  --host <host>       Host to bind (default: 127.0.0.1, use 0.0.0.0 for servers)
  --embedded-db       Use a bundled PostgreSQL instead of DATABASE_URL
                      (binaries are downloaded on first use)
  --db-port <port>    Embedded PostgreSQL port (default: ${DEFAULT_EMBEDDED_DB_PORT})
  -v, --version       Print the GitClaw version
  -h, --help          Show this help

Environment:
  GITCLAW_HOME        Data/config directory (default: ~/.gitclaw)

Examples:
  npx gitclaw-cli start --embedded-db
  gitclaw start --port 8080 --host 0.0.0.0
`;

function fail(message) {
  console.error(`[gitclaw] ${message}`);
  process.exit(1);
}

function toPort(value, flag) {
  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    fail(`Invalid value for ${flag}: ${value}`);
  }

  return port;
}

async function startEmbeddedDbIfRequested(values) {
  if (!values["embedded-db"]) {
    return null;
  }

  return startEmbeddedPostgres({ port: toPort(values["db-port"], "--db-port") });
}

function resolveDatabaseUrl(embedded, envPath) {
  if (embedded) {
    return embedded.connectionString;
  }

  const fileEnv = loadEnvFile();
  const url = fileEnv.DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
  if (!url) {
    fail(
      `DATABASE_URL is not set. Add it to ${envPath} ` +
        "or start with a bundled PostgreSQL: `gitclaw start --embedded-db`",
    );
  }

  return url;
}

async function commandStart(values) {
  const port = toPort(values.port, "--port");
  const host = values.host;

  const appDir = await ensureAppBundle();
  const envPath = ensureEnvFile({ port });
  const embedded = await startEmbeddedDbIfRequested(values);

  const buildEnv = () =>
    buildRuntimeEnv({
      fileEnv: loadEnvFile(),
      envPath,
      databaseUrl: resolveDatabaseUrl(embedded, envPath),
      port,
      host,
    });

  console.log("[gitclaw] Applying database migrations ...");
  await runMigrations(appDir, buildEnv());

  let child = null;
  let shuttingDown = false;
  let reloadTimer = null;
  let watcher = null;

  const shutdown = async (code) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    if (reloadTimer) {
      clearTimeout(reloadTimer);
    }
    watcher?.close();

    console.log("[gitclaw] Shutting down ...");
    await stopServer(child);
    await embedded?.stop();
    process.exit(code);
  };

  const launch = () => {
    child = spawnServer(appDir, buildEnv());
    child.on("exit", (code) => {
      if (!shuttingDown && !reloadTimer) {
        console.error(`[gitclaw] Server exited unexpectedly (code=${code ?? "signal"})`);
        void shutdown(1);
      }
    });
  };

  process.on("SIGINT", () => void shutdown(0));
  process.on("SIGTERM", () => void shutdown(0));

  launch();
  await waitForServer(port);

  console.log("");
  console.log(`[gitclaw] GitClaw is running at http://localhost:${port}`);
  console.log(`[gitclaw] Configuration: ${envPath}`);
  console.log("[gitclaw] Press Ctrl+C to stop.");

  // The dashboard configuration UI writes to the .env file; restart the server
  // when it changes so new settings take effect (mirrors the desktop app).
  watcher = fs.watch(envPath, () => {
    if (shuttingDown) {
      return;
    }

    if (reloadTimer) {
      clearTimeout(reloadTimer);
    }

    reloadTimer = setTimeout(async () => {
      console.log("[gitclaw] Configuration changed — restarting server ...");
      await stopServer(child);
      reloadTimer = null;
      launch();
      await waitForServer(port);
      console.log("[gitclaw] Server restarted.");
    }, 500);
  });
}

async function commandMigrate(values) {
  const port = toPort(values.port, "--port");
  const appDir = await ensureAppBundle();
  const envPath = ensureEnvFile({ port });
  const embedded = await startEmbeddedDbIfRequested(values);

  try {
    const runtimeEnv = buildRuntimeEnv({
      fileEnv: loadEnvFile(),
      envPath,
      databaseUrl: resolveDatabaseUrl(embedded, envPath),
      port,
      host: values.host,
    });

    console.log("[gitclaw] Applying database migrations ...");
    await runMigrations(appDir, runtimeEnv);
    console.log("[gitclaw] Migrations applied.");
  } finally {
    await embedded?.stop();
  }
}

function commandInit(values) {
  const envPath = ensureEnvFile({ port: toPort(values.port, "--port") });
  console.log(`[gitclaw] Configuration file: ${envPath}`);
  console.log("[gitclaw] Edit it to set DATABASE_URL, provider keys, and an AI provider key,");
  console.log("[gitclaw] then run `gitclaw start` (or `gitclaw start --embedded-db`).");
}

function commandDoctor() {
  const envPath = getEnvPath();
  const fileEnv = loadEnvFile();
  const hasEnvFile = fs.existsSync(envPath);
  const set = (key) => Boolean(fileEnv[key]?.trim() || process.env[key]?.trim());

  console.log(`gitclaw-cli    ${getPackageVersion()}`);
  console.log(`node           ${process.version}`);
  console.log(`data dir       ${getGitclawHome()}`);
  console.log(`config file    ${hasEnvFile ? envPath : `${envPath} (missing — run \`gitclaw init\`)`}`);
  console.log(`DATABASE_URL   ${set("DATABASE_URL") ? "set" : "not set (required, or use --embedded-db)"}`);
  console.log(`APP_URL        ${fileEnv.APP_URL?.trim() || "(default)"}`);

  const aiKeys = ["OPENROUTER_API_KEY", "ANTHROPIC_API_KEY", "GROQ_API_KEY", "OPENAI_API_KEY"];
  const configuredAi = aiKeys.filter((key) => set(key));
  console.log(`AI provider    ${configuredAi.length > 0 ? configuredAi.join(", ") : "no API key set"}`);
}

async function main() {
  let parsed;
  try {
    parsed = parseArgs({
      args: process.argv.slice(2),
      allowPositionals: true,
      options: {
        port: { type: "string", default: "3000" },
        host: { type: "string", default: "127.0.0.1" },
        "embedded-db": { type: "boolean", default: false },
        "db-port": { type: "string", default: String(DEFAULT_EMBEDDED_DB_PORT) },
        version: { type: "boolean", short: "v", default: false },
        help: { type: "boolean", short: "h", default: false },
      },
    });
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }

  const { values, positionals } = parsed;
  const command = positionals[0];

  if (values.version) {
    console.log(getPackageVersion());
    return;
  }

  if (values.help || !command) {
    console.log(HELP);
    return;
  }

  switch (command) {
    case "start":
      await commandStart(values);
      break;
    case "init":
      commandInit(values);
      break;
    case "migrate":
      await commandMigrate(values);
      break;
    case "doctor":
      commandDoctor();
      break;
    default:
      fail(`Unknown command: ${command}\n\n${HELP}`);
  }
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
