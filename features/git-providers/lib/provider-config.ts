import {
  isBitbucketProviderConfigured,
  isGitHubProviderConfigured,
  isGitlabProviderConfigured,
} from "@/features/git-providers/lib/provider-env";
import { INSTANCE_USER_ID } from "@/lib/instance";
import type { GitProvider } from "@/lib/generated/prisma/client";
import { isDesktopApp } from "@/features/setup/lib/desktop-setup";

export type ProviderSetup = {
  configured: boolean;
  setupHint: string;
};

const SETUP_HINTS_WEB: Record<GitProvider, string> = {
  github:
    "Set GITHUB_APP_SLUG (and GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_WEBHOOK_SECRET for reviews) in .env.",
  gitlab: "Set GITLAB_CLIENT_ID and GITLAB_CLIENT_SECRET in .env.",
  bitbucket: "Set BITBUCKET_CLIENT_ID and BITBUCKET_CLIENT_SECRET in .env.",
};

const SETUP_HINTS_DESKTOP: Record<GitProvider, string> = {
  github:
    "Add your GitHub App slug, ID, private key, and webhook secret in Settings → Configuration.",
  gitlab: "Add your GitLab OAuth client ID and secret in Settings → Configuration.",
  bitbucket: "Add your Bitbucket OAuth consumer key and secret in Settings → Configuration.",
};

export function getProviderSetup(provider: GitProvider): ProviderSetup {
  const hints = isDesktopApp() ? SETUP_HINTS_DESKTOP : SETUP_HINTS_WEB;

  switch (provider) {
    case "github":
      return {
        configured: isGitHubProviderConfigured(),
        setupHint: hints.github,
      };
    case "gitlab":
      return {
        configured: isGitlabProviderConfigured(),
        setupHint: hints.gitlab,
      };
    case "bitbucket":
      return {
        configured: isBitbucketProviderConfigured(),
        setupHint: hints.bitbucket,
      };
  }
}

export function validateOAuthState(state: string | null): boolean {
  return Boolean(state && state === INSTANCE_USER_ID);
}
