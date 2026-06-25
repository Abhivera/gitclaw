import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { ProviderConnectCard } from "@/features/git-providers/components/provider-connect-card";
import {
  BitbucketIcon,
  GithubIcon,
  GitlabIcon,
} from "@/features/git-providers/components/provider-icons";
import { GIT_PROVIDER_LABELS } from "@/features/git-providers/constants";
import { getConnectionStatus } from "@/features/git-providers/server/connections";
import { getGithubInstallUrl } from "@/features/git-providers/github/adapter";
import { getGitlabOAuthUrl } from "@/features/git-providers/gitlab/client";
import { getBitbucketOAuthUrl } from "@/features/git-providers/bitbucket/client";
import { getProviderSetup } from "@/features/git-providers/lib/provider-config";
import { DesktopWebhooksBanner } from "@/features/setup/components/desktop-webhooks-banner";
import { isDesktopApp } from "@/features/setup/lib/desktop-setup";
import { getDesktopTunnelStatus, getDesktopWebhookBaseUrl } from "@/features/setup/lib/desktop-tunnel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integrations · Dashboard",
};

const IntegrationsPage = async () => {
  const isDesktop = isDesktopApp();
  const webhookBaseUrl = isDesktop ? getDesktopWebhookBaseUrl() : undefined;

  const [github, gitlab, bitbucket] = await Promise.all([
    getConnectionStatus("github", webhookBaseUrl),
    getConnectionStatus("gitlab", webhookBaseUrl),
    getConnectionStatus("bitbucket", webhookBaseUrl),
  ]);

  const githubSetup = getProviderSetup("github");
  const gitlabSetup = getProviderSetup("gitlab");
  const bitbucketSetup = getProviderSetup("bitbucket");
  const tunnelStatus = isDesktop ? getDesktopTunnelStatus() : null;

  return (
    <>
      <DashboardHeader
        title="Integrations"
        description="Connect GitHub, GitLab, or Bitbucket to receive automated pull request reviews."
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <DesktopWebhooksBanner />
        <ProviderConnectCard
          provider="github"
          label={GIT_PROVIDER_LABELS.github}
          description="Install the reviewer GitHub App on your account or organization."
          icon={<GithubIcon className="size-5" />}
          configured={githubSetup.configured}
          setupHint={githubSetup.setupHint}
          installUrl={githubSetup.configured ? getGithubInstallUrl() : null}
          connection={github}
          isDesktop={isDesktop}
          publicWebhookUrl={
            tunnelStatus?.tunnelConfigured ? tunnelStatus.githubWebhookUrl : null
          }
          setupSteps={[
            "Install the app on repositories you want reviewed",
            "App-level webhooks are configured automatically",
            "Reviews post as comments on pull requests",
          ]}
        />
        <ProviderConnectCard
          provider="gitlab"
          label={GIT_PROVIDER_LABELS.gitlab}
          description="Authorize GitLab access and add a project webhook for merge requests."
          icon={<GitlabIcon className="size-5" />}
          configured={gitlabSetup.configured}
          setupHint={gitlabSetup.setupHint}
          installUrl={gitlabSetup.configured ? getGitlabOAuthUrl() : null}
          connection={gitlab}
          isDesktop={isDesktop}
          setupSteps={[
            "Authorize with your GitLab account",
            "Copy the webhook URL and secret into your project settings",
            "Enable Merge request events on the webhook",
          ]}
        />
        <ProviderConnectCard
          provider="bitbucket"
          label={GIT_PROVIDER_LABELS.bitbucket}
          description="Authorize Bitbucket access and add a repository webhook for pull requests."
          icon={<BitbucketIcon className="size-5" />}
          configured={bitbucketSetup.configured}
          setupHint={bitbucketSetup.setupHint}
          installUrl={bitbucketSetup.configured ? getBitbucketOAuthUrl() : null}
          connection={bitbucket}
          isDesktop={isDesktop}
          setupSteps={[
            "Authorize with your Bitbucket account",
            "Add a repository webhook with the URL and secret shown after connecting",
            "Subscribe to pull request created and updated events",
          ]}
        />
      </div>
    </>
  );
};

export default IntegrationsPage;
