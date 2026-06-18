import type {
  GitProviderAdapter,
  ProviderConnectionRecord,
  PullRequestRecord,
} from "../types";
import { REVIEWABLE_GITLAB_ACTIONS, GITCLAW_MENTION } from "../constants";
import type { PrFile } from "@/features/reviews/types/review";
import {
  formatFindingBody,
  formatReviewSummary,
} from "@/features/reviews/server/post-inline-review";
import { gitlabRequest, getGitlabBaseUrl } from "./client";

async function resolveGitlabProject(
  connection: ProviderConnectionRecord,
  repoFullName: string
) {
  if (!connection.accessToken) {
    return null;
  }

  try {
    return await gitlabRequest<{
      id: number;
      default_branch?: string;
    }>({
      accessToken: connection.accessToken,
      path: `/projects/${encodeURIComponent(repoFullName)}`,
    });
  } catch {
    return null;
  }
}

type GitlabWebhookPayload = {
  object_kind: string;
  object_attributes: {
    action: string;
    iid: number;
    title: string;
    draft?: boolean;
    work_in_progress?: boolean;
    last_commit?: { id: string };
    source_branch: string;
    target_branch: string;
    description?: string;
  };
  user?: { username: string };
  project: {
    id: number;
    path_with_namespace: string;
  };
};

type GitlabNotePayload = {
  object_kind: string;
  object_attributes: {
    note: string;
    noteable_type: string;
    id: number;
  };
  user?: { username: string };
  project: {
    id: number;
    path_with_namespace: string;
  };
  merge_request?: {
    iid: number;
  };
};

type GitlabDiffRefs = {
  base_sha: string;
  head_sha: string;
  start_sha: string;
};

async function getGitlabDiffRefs(
  connection: ProviderConnectionRecord,
  pullRequest: PullRequestRecord
): Promise<GitlabDiffRefs> {
  if (!connection.accessToken || !pullRequest.projectExternalId) {
    throw new Error("GitLab connection missing access token or project ID");
  }

  const mr = await gitlabRequest<{ diff_refs: GitlabDiffRefs }>({
    accessToken: connection.accessToken,
    path: `/projects/${encodeURIComponent(pullRequest.projectExternalId)}/merge_requests/${pullRequest.prNumber}`,
  });

  return mr.diff_refs;
}

async function fetchGitlabCompareFiles(
  connection: ProviderConnectionRecord,
  pullRequest: PullRequestRecord,
  sinceSha: string
): Promise<PrFile[]> {
  if (!connection.accessToken || !pullRequest.projectExternalId) {
    throw new Error("GitLab connection missing access token or project ID");
  }

  const data = await gitlabRequest<{
    diffs: Array<{
      old_path: string;
      new_path: string;
      diff: string;
    }>;
  }>({
    accessToken: connection.accessToken,
    path: `/projects/${encodeURIComponent(pullRequest.projectExternalId)}/repository/compare?from=${encodeURIComponent(sinceSha)}&to=${encodeURIComponent(pullRequest.headSha)}`,
  });

  const files: PrFile[] = [];
  for (const change of data.diffs ?? []) {
    if (!change.diff) {
      continue;
    }
    files.push({
      filePath: change.new_path || change.old_path,
      patch: change.diff,
    });
  }
  return files;
}

async function fetchGitlabMrFiles(
  connection: ProviderConnectionRecord,
  pullRequest: PullRequestRecord
): Promise<PrFile[]> {
  if (!connection.accessToken || !pullRequest.projectExternalId) {
    throw new Error("GitLab connection missing access token or project ID");
  }

  const data = await gitlabRequest<{
    changes: Array<{
      old_path: string;
      new_path: string;
      diff: string;
    }>;
  }>({
    accessToken: connection.accessToken,
    path: `/projects/${encodeURIComponent(pullRequest.projectExternalId)}/merge_requests/${pullRequest.prNumber}/changes`,
  });

  const files: PrFile[] = [];
  for (const change of data.changes) {
    if (!change.diff) {
      continue;
    }
    files.push({
      filePath: change.new_path || change.old_path,
      patch: change.diff,
    });
  }
  return files;
}

