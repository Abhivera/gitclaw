import fs from "node:fs";
import {
  DESKTOP_SECRET_ENV_KEYS,
  DESKTOP_USER_ENV_KEYS,
  validateMergedEnv,
} from "@/lib/env";
import { formatEnvValue, parseEnvFile, upsertEnvValue } from "@/lib/env-file";
import { isDesktopApp } from "@/features/setup/lib/is-desktop";

const MANAGED_ENV_KEYS = new Set(["APP_URL", "DATABASE_URL"]);

export type DesktopConfigSnapshot = {
  values: Record<string, string>;
  secretsSet: Record<string, boolean>;
};

export function readDesktopConfigSnapshot(configPath: string): DesktopConfigSnapshot {
  const content = fs.readFileSync(configPath, "utf8");
  const parsed = parseEnvFile(content);
  const values: Record<string, string> = {};
  const secretsSet: Record<string, boolean> = {};

  for (const key of DESKTOP_USER_ENV_KEYS) {
    const raw = parsed[key] ?? "";
    const isSecret = DESKTOP_SECRET_ENV_KEYS.has(key);

    if (isSecret) {
      secretsSet[key] = raw.length > 0;
      values[key] = "";
    } else {
      values[key] = raw;
    }
  }

  return { values, secretsSet };
}

export type DesktopConfigSaveInput = Partial<Record<string, string>>;

export function saveDesktopConfigFile(
  configPath: string,
  updates: DesktopConfigSaveInput,
):
  | { success: true }
  | { success: false; issues: { path: (string | number)[]; message: string }[] } {
  const content = fs.readFileSync(configPath, "utf8");
  const parsed = parseEnvFile(content);
  const merged = { ...parsed };

  for (const key of DESKTOP_USER_ENV_KEYS) {
    if (!(key in updates)) {
      continue;
    }

    const nextValue = updates[key]?.trim() ?? "";

    if (DESKTOP_SECRET_ENV_KEYS.has(key) && nextValue.length === 0) {
      continue;
    }

    merged[key] = nextValue;
  }

  const validation = validateMergedEnv(merged);
  if (!validation.success) {
    return {
      success: false,
      issues: validation.issues.map((issue) => ({
        path: issue.path.map(String),
        message: issue.message,
      })),
    };
  }

  let nextContent = content;
  for (const key of [...MANAGED_ENV_KEYS, ...DESKTOP_USER_ENV_KEYS]) {
    const value = merged[key] ?? "";
    nextContent = upsertEnvValue(nextContent, key, formatEnvValue(value));
  }

  fs.writeFileSync(configPath, nextContent, "utf8");
  return { success: true };
}

export function isDesktopConfigApiAvailable(): boolean {
  return isDesktopApp() && Boolean(process.env.GITCLAW_CONFIG_PATH?.trim());
}

export function getDesktopConfigPath(): string {
  const configPath = process.env.GITCLAW_CONFIG_PATH?.trim();
  if (!configPath) {
    throw new Error("Desktop configuration path is not set.");
  }

  return configPath;
}
