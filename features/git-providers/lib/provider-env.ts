import { getEnvValue } from "@/lib/env-helpers";

export function isGitHubProviderConfigured(): boolean {
  return Boolean(getEnvValue("GITHUB_APP_SLUG"));
}

export function isGitlabProviderConfigured(): boolean {
  return Boolean(getEnvValue("GITLAB_CLIENT_ID") && getEnvValue("GITLAB_CLIENT_SECRET"));
}

export function isBitbucketProviderConfigured(): boolean {
  return Boolean(
    getEnvValue("BITBUCKET_CLIENT_ID") && getEnvValue("BITBUCKET_CLIENT_SECRET"),
  );
}

export function isGitProviderConfigured(): boolean {
  return (
    isGitHubProviderConfigured() ||
    isGitlabProviderConfigured() ||
    isBitbucketProviderConfigured()
  );
}

export function isAiProviderConfigured(): boolean {
  return Boolean(
    getEnvValue("OPENROUTER_API_KEY") ||
      getEnvValue("GROQ_API_KEY") ||
      getEnvValue("OPENAI_BASE_URL"),
  );
}
