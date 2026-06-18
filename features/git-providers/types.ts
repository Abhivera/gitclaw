import type { GitProvider } from "@/lib/generated/prisma/client";
import type { PrFile } from "@/features/reviews/types/review";
import type { StructuredReview } from "@/features/reviews/types/review-finding";

export type { GitProvider };

export type NormalizedPullRequest = {
  provider: GitProvider;
  connectionExternalId: string;
  repoFullName: string;
  prNumber: number;
  projectExternalId?: string;
  title: string;
  authorLogin: string | null;
  headSha: string;
  baseBranch: string;
  isDraft: boolean;
  action?: string;
};

export type NormalizedComment = {
  provider: GitProvider;
  connectionExternalId: string;
  repoFullName: string;
  prNumber: number;
  projectExternalId?: string;
  commentId: string;
  body: string;
  authorLogin: string | null;
};

export type ProviderConnectionStatus = {
  connected: boolean;
  accountLogin: string | null;
  installedAt: string | null;
  connectionId: string | null;
  webhookUrl: string | null;
  webhookSecret: string | null;
};

export type ProviderConnectionRecord = {
  id: string;
  provider: GitProvider;
  externalId: string;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: Date | string | null;
  accountLogin: string | null;
  webhookSecret: string;
  metadata: unknown;
};

export type PullRequestRecord = {
  id: string;
  provider: GitProvider;
  connectionId: string;
  repoFullName: string;
  prNumber: number;
  projectExternalId: string | null;
  headSha: string;
  baseBranch: string;
};

export type GetPullRequestFilesOptions = {
  sinceSha?: string;
};

export type CommitStatusState = "pending" | "success" | "failure" | "error";

export type RepoConfigFile = {
  content: string;
  sha: string;
  defaultBranch: string | null;
};

export type RemoteRepository = {
  fullName: string;
  defaultBranch: string;
};

export type GitProviderAdapter = {
  provider: GitProvider;
  verifyWebhook(
    request: Request,
    connection?: ProviderConnectionRecord
  ): Promise<{ valid: boolean; payload?: unknown }>;
  parsePullRequestEvent(payload: unknown): NormalizedPullRequest | null;
  parseCommentEvent(payload: unknown): NormalizedComment | null;
  getPullRequestBody(
    connection: ProviderConnectionRecord,
    pullRequest: PullRequestRecord
  ): Promise<string | null>;
  updatePullRequestDescription(
    connection: ProviderConnectionRecord,
    pullRequest: PullRequestRecord,
    body: string
  ): Promise<void>;
  getPullRequestFiles(
    connection: ProviderConnectionRecord,
    pullRequest: PullRequestRecord,
    options?: GetPullRequestFilesOptions
  ): Promise<PrFile[]>;
  postPullRequestComment(
    connection: ProviderConnectionRecord,
    pullRequest: PullRequestRecord,
    body: string
  ): Promise<void>;
  postReview(
    connection: ProviderConnectionRecord,
    pullRequest: PullRequestRecord,
    review: StructuredReview,
    findings: StructuredReview["findings"]
  ): Promise<void>;
  fetchFileContent(
    connection: ProviderConnectionRecord,
    repoFullName: string,
    filePath: string,
    ref: string
  ): Promise<string | null>;
  fetchGitclawConfig(
    connection: ProviderConnectionRecord,
    repoFullName: string,
    defaultBranch?: string
  ): Promise<RepoConfigFile | null>;
  setCommitStatus(
    connection: ProviderConnectionRecord,
    pullRequest: PullRequestRecord,
    params: { state: CommitStatusState; description: string }
  ): Promise<void>;
  listRepositories(
    connection: ProviderConnectionRecord
  ): Promise<RemoteRepository[]>;
};