export const gitlabAdapter: GitProviderAdapter = {
  provider: "gitlab",

  async verifyWebhook(request, connection) {
    if (!connection) {
      return { valid: false };
    }

    const token = request.headers.get("x-gitlab-token");
    if (!token || token !== connection.webhookSecret) {
      return { valid: false };
    }

    const payload = await request.json();
    return { valid: true, payload };
  },

  parsePullRequestEvent(payload) {
    const event = payload as GitlabWebhookPayload;
    if (event.object_kind !== "merge_request") {
      return null;
    }

    if (!REVIEWABLE_GITLAB_ACTIONS.includes(event.object_attributes.action)) {
      return null;
    }

    const attrs = event.object_attributes;

    return {
      provider: "gitlab",
      connectionExternalId: "",
      repoFullName: event.project.path_with_namespace,
      prNumber: attrs.iid,
      projectExternalId: String(event.project.id),
      title: attrs.title,
      authorLogin: event.user?.username ?? null,
      headSha: attrs.last_commit?.id ?? "",
      baseBranch: attrs.target_branch,
      isDraft: attrs.draft ?? attrs.work_in_progress ?? false,
      action: attrs.action,
    };
  },

  parseCommentEvent(payload) {
    const event = payload as GitlabNotePayload;
    if (event.object_kind !== "note") {
      return null;
    }

    if (event.object_attributes.noteable_type !== "MergeRequest") {
      return null;
    }

    if (!GITCLAW_MENTION.test(event.object_attributes.note)) {
      return null;
    }

    if (!event.merge_request?.iid) {
      return null;
    }

    return {
      provider: "gitlab",
      connectionExternalId: "",
      repoFullName: event.project.path_with_namespace,
      prNumber: event.merge_request.iid,
      projectExternalId: String(event.project.id),
      commentId: String(event.object_attributes.id),
      body: event.object_attributes.note,
      authorLogin: event.user?.username ?? null,
    };
  },

  async getPullRequestBody(connection, pullRequest) {
    if (!connection.accessToken || !pullRequest.projectExternalId) {
      return null;
    }

    const mr = await gitlabRequest<{ description?: string }>({
      accessToken: connection.accessToken,
      path: `/projects/${encodeURIComponent(pullRequest.projectExternalId)}/merge_requests/${pullRequest.prNumber}`,
    });

    return mr.description ?? "";
  },

  async updatePullRequestDescription(connection, pullRequest, body) {
    if (!connection.accessToken || !pullRequest.projectExternalId) {
      throw new Error("GitLab connection missing access token or project ID");
    }

    await gitlabRequest({
      accessToken: connection.accessToken,
      path: `/projects/${encodeURIComponent(pullRequest.projectExternalId)}/merge_requests/${pullRequest.prNumber}`,
      method: "PUT",
      body: { description: body },
    });
  },

  async getPullRequestFiles(connection, pullRequest, options) {
    if (options?.sinceSha) {
      return fetchGitlabCompareFiles(connection, pullRequest, options.sinceSha);
    }
    return fetchGitlabMrFiles(connection, pullRequest);
  },

  async postPullRequestComment(connection, pullRequest, body) {
    if (!connection.accessToken || !pullRequest.projectExternalId) {
      throw new Error("GitLab connection missing access token or project ID");
    }

    await gitlabRequest({
      accessToken: connection.accessToken,
      path: `/projects/${encodeURIComponent(pullRequest.projectExternalId)}/merge_requests/${pullRequest.prNumber}/notes`,
      method: "POST",
      body: { body },
    });
  },

  async postReview(connection, pullRequest, review, findings) {
    if (!connection.accessToken || !pullRequest.projectExternalId) {
      throw new Error("GitLab connection missing access token or project ID");
    }

    const summary = formatReviewSummary(review);
    const projectPath = encodeURIComponent(pullRequest.projectExternalId);
    const mrPath = `/projects/${projectPath}/merge_requests/${pullRequest.prNumber}`;

    await gitlabRequest({
      accessToken: connection.accessToken,
      path: `${mrPath}/notes`,
      method: "POST",
      body: { body: summary },
    });

    if (findings.length === 0) {
      return;
    }

    const diffRefs = await getGitlabDiffRefs(connection, pullRequest);

    for (const finding of findings) {
      await gitlabRequest({
        accessToken: connection.accessToken,
        path: `${mrPath}/discussions`,
        method: "POST",
        body: {
          body: formatFindingBody(finding),
          position: {
            position_type: "text",
            base_sha: diffRefs.base_sha,
            head_sha: diffRefs.head_sha,
            start_sha: diffRefs.start_sha,
            old_path: finding.file,
            new_path: finding.file,
            new_line: finding.line,
          },
        },
      });
    }
  },

  async fetchFileContent(connection, repoFullName, filePath, ref) {
    if (!connection.accessToken) {
      return null;
    }

    const project = await resolveGitlabProject(connection, repoFullName);
    if (!project) {
      return null;
    }

    try {
      const response = await fetch(
        `${getGitlabBaseUrl()}/api/v4/projects/${encodeURIComponent(project.id)}/repository/files/${encodeURIComponent(filePath)}/raw?ref=${encodeURIComponent(ref)}`,
        {
          headers: { Authorization: `Bearer ${connection.accessToken}` },
        }
      );

      if (!response.ok) {
        return null;
      }

      return response.text();
    } catch {
      return null;
    }
  },

  async fetchGitclawConfig(connection, repoFullName, defaultBranch) {
    if (!connection.accessToken) {
      return null;
    }

    const project = await resolveGitlabProject(connection, repoFullName);
    if (!project) {
      return null;
    }

    const branch = defaultBranch ?? project.default_branch ?? "main";

    try {
      const response = await fetch(
        `${getGitlabBaseUrl()}/api/v4/projects/${encodeURIComponent(project.id)}/repository/files/${encodeURIComponent(".gitclaw.yaml")}/raw?ref=${encodeURIComponent(branch)}`,
        {
          headers: { Authorization: `Bearer ${connection.accessToken}` },
        }
      );

      if (!response.ok) {
        return null;
      }

      const content = await response.text();
      return {
        content,
        sha: `${branch}-gitclaw`,
        defaultBranch: branch,
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

    const projects = await gitlabRequest<
      Array<{
        path_with_namespace: string;
        default_branch?: string;
      }>
    >({
      accessToken: connection.accessToken,
      path: "/projects?membership=true&simple=true&per_page=100",
    });

    return projects.map((project) => ({
      fullName: project.path_with_namespace,
      defaultBranch: project.default_branch ?? "main",
    }));
  },
};
