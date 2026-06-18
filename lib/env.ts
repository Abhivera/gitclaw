import { z } from "zod";

/**
 * Centralised, validated environment configuration.
 *
 * Core variables (auth + database + GitHub OAuth) are required before the app
 * can sign users in or run workers. Optional provider and AI keys are read via
 * the `env` proxy when those code paths run.
 */

const optional = z.string().trim().min(1).optional();

const coreEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.url(),
  ALLOWED_DEV_ORIGINS: optional,
  NODE_ENV: z.string().optional(),
  DATABASE_URL: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
});

const envSchema = coreEnvSchema.extend({
  GITHUB_APP_ID: optional,
  GITHUB_APP_PRIVATE_KEY: optional,
  GITHUB_WEBHOOK_SECRET: optional,
  GITHUB_APP_SLUG: optional,
  GITLAB_CLIENT_ID: optional,
  GITLAB_CLIENT_SECRET: optional,
  GITLAB_BASE_URL: optional,
  BITBUCKET_CLIENT_ID: optional,
  BITBUCKET_CLIENT_SECRET: optional,
  AI_PROVIDER: optional,
  OPENROUTER_API_KEY: optional,
  GROQ_API_KEY: optional,
  OPENAI_BASE_URL: optional,
  OPENAI_API_KEY: optional,
  GITCLAW_REVIEW_MODEL: optional,
});

export type CoreEnv = z.infer<typeof coreEnvSchema>;
export type Env = z.infer<typeof envSchema>;

export class ConfigError extends Error {
  readonly issues: z.core.$ZodIssue[];

  constructor(message: string, issues: z.core.$ZodIssue[]) {
    super(message);
    this.name = "ConfigError";
    this.issues = issues;
  }
}

export function isConfigError(error: unknown): error is ConfigError {
  return error instanceof ConfigError;
}

function formatIssues(issues: z.core.$ZodIssue[]): string {
  const lines = issues.map((issue) => {
    const key = issue.path.join(".") || "(root)";
    return `  • ${key}: ${issue.message}`;
  });
  return [
    "Invalid environment configuration:",
    ...lines,
    "",
    "Copy .env.example to .env and fill in the missing values.",
  ].join("\n");
}

export function formatEnvSetupMessage(issues?: z.core.$ZodIssue[]): string {
  const resolvedIssues = issues ?? getEnvIssues();
  if (resolvedIssues.length === 0) {
    return "GitClaw environment is not configured.";
  }
  return formatIssues(resolvedIssues);
}

let cachedCoreEnv: CoreEnv | undefined;
let cachedEnvIssues: z.core.$ZodIssue[] | undefined;

function parseCoreEnv():
  | { success: true; data: CoreEnv }
  | { success: false; issues: z.core.$ZodIssue[] } {
  const result = coreEnvSchema.safeParse(process.env);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, issues: result.error.issues };
}

export function getEnvIssues(): z.core.$ZodIssue[] {
  if (cachedEnvIssues !== undefined) {
    return cachedEnvIssues;
  }
  const parsed = parseCoreEnv();
  if (parsed.success) {
    cachedEnvIssues = [];
    return cachedEnvIssues;
  }
  cachedEnvIssues = parsed.issues;
  return cachedEnvIssues;
}

export function isCoreEnvConfigured(): boolean {
  return getEnvIssues().length === 0;
}

export function validateCoreEnv(): CoreEnv {
  if (cachedCoreEnv) {
    return cachedCoreEnv;
  }
  const parsed = parseCoreEnv();
  if (!parsed.success) {
    throw new ConfigError(formatIssues(parsed.issues), parsed.issues);
  }
  cachedCoreEnv = parsed.data;
  cachedEnvIssues = [];
  return cachedCoreEnv;
}

let parsedFullEnv: Env | undefined;

export function validateEnv(): Env {
  if (parsedFullEnv) {
    return parsedFullEnv;
  }
  const core = validateCoreEnv();
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    throw new ConfigError(formatIssues(result.error.issues), result.error.issues);
  }
  parsedFullEnv = { ...core, ...result.data };
  return parsedFullEnv;
}

export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return process.env[prop];
    }
    return validateEnv()[prop as keyof Env];
  },
});
