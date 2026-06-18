import { env } from "@/lib/env";
import type { GitProvider } from "@/lib/generated/prisma/client";

export type ProviderSetup = {
  configured: boolean;
  setupHint: string;
};

const SETUP_HINTS: Record<GitProvider, string> = {
  github:
    "Set GITHUB_APP_SLUG (and GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_WEBHOOK_SECRET for reviews) in .env.",
  gitlab: "Set GITLAB_CLIENT_ID and GITLAB_CLIENT_SECRET in .env.",
  bitbucket: "Set BITBUCKET_CLIENT_ID and BITBUCKET_CLIENT_SECRET in .env.",
};

export function getProviderSetup(provider: GitProvider): ProviderSetup {
  switch (provider) {
    case "github":
      return {
        configured: Boolean(env.GITHUB_APP_SLUG),
        setupHint: SETUP_HINTS.github,
      };
    case "gitlab":
      return {
        configured: Boolean(env.GITLAB_CLIENT_ID && env.GITLAB_CLIENT_SECRET),
        setupHint: SETUP_HINTS.gitlab,
      };
    case "bitbucket":
      return {
        configured: Boolean(
          env.BITBUCKET_CLIENT_ID && env.BITBUCKET_CLIENT_SECRET
        ),
        setupHint: SETUP_HINTS.bitbucket,
      };
  }
}

export function validateOAuthState(
  state: string | null,
  userId: string
): boolean {
  return Boolean(state && state === userId);
}
