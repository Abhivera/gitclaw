import { DESKTOP_USER_ENV_KEYS } from "@/lib/env";
import {
  DOCS_AI_PROVIDER_URL,
  DOCS_GITHUB_URL,
  DOCS_GITLAB_BITBUCKET_URL,
  DOCS_WEBHOOKS_DESKTOP_URL,
} from "@/lib/links";

export type ConfigFieldKey = (typeof DESKTOP_USER_ENV_KEYS)[number];

export type FieldConfig = {
  key: ConfigFieldKey;
  label: string;
  description?: string;
  type?: "text" | "password" | "url" | "textarea";
  placeholder?: string;
  docsUrl?: string;
};

export type FieldGroupConfig = {
  title: string;
  description: string;
  fields: FieldConfig[];
};

export type AiProviderId = "openrouter" | "anthropic" | "groq" | "ollama";

export type GitProviderId = "github" | "gitlab" | "bitbucket";

export const AI_PROVIDER_CARDS: Array<{
  id: AiProviderId;
  label: string;
  description: string;
}> = [
  {
    id: "openrouter",
    label: "OpenRouter",
    description: "Multi-model API gateway with a single key.",
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    description: "Direct Claude API access.",
  },
  {
    id: "groq",
    label: "Groq",
    description: "Fast inference for supported models.",
  },
  {
    id: "ollama",
    label: "Ollama / local",
    description: "OpenAI-compatible endpoint on your machine.",
  },
];

export const GIT_PROVIDER_CARDS: Array<{
  id: GitProviderId;
  label: string;
  description: string;
  recommended?: boolean;
}> = [
  {
    id: "github",
    label: "GitHub",
    description: "GitHub App for pull request reviews.",
    recommended: true,
  },
  {
    id: "gitlab",
    label: "GitLab",
    description: "OAuth app for GitLab.com or self-hosted.",
  },
  {
    id: "bitbucket",
    label: "Bitbucket",
    description: "OAuth consumer for Bitbucket Cloud.",
  },
];

const GITHUB_FIELDS: FieldConfig[] = [
  {
    key: "GITHUB_APP_SLUG",
    label: "App slug",
    placeholder: "e.g., gitclaw-reviews",
    docsUrl: DOCS_GITHUB_URL,
  },
  {
    key: "GITHUB_APP_ID",
    label: "App ID",
    placeholder: "e.g., 123456",
    docsUrl: DOCS_GITHUB_URL,
  },
  {
    key: "GITHUB_APP_PRIVATE_KEY",
    label: "Private key",
    type: "textarea",
    description: "Paste the PEM key from your GitHub App settings.",
    placeholder:
      "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----",
    docsUrl: DOCS_GITHUB_URL,
  },
  {
    key: "GITHUB_WEBHOOK_SECRET",
    label: "Webhook secret",
    type: "password",
    placeholder: "e.g., your-webhook-secret-key",
    docsUrl: DOCS_GITHUB_URL,
  },
];

const GITLAB_FIELDS: FieldConfig[] = [
  {
    key: "GITLAB_CLIENT_ID",
    label: "Client ID",
    placeholder: "e.g., gl_client_id_123456",
    docsUrl: DOCS_GITLAB_BITBUCKET_URL,
  },
  {
    key: "GITLAB_CLIENT_SECRET",
    label: "Client secret",
    type: "password",
    placeholder: "e.g., gl_client_secret_xyz",
    docsUrl: DOCS_GITLAB_BITBUCKET_URL,
  },
  {
    key: "GITLAB_BASE_URL",
    label: "Base URL",
    type: "url",
    placeholder: "https://gitlab.com",
    description: "Leave blank for GitLab.com.",
    docsUrl: DOCS_GITLAB_BITBUCKET_URL,
  },
];

const BITBUCKET_FIELDS: FieldConfig[] = [
  {
    key: "BITBUCKET_CLIENT_ID",
    label: "Client ID",
    placeholder: "e.g., bitbucket_client_id",
    docsUrl: DOCS_GITLAB_BITBUCKET_URL,
  },
  {
    key: "BITBUCKET_CLIENT_SECRET",
    label: "Client secret",
    type: "password",
    placeholder: "e.g., bitbucket_client_secret",
    docsUrl: DOCS_GITLAB_BITBUCKET_URL,
  },
];

