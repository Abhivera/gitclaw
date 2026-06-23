import type { NormalizedPullRequest } from "@/features/git-providers/types";
import { prisma } from "@/lib/db";

type SaveOptions = {
  status?: string;
  skipReason?: string | null;
  repositoryId?: string | null;
};

export async function savePullRequest(
  connectionId: string,
  payload: NormalizedPullRequest,
  options?: SaveOptions
) {
  const { provider, repoFullName, prNumber } = payload;

  return prisma.pullRequest.upsert({
    where: {
      connectionId_repoFullName_prNumber: { connectionId, repoFullName, prNumber },
    },
    create: {
      connectionId,
      repositoryId: options?.repositoryId ?? null,
      provider,
      repoFullName,
      prNumber,
      projectExternalId: payload.projectExternalId ?? null,
      title: payload.title,
      authorLogin: payload.authorLogin,
      headSha: payload.headSha,
      baseBranch: payload.baseBranch,
      status: options?.status ?? "pending",
      skipReason: options?.skipReason ?? null,
    },
    update: {
      repositoryId: options?.repositoryId ?? undefined,
      title: payload.title,
      headSha: payload.headSha,
      projectExternalId: payload.projectExternalId ?? null,
      status: options?.status ?? "pending",
      skipReason: options?.skipReason ?? null,
    },
  });
}

export async function findExistingPullRequest(
  connectionId: string,
  payload: NormalizedPullRequest
) {
  const { repoFullName, prNumber } = payload;

  return prisma.pullRequest.findUnique({
    where: {
      connectionId_repoFullName_prNumber: { connectionId, repoFullName, prNumber },
    },
    select: {
      lastReviewedSha: true,
    },
  });
}
