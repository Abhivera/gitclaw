import { requireAuth } from "@/features/auth/actions";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { ProviderConnectCard } from "@/features/git-providers/components/provider-connect-card";
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

// Inline SVGs keep this server component free of client-only icon libraries.
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.51 11.51 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.218.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function GitlabIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="m23.6 9.593-.033-.086L20.3.98a.851.851 0 0 0-.336-.405.875.875 0 0 0-1 .054.875.875 0 0 0-.29.444l-2.205 6.749H7.531L5.326 1.073a.864.864 0 0 0-.29-.445.875.875 0 0 0-1-.054.851.851 0 0 0-.336.405L.433 9.502.4 9.588a6.066 6.066 0 0 0 2.012 7.01l.011.009.03.022 4.977 3.726 2.462 1.863 1.5 1.133a1.01 1.01 0 0 0 1.22 0l1.5-1.133 2.462-1.863 5.007-3.748.013-.01a6.07 6.07 0 0 0 2.003-7.004z" />
    </svg>
  );
}

function BitbucketIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M.778 1.213a.768.768 0 0 0-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 0 0 .77-.646l3.27-20.03a.768.768 0 0 0-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" />
    </svg>
  );
}

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