const AI_FIELDS_BY_PROVIDER: Record<AiProviderId, FieldConfig[]> = {
  openrouter: [
    {
      key: "OPENROUTER_API_KEY",
      label: "OpenRouter API key",
      type: "password",
      placeholder: "e.g., sk-or-v1-...",
      docsUrl: DOCS_AI_PROVIDER_URL,
    },
  ],
  anthropic: [
    {
      key: "ANTHROPIC_API_KEY",
      label: "Anthropic API key",
      type: "password",
      placeholder: "e.g., sk-ant-sid01-...",
      docsUrl: DOCS_AI_PROVIDER_URL,
    },
  ],
  groq: [
    {
      key: "GROQ_API_KEY",
      label: "Groq API key",
      type: "password",
      placeholder: "e.g., gsk_...",
      docsUrl: DOCS_AI_PROVIDER_URL,
    },
  ],
  ollama: [
    {
      key: "OPENAI_BASE_URL",
      label: "OpenAI-compatible base URL",
      type: "url",
      placeholder: "http://localhost:11434/v1",
      description: "For Ollama or other OpenAI-compatible endpoints.",
      docsUrl: DOCS_AI_PROVIDER_URL,
    },
    {
      key: "OPENAI_API_KEY",
      label: "OpenAI-compatible API key",
      type: "password",
      description: "Only needed if your endpoint requires an API key.",
      placeholder: "e.g., sk-proj-...",
      docsUrl: DOCS_AI_PROVIDER_URL,
    },
  ],
};

const GIT_FIELDS_BY_PROVIDER: Record<GitProviderId, FieldConfig[]> = {
  github: GITHUB_FIELDS,
  gitlab: GITLAB_FIELDS,
  bitbucket: BITBUCKET_FIELDS,
};

export const CONFIG_FIELD_GROUPS: FieldGroupConfig[] = [
  {
    title: "GitHub",
    description: "Required to connect repositories and receive pull request webhooks.",
    fields: GITHUB_FIELDS,
  },
  {
    title: "GitLab",
    description: "OAuth application credentials for GitLab.com or self-hosted GitLab.",
    fields: GITLAB_FIELDS,
  },
  {
    title: "Bitbucket",
    description: "OAuth consumer credentials for Bitbucket Cloud.",
    fields: BITBUCKET_FIELDS,
  },
  {
    title: "AI provider",
    description: "Choose one provider and add the matching credentials.",
    fields: [
      ...AI_FIELDS_BY_PROVIDER.openrouter,
      ...AI_FIELDS_BY_PROVIDER.anthropic,
      ...AI_FIELDS_BY_PROVIDER.groq,
      ...AI_FIELDS_BY_PROVIDER.ollama,
    ],
  },
];

export const ADVANCED_FIELDS: FieldConfig[] = [
  {
    key: "ALLOWED_DEV_ORIGINS",
    label: "Allowed dev origins",
    description: "Comma-separated tunnel hostnames (e.g. abc123.ngrok-free.app).",
    placeholder: "e.g., abc123.ngrok-free.app",
    docsUrl: DOCS_WEBHOOKS_DESKTOP_URL,
  },
  {
    key: "GITCLAW_REVIEW_MODEL",
    label: "Review model",
    description: "Override the default model for your AI provider.",
  },
  {
    key: "AI_PROVIDER",
    label: "AI provider override",
    description: "Set explicitly if auto-detection does not match your setup.",
  },
];

export const TUNNEL_FIELDS: FieldConfig[] = [
  {
    key: "ALLOWED_DEV_ORIGINS",
    label: "Tunnel hostname",
    description: "Public hostname from ngrok or cloudflared (e.g. abc123.ngrok-free.app).",
    placeholder: "e.g., abc123.ngrok-free.app",
    docsUrl: DOCS_WEBHOOKS_DESKTOP_URL,
  },
];

export const AI_PROVIDER_OPTIONS = [
  { value: "", label: "Auto-detect" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "groq", label: "Groq" },
  { value: "openai-compatible", label: "OpenAI-compatible" },
  { value: "ollama", label: "Ollama" },
] as const;

