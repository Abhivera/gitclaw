import { requireAuth } from "@/features/auth/actions";
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
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Integrations · Dashboard",
};

const IntegrationsPage = async () => {
  const session = await requireAuth();
  const userId = session.user.id;

  const [github, gitlab, bitbucket] = await Promise.all([
    getConnectionStatus(userId, "github"),
    getConnectionStatus(userId, "gitlab"),
    getConnectionStatus(userId, "bitbucket"),
  ]);

  const githubSetup = getProviderSetup("github");
  const gitlabSetup = getProviderSetup("gitlab");
  const bitbucketSetup = getProviderSetup("bitbucket");

  return (
    <>
      <DashboardHeader
        title="Integrations"
        description="Connect GitHub, GitLab, or Bitbucket to receive automated pull request reviews."
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <ProviderConnectCard
          provider="github"
          label={GIT_PROVIDER_LABELS.github}
          description="Install the reviewer GitHub App on your account or organization."
          icon={<GithubIcon className="size-5" />}
          configured={githubSetup.configured}
          setupHint={githubSetup.setupHint}
          installUrl={
            githubSetup.configured ? getGithubInstallUrl(userId) : null
          }
          connection={github}
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
          installUrl={
            gitlabSetup.configured ? getGitlabOAuthUrl(userId) : null
          }
          connection={gitlab}
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
          installUrl={
            bitbucketSetup.configured ? getBitbucketOAuthUrl(userId) : null
          }
          connection={bitbucket}
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
