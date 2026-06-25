import {
  isAiProviderConfigured,
  isBitbucketProviderConfigured,
  isGitHubProviderConfigured,
  isGitlabProviderConfigured,
  isGitProviderConfigured,
} from "@/features/git-providers/lib/provider-env";
import {
  getDesktopTunnelStatus,
  type DesktopTunnelStatus,
} from "@/features/setup/lib/desktop-tunnel";
import { isDesktopApp } from "@/features/setup/lib/is-desktop";
import { getEnvValue } from "@/lib/env-helpers";

export { isDesktopApp };

export const isAiConfigured = isAiProviderConfigured;
export const isGitHubConfigured = isGitHubProviderConfigured;
export const isGitlabConfigured = isGitlabProviderConfigured;
export const isBitbucketConfigured = isBitbucketProviderConfigured;

export function isWebhooksConfigured(): boolean {
  return Boolean(getEnvValue("ALLOWED_DEV_ORIGINS"));
}

export function isDesktopSetupComplete(): boolean {
  if (!isDesktopApp()) {
    return true;
  }

  return isAiProviderConfigured() && isGitProviderConfigured();
}

export type DesktopSetupStatus = {
  ai: { complete: boolean };
  gitProvider: {
    complete: boolean;
    github: boolean;
    gitlab: boolean;
    bitbucket: boolean;
  };
  webhooks: { complete: boolean; tunnel: DesktopTunnelStatus | null };
  isComplete: boolean;
};

export function getDesktopSetupStatus(): DesktopSetupStatus {
  const gitProvider = {
    github: isGitHubProviderConfigured(),
    gitlab: isGitlabProviderConfigured(),
    bitbucket: isBitbucketProviderConfigured(),
    complete: isGitProviderConfigured(),
  };

  return {
    ai: { complete: isAiProviderConfigured() },
    gitProvider,
    webhooks: {
      complete: isWebhooksConfigured(),
      tunnel: isDesktopApp() ? getDesktopTunnelStatus() : null,
    },
    isComplete: isAiProviderConfigured() && gitProvider.complete,
  };
}
