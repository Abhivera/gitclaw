import os from "node:os";
import path from "node:path";

/**
 * All CLI state lives under one directory (default `~/.gitclaw`):
 *
 *   .env             — instance configuration
 *   app/<version>/   — extracted Next.js standalone server bundle
 *   postgres-data/   — embedded PostgreSQL data directory (--embedded-db)
 *   runtime/         — on-demand runtime dependencies (embedded-postgres)
 */
export function getGitclawHome() {
  const override = process.env.GITCLAW_HOME?.trim();
  if (override) {
    return path.resolve(override);
  }

  return path.join(os.homedir(), ".gitclaw");
}

export function getEnvPath() {
  return path.join(getGitclawHome(), ".env");
}

export function getAppsDir() {
  return path.join(getGitclawHome(), "app");
}

export function getPostgresDataDir() {
  return path.join(getGitclawHome(), "postgres-data");
}

export function getRuntimeDir() {
  return path.join(getGitclawHome(), "runtime");
}
