import { createHmac, timingSafeEqual } from "crypto";
import type {
  GitProviderAdapter,
  ProviderConnectionRecord,
  PullRequestRecord,
} from "../types";
import type { PrFile } from "@/features/reviews/types/review";
import { bitbucketRequest, splitUnifiedDiff } from "./client";
import {
  formatFindingBody,
  formatReviewSummary,
} from "@/features/reviews/server/post-inline-review";
import { GITCLAW_MENTION } from "../constants";

type BitbucketWebhookPayload = {
  repository: {
    uuid: string;
    full_name: string;
  };
  pullrequest: {
    id: number;
    title: string;
    state?: string;
    description?: string;
    author?: { display_name?: string };
    source: {
      branch: { name: string };
      commit: { hash: string };
    };
    destination: {
      branch: { name: string };
    };
  };
};

type BitbucketCommentPayload = {
  repository: {
    uuid: string;
    full_name: string;
  };
  pullrequest: {
    id: number;
  };
  comment: {
    id: number;
    content: { raw: string };
    user?: { display_name?: string };
  };
};

function verifyBitbucketSignature(
  payload: string,
  signature: string | null,
  secret: string
) {
  if (!signature?.startsWith("sha256=")) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const received = signature.slice("sha256=".length);

  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(received, "hex")
    );
  } catch {
    return false;
  }
}

function splitRepoFullName(repoFullName: string) {
  const [workspace, repoSlug] = repoFullName.split("/");
  return { workspace, repoSlug };
}

async function fetchBitbucketDiff(
  connection: ProviderConnectionRecord,
  pullRequest: PullRequestRecord,
  spec: string
): Promise<PrFile[]> {
  if (!connection.accessToken) {
    throw new Error("Bitbucket connection missing access token");
  }

  const { workspace, repoSlug } = splitRepoFullName(pullRequest.repoFullName);
  const diff = await bitbucketRequest<string>({
    accessToken: connection.accessToken,
    path: `/repositories/${workspace}/${repoSlug}/diff/${spec}`,
  });

  return splitUnifiedDiff(diff).map((file) => ({
    filePath: file.filePath,
    patch: file.patch,
  }));
}

