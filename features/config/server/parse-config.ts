import { parse as parseYaml } from "yaml";
import {
  DEFAULT_GITCLAW_CONFIG,
  gitclawConfigSchema,
  type GitclawConfig,
} from "../types/gitclaw-config";

export function parseGitclawConfig(raw: string): GitclawConfig {
  if (!raw.trim()) {
    return DEFAULT_GITCLAW_CONFIG;
  }

  if (raw.length > 64_000) return DEFAULT_GITCLAW_CONFIG;
  let parsed: unknown;
  try {
    parsed = parseYaml(raw, { maxAliasCount: 50 });
  } catch {
    console.warn("[gitclaw] malformed .gitclaw.yaml, using defaults");
    return DEFAULT_GITCLAW_CONFIG;
  }
  if (!parsed || typeof parsed !== "object") {
    return DEFAULT_GITCLAW_CONFIG;
  }

  const result = gitclawConfigSchema.safeParse(parsed);
  if (!result.success) {
    console.warn("[gitclaw] invalid .gitclaw.yaml, using defaults", {
      errors: result.error.flatten(),
    });
    return DEFAULT_GITCLAW_CONFIG;
  }

  return result.data;
}
