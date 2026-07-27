import fs from "node:fs";
import { parseEnvFile } from "./env-file.mjs";
import { getEnvPath, getGitclawHome } from "./paths.mjs";

const ENV_TEMPLATE = `# GitClaw configuration
# Public URL of this GitClaw instance (used for OAuth callbacks and webhooks).
APP_URL=http://localhost:{port}

# PostgreSQL connection string.
# Leave empty when starting with \`gitclaw start --embedded-db\`.
DATABASE_URL=

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
ANTHROPIC_API_KEY=
GROQ_API_KEY=
OPENAI_BASE_URL=
OPENAI_API_KEY=
GITCLAW_REVIEW_MODEL=
# Tunnel hostname for webhooks (e.g. abc.trycloudflare.com)
ALLOWED_DEV_ORIGINS=
`;

/** Creates `~/.gitclaw/.env` from the template if missing. Never overwrites user values. */
export function ensureEnvFile({ port }) {
  fs.mkdirSync(getGitclawHome(), { recursive: true });

  const envPath = getEnvPath();
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, ENV_TEMPLATE.replaceAll("{port}", String(port)), "utf8");
  }

  return envPath;
}

export function loadEnvFile() {
  const envPath = getEnvPath();
  if (!fs.existsSync(envPath)) {
    return {};
  }

  return parseEnvFile(fs.readFileSync(envPath, "utf8"));
}
