import { App } from "octokit";
import type {
  GitProviderAdapter,
  ProviderConnectionRecord,
  PullRequestRecord,
} from "../types";
import { REVIEWABLE_GITHUB_ACTIONS, GITCLAW_MENTION } from "../constants";
import { INSTANCE_USER_ID } from "@/lib/instance";
import { env } from "@/lib/env";
import type { PrFile } from "@/features/reviews/types/review";
import {
  formatFindingBody,
  formatReviewSummary,
} from "@/features/reviews/server/post-inline-review";

let githubApp: App | null = null;

export function getGithubApp() {
  if (!githubApp) {
    const appId = env.GITHUB_APP_ID;
    const privateKey = env.GITHUB_APP_PRIVATE_KEY;
    const webhookSecret = env.GITHUB_WEBHOOK_SECRET;

    if (!appId || !privateKey || !webhookSecret) {
      throw new Error(
        "GitHub App is not configured. Set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, and GITHUB_WEBHOOK_SECRET to enable GitHub reviews."
      );
    }

    githubApp = new App({
      appId,
      privateKey: privateKey.replace(/\\n/g, "\n"),
      webhooks: {
        secret: webhookSecret,
      },
    });
  }

  return githubApp;
}

export function getGithubInstallUrl() {
  const appSlug = env.GITHUB_APP_SLUG;
  if (!appSlug) {
    throw new Error(
      "GITHUB_APP_SLUG is required to build the GitHub App install URL."
    );
  }
  const url = new URL(`https://github.com/apps/${appSlug}/installations/new`);
  url.searchParams.set("state", INSTANCE_USER_ID);
  return url.toString();
}

type GithubWebhookPayload = {
  action: string;
  installation: { id: number };
  repository: { full_name: string };
  pull_request: {
    number: number;
    title: string;
    draft?: boolean;
    user: { login: string; type?: string } | null;
    head: { sha: string };
    base: { ref: string };
  };
};

type GithubCommentPayload = {
  action: string;
  installation: { id: number };
  repository: { full_name: string };
  issue: {
    number: number;
    pull_request?: unknown;
  };
  comment: {
    id: number;
    body: string;
    user: { login: string; type?: string } | null;
  };
};

async function getInstallationOctokit(installationId: string) {
  const app = getGithubApp();
  return app.getInstallationOctokit(Number(installationId));
}

function splitOwnerRepo(repoFullName: string) {
  const [owner, repo] = repoFullName.split("/");
  return { owner, repo };
}

async function fetchGithubCompareFiles(
  connection: ProviderConnectionRecord,
  pullRequest: PullRequestRecord,
  sinceSha: string
): Promise<PrFile[]> {
  const octokit = await getInstallationOctokit(connection.externalId);
  const { owner, repo } = splitOwnerRepo(pullRequest.repoFullName);

  const { data } = await octokit.request(
    "GET /repos/{owner}/{repo}/compare/{basehead}",
    {
      owner,
      repo,
      basehead: `${sinceSha}...${pullRequest.headSha}`,
    }
  );

  const files: PrFile[] = [];
  for (const file of data.files ?? []) {
    if (!file.patch) {
      continue;
    }
    files.push({ filePath: file.filename, patch: file.patch });
  }
  return files;
}

async function fetchGithubPrFiles(
  connection: ProviderConnectionRecord,
  pullRequest: PullRequestRecord
): Promise<PrFile[]> {
  const octokit = await getInstallationOctokit(connection.externalId);
  const { owner, repo } = splitOwnerRepo(pullRequest.repoFullName);

  const { data } = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
    { owner, repo, pull_number: pullRequest.prNumber, per_page: 100 }
  );

  const files: PrFile[] = [];
  for (const file of data) {
    if (!file.patch) {
      continue;
    }
    files.push({ filePath: file.filename, patch: file.patch });
  }
  return files;
}

