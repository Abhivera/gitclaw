import fs from "node:fs";
import path from "node:path";
import { app } from "electron";

const ENV_TEMPLATE = `# GitClaw desktop configuration
# Edit this file and restart the app (File → Open configuration folder).

APP_URL=http://127.0.0.1:{port}
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:{pgPort}/gitclaw

# Optional — GitHub App, GitLab, Bitbucket, AI keys (see README)
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_WEBHOOK_SECRET=
GITHUB_APP_SLUG=
GITLAB_CLIENT_ID=
GITLAB_CLIENT_SECRET=
GITLAB_BASE_URL=
BITBUCKET_CLIENT_ID=
BITBUCKET_CLIENT_SECRET=
AI_PROVIDER=
OPENROUTER_API_KEY=
GROQ_API_KEY=
OPENAI_BASE_URL=
OPENAI_API_KEY=
GITCLAW_REVIEW_MODEL=
ALLOWED_DEV_ORIGINS=
`;

export function getConfigDir() {
  return path.join(app.getPath("userData"), "config");
}

export function getEnvPath() {
  return path.join(getConfigDir(), ".env");
}

function upsertEnvValue(content, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  return `${content.trimEnd()}\n${line}\n`;
}

export function ensureEnvFile({ port, pgPort }) {
  const configDir = getConfigDir();
  fs.mkdirSync(configDir, { recursive: true });

  const envPath = getEnvPath();
  const databaseUrl = `postgresql://postgres:postgres@127.0.0.1:${pgPort}/gitclaw`;
  const appUrl = `http://127.0.0.1:${port}`;

  if (!fs.existsSync(envPath)) {
    const content = ENV_TEMPLATE.replaceAll("{port}", String(port))
      .replaceAll("{pgPort}", String(pgPort));
    fs.writeFileSync(envPath, content, "utf8");
    return envPath;
  }

  let content = fs.readFileSync(envPath, "utf8");
  content = upsertEnvValue(content, "DATABASE_URL", databaseUrl);
  content = upsertEnvValue(content, "APP_URL", appUrl);
  fs.writeFileSync(envPath, content, "utf8");

  return envPath;
}

export function loadEnvFile(envPath) {
  const content = fs.readFileSync(envPath, "utf8");
  const env = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}