export const bitbucketAdapter: GitProviderAdapter = {
  provider: "bitbucket",

  async verifyWebhook(request, connection) {
    if (!connection) {
      return { valid: false };
    }

    const payload = await request.text();
    const signature = request.headers.get("x-hub-signature");

    if (!verifyBitbucketSignature(payload, signature, connection.webhookSecret)) {
      return { valid: false };
    }

    return { valid: true, payload: JSON.parse(payload) };
  },

  parsePullRequestEvent(payload) {
    const event = payload as BitbucketWebhookPayload;

    return {
      provider: "bitbucket",
      connectionExternalId: "",
      repoFullName: event.repository.full_name,
      prNumber: event.pullrequest.id,
      projectExternalId: event.repository.uuid,
      title: event.pullrequest.title,
      authorLogin: event.pullrequest.author?.display_name ?? null,
      headSha: event.pullrequest.source.commit.hash,
      baseBranch: event.pullrequest.destination.branch.name,
      isDraft: false,
    };
  },

  parseCommentEvent(payload) {
    const event = payload as BitbucketCommentPayload;
    const body = event.comment.content?.raw ?? "";

    if (!GITCLAW_MENTION.test(body)) {
      return null;
    }

    return {
      provider: "bitbucket",
      connectionExternalId: "",
      repoFullName: event.repository.full_name,
      prNumber: event.pullrequest.id,
      projectExternalId: event.repository.uuid,
      commentId: String(event.comment.id),
      body,
      authorLogin: event.comment.user?.display_name ?? null,
    };
  },

  async getPullRequestBody(connection, pullRequest) {
    if (!connection.accessToken) {
      return null;
    }

    const { workspace, repoSlug } = splitRepoFullName(pullRequest.repoFullName);

    const pr = await bitbucketRequest<{ description?: string }>({
      accessToken: connection.accessToken,
      path: `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequest.prNumber}`,
    });

    return pr.description ?? "";
  },

  async updatePullRequestDescription(connection, pullRequest, body) {
    if (!connection.accessToken) {
      throw new Error("Bitbucket connection missing access token");
    }

    const { workspace, repoSlug } = splitRepoFullName(pullRequest.repoFullName);

    await bitbucketRequest({
      accessToken: connection.accessToken,
      path: `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequest.prNumber}`,
      method: "PUT",
      body: { description: body },
    });
  },

  async getPullRequestFiles(connection, pullRequest, options) {
    const { workspace, repoSlug } = splitRepoFullName(pullRequest.repoFullName);

    if (options?.sinceSha) {
      const spec = `${options.sinceSha}..${pullRequest.headSha}`;
      return fetchBitbucketDiff(connection, pullRequest, spec);
    }

    if (!connection.accessToken) {
      throw new Error("Bitbucket connection missing access token");
    }

    const diff = await bitbucketRequest<string>({
      accessToken: connection.accessToken,
      path: `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequest.prNumber}/diff`,
    });

    return splitUnifiedDiff(diff).map((file) => ({
      filePath: file.filePath,
      patch: file.patch,
    }));
  },

  async postPullRequestComment(connection, pullRequest, body) {
    if (!connection.accessToken) {
      throw new Error("Bitbucket connection missing access token");
    }

    const { workspace, repoSlug } = splitRepoFullName(pullRequest.repoFullName);

    await bitbucketRequest({
      accessToken: connection.accessToken,
      path: `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequest.prNumber}/comments`,
      method: "POST",
      body: { content: { raw: body } },
    });
  },

  async postReview(connection, pullRequest, review, findings) {
    if (!connection.accessToken) {
      throw new Error("Bitbucket connection missing access token");
    }

    const { workspace, repoSlug } = splitRepoFullName(pullRequest.repoFullName);
    const commentsPath = `/repositories/${workspace}/${repoSlug}/pullrequests/${pullRequest.prNumber}/comments`;
    const summary = formatReviewSummary(review);

    await bitbucketRequest({
      accessToken: connection.accessToken,
      path: commentsPath,
      method: "POST",
      body: { content: { raw: summary } },
    });

    for (const finding of findings) {
      await bitbucketRequest({
        accessToken: connection.accessToken,
        path: commentsPath,
        method: "POST",
        body: {
          content: { raw: formatFindingBody(finding) },
          inline: {
            path: finding.file,
            to: finding.line,
          },
        },
      });
    }
  },

  async fetchFileContent(connection, repoFullName, filePath, ref) {
    if (!connection.accessToken) {
      return null;
    }

    const { workspace, repoSlug } = splitRepoFullName(repoFullName);

    try {
      return await bitbucketRequest<string>({
        accessToken: connection.accessToken,
        path: `/repositories/${workspace}/${repoSlug}/src/${encodeURIComponent(ref)}/${filePath}`,
      });
    } catch {
      return null;
    }
  },

  async fetchGitclawConfig(connection, repoFullName, defaultBranch) {
    if (!connection.accessToken) {
      return null;
    }

    const { workspace, repoSlug } = splitRepoFullName(repoFullName);

    let branch = defaultBranch;
    if (!branch) {
      try {
        const repo = await bitbucketRequest<{
          mainbranch?: { name: string };
        }>({
          accessToken: connection.accessToken,
          path: `/repositories/${workspace}/${repoSlug}`,
        });
        branch = repo.mainbranch?.name ?? "main";
      } catch {
        branch = "main";
      }
    }

    try {
      const content = await bitbucketRequest<string>({
        accessToken: connection.accessToken,
        path: `/repositories/${workspace}/${repoSlug}/src/${encodeURIComponent(branch!)}/.gitclaw.yaml`,
      });

      return {
        content,
        sha: `${branch}-gitclaw`,
        defaultBranch: branch!,
      };
    } catch {
      return null;
    }
  },

  async setCommitStatus() {},

  async listRepositories(connection) {
    if (!connection.accessToken) {
      return [];
    }

    const data = await bitbucketRequest<{
      values: Array<{
        full_name: string;
        mainbranch?: { name: string };
      }>;
    }>({
      accessToken: connection.accessToken,
      path: "/repositories?role=member&pagelen=100",
    });

    return (data.values ?? []).map((repo) => ({
      fullName: repo.full_name,
      defaultBranch: repo.mainbranch?.name ?? "main",
    }));
  },
};