export function getFieldsForAiProvider(provider: AiProviderId): FieldConfig[] {
  return AI_FIELDS_BY_PROVIDER[provider];
}

export function getFieldsForGitProvider(provider: GitProviderId): FieldConfig[] {
  return GIT_FIELDS_BY_PROVIDER[provider];
}

export function getGitFieldGroup(provider: GitProviderId): FieldGroupConfig {
  const index: Record<GitProviderId, number> = {
    github: 0,
    gitlab: 1,
    bitbucket: 2,
  };
  return CONFIG_FIELD_GROUPS[index[provider]]!;
}

export function emptyFormState(): Record<string, string> {
  return Object.fromEntries(DESKTOP_USER_ENV_KEYS.map((key) => [key, ""]));
}

export function detectAiProvider(
  values: Record<string, string>,
  secretsSet: Record<string, boolean>,
): AiProviderId {
  const explicit = values.AI_PROVIDER?.trim();
  if (explicit === "openrouter") {
    return "openrouter";
  }
  if (explicit === "anthropic") {
    return "anthropic";
  }
  if (explicit === "groq") {
    return "groq";
  }
  if (explicit === "ollama" || explicit === "openai-compatible") {
    return "ollama";
  }

  if (values.OPENROUTER_API_KEY?.trim() || secretsSet.OPENROUTER_API_KEY) {
    return "openrouter";
  }
  if (values.ANTHROPIC_API_KEY?.trim() || secretsSet.ANTHROPIC_API_KEY) {
    return "anthropic";
  }
  if (values.GROQ_API_KEY?.trim() || secretsSet.GROQ_API_KEY) {
    return "groq";
  }
  if (
    values.OPENAI_BASE_URL?.trim() ||
    values.OPENAI_API_KEY?.trim() ||
    secretsSet.OPENAI_API_KEY
  ) {
    return "ollama";
  }
  return "openrouter";
}

export function detectGitProvider(
  values: Record<string, string>,
  secretsSet: Record<string, boolean>,
  status?: { github: boolean; gitlab: boolean; bitbucket: boolean },
): GitProviderId {
  if (status?.github) {
    return "github";
  }
  if (status?.gitlab) {
    return "gitlab";
  }
  if (status?.bitbucket) {
    return "bitbucket";
  }

  if (values.GITHUB_APP_SLUG?.trim() || values.GITHUB_APP_ID?.trim()) {
    return "github";
  }
  if (values.GITLAB_CLIENT_ID?.trim() || secretsSet.GITLAB_CLIENT_SECRET) {
    return "gitlab";
  }
  if (values.BITBUCKET_CLIENT_ID?.trim() || secretsSet.BITBUCKET_CLIENT_SECRET) {
    return "bitbucket";
  }

  return "github";
}

export function validateAiStep(
  provider: AiProviderId,
  values: Record<string, string>,
  secretsSet: Record<string, boolean>,
): Record<string, string> {
  const issues: Record<string, string> = {};
  const fields = getFieldsForAiProvider(provider);

  for (const field of fields) {
    const isSecret = field.type === "password";
    const hasValue = Boolean(values[field.key]?.trim()) || (isSecret && secretsSet[field.key]);

    if (field.key === "OPENAI_API_KEY") {
      continue;
    }

    if (!hasValue) {
      issues[field.key] = "This field is required.";
    }
  }

  return issues;
}

export function validateGitStep(
  provider: GitProviderId,
  values: Record<string, string>,
  secretsSet: Record<string, boolean>,
): Record<string, string> {
  const issues: Record<string, string> = {};
  const fields = getFieldsForGitProvider(provider);

  for (const field of fields) {
    if (field.key === "GITLAB_BASE_URL") {
      continue;
    }

    const isSecret = field.type === "password" || field.type === "textarea";
    const hasValue = Boolean(values[field.key]?.trim()) || (isSecret && secretsSet[field.key]);

    if (!hasValue) {
      issues[field.key] = "This field is required.";
    }
  }

  return issues;
}

export function pickValuesForKeys(
  values: Record<string, string>,
  keys: string[],
): Record<string, string> {
  const picked: Record<string, string> = {};
  for (const key of keys) {
    picked[key] = values[key] ?? "";
  }
  return picked;
}