export const githubAdapter: GitProviderAdapter = {
  provider: "github",

  async verifyWebhook(request) {
    const payload = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    if (!signature) {
      return { valid: false };
    }

    const app = getGithubApp();
    const valid = await app.webhooks.verify(payload, signature);
    if (!valid) {
      return { valid: false };
    }

    return { valid: true, payload: JSON.parse(payload) };
  },

  parsePullRequestEvent(payload) {
    const event = payload as GithubWebhookPayload;
    if (!REVIEWABLE_GITHUB_ACTIONS.includes(event.action)) {
      return null;
    }

    const user = event.pull_request.user;

    return {
      provider: "github",
      connectionExternalId: String(event.installation.id),
      repoFullName: event.repository.full_name,
      prNumber: event.pull_request.number,
      title: event.pull_request.title,
      authorLogin: user?.login ?? null,
      headSha: event.pull_request.head.sha,
      baseBranch: event.pull_request.base.ref,
      isDraft: event.pull_request.draft ?? false,
      action: event.action,
    };
  },

  parseCommentEvent(payload) {
    const event = payload as GithubCommentPayload;
    if (event.action !== "created" || !event.issue.pull_request) {
      return null;
    }

    if (!GITCLAW_MENTION.test(event.comment.body)) {
      return null;
    }

    const user = event.comment.user;
    if (user?.type === "Bot") {
      return null;
    }

    return {
      provider: "github",
      connectionExternalId: String(event.installation.id),
      repoFullName: event.repository.full_name,
      prNumber: event.issue.number,
      commentId: String(event.comment.id),
      body: event.comment.body,
      authorLogin: user?.login ?? null,
    };
  },

  async getPullRequestBody(connection, pullRequest) {
    const octokit = await getInstallationOctokit(connection.externalId);
    const { owner, repo } = splitOwnerRepo(pullRequest.repoFullName);

    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}",
      { owner, repo, pull_number: pullRequest.prNumber }
    );

    return data.body ?? "";
  },

  async updatePullRequestDescription(connection, pullRequest, body) {
    const octokit = await getInstallationOctokit(connection.externalId);
    const { owner, repo } = splitOwnerRepo(pullRequest.repoFullName);

    await octokit.request("PATCH /repos/{owner}/{repo}/pulls/{pull_number}", {
      owner,
      repo,
      pull_number: pullRequest.prNumber,
      body,
    });
  },

  async getPullRequestFiles(connection, pullRequest, options) {
    if (options?.sinceSha) {
      return fetchGithubCompareFiles(connection, pullRequest, options.sinceSha);
    }
    return fetchGithubPrFiles(connection, pullRequest);
  },

  async postPullRequestComment(connection, pullRequest, body) {
    const octokit = await getInstallationOctokit(connection.externalId);
    const { owner, repo } = splitOwnerRepo(pullRequest.repoFullName);

    await octokit.request(
      "POST /repos/{owner}/{repo}/issues/{issue_number}/comments",
      {
        owner,
        repo,
        issue_number: pullRequest.prNumber,
        body,
      }
    );
  },

  async postReview(connection, pullRequest, review, findings) {
    const octokit = await getInstallationOctokit(connection.externalId);
    const { owner, repo } = splitOwnerRepo(pullRequest.repoFullName);
    const summary = formatReviewSummary(review);

    const comments = findings.map((finding) => ({
      path: finding.file,
      line: finding.line,
      side: "RIGHT" as const,
      body: formatFindingBody(finding),
    }));

    await octokit.request(
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
      {
        owner,
        repo,
        pull_number: pullRequest.prNumber,
        commit_id: pullRequest.headSha,
        body: summary,
        event: "COMMENT",
        comments,
      }
    );
  },

  async fetchFileContent(connection, repoFullName, filePath, ref) {
    const octokit = await getInstallationOctokit(connection.externalId);
    const { owner, repo } = splitOwnerRepo(repoFullName);

    try {
      const { data } = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        { owner, repo, path: filePath, ref }
      );

      if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
        return null;
      }

      return Buffer.from(data.content, "base64").toString("utf8");
    } catch {
      return null;
    }
  },

  async fetchGitclawConfig(connection, repoFullName, defaultBranch) {
    const octokit = await getInstallationOctokit(connection.externalId);
    const { owner, repo } = splitOwnerRepo(repoFullName);

    const { data: repoData } = await octokit.request(
      "GET /repos/{owner}/{repo}",
      { owner, repo }
    );

    const branch = defaultBranch ?? repoData.default_branch;

    try {
      const { data } = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        { owner, repo, path: ".gitclaw.yaml", ref: branch }
      );

      if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
        return null;
      }

      return {
        content: Buffer.from(data.content, "base64").toString("utf8"),
        sha: data.sha,
        defaultBranch: branch,
      };
    } catch {
      return null;
    }
  },

  async setCommitStatus(connection, pullRequest, params) {
    const octokit = await getInstallationOctokit(connection.externalId);
    const { owner, repo } = splitOwnerRepo(pullRequest.repoFullName);

    await octokit.request("POST /repos/{owner}/{repo}/statuses/{sha}", {
      owner,
      repo,
      sha: pullRequest.headSha,
      state: params.state,
      context: "gitclaw/review",
      description: params.description,
    });
  },

  async listRepositories(connection) {
    const octokit = await getInstallationOctokit(connection.externalId);

    const repos = await octokit.paginate(
      octokit.rest.apps.listReposAccessibleToInstallation,
      { per_page: 100 }
    );

    return repos.map((repo) => ({
      fullName: repo.full_name,
      defaultBranch: repo.default_branch ?? "main",
    }));
  },
};
