import { getProviderAdapter } from "@/features/git-providers/server/get-adapter";
import { getConnectionById } from "@/features/git-providers/server/connections";
import { prisma } from "@/lib/db";
import type { ChatReceivedJob } from "@/features/jobs/queue";
import type { ReviewFinding } from "../types/review-finding";
import { generateChatReply } from "./generate-chat-reply";

export async function runChatPullRequest({
  pullRequestId,
  body,
}: ChatReceivedJob) {
  const pullRequest = await prisma.pullRequest.findUnique({
    where: { id: pullRequestId },
  });

  if (!pullRequest) {
    throw new Error(`Pull request not found: ${pullRequestId}`);
  }

  const connection = await getConnectionById(pullRequest.connectionId);
  if (!connection) {
    throw new Error(`Connection not found: ${pullRequest.connectionId}`);
  }

  const findings = (pullRequest.reviewFindings as ReviewFinding[] | null) ?? [];

  const reply = await generateChatReply({
    repoFullName: pullRequest.repoFullName,
    prTitle: pullRequest.title,
    prNumber: pullRequest.prNumber,
    userMessage: body,
    reviewSummary: pullRequest.reviewComment,
    findings,
  });

  const adapter = getProviderAdapter(pullRequest.provider);
  await adapter.postPullRequestComment(
    connection,
    {
      id: pullRequest.id,
      provider: pullRequest.provider,
      connectionId: pullRequest.connectionId,
      repoFullName: pullRequest.repoFullName,
      prNumber: pullRequest.prNumber,
      projectExternalId: pullRequest.projectExternalId,
      headSha: pullRequest.headSha,
      baseBranch: pullRequest.baseBranch,
    },
    reply
  );

  return { pullRequestId, replied: true };
}
