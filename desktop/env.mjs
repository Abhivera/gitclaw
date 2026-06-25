import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import { parseEnvFile, upsertEnvValue } from "./env-file.mjs";

const ENV_TEMPLATE = `APP_URL=http://127.0.0.1:{port}
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:{pgPort}/gitclaw

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
  return parseEnvFile(fs.readFileSync(envPath, "utf8"));
}
