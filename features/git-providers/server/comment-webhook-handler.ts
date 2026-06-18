import { enqueue, QUEUES } from "@/features/jobs/queue";
import type { GitProvider } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { ProviderConnectionRecord } from "../types";
import { getProviderAdapter } from "./get-adapter";
import {
  getConnectionByExternalId,
  getConnectionById,
} from "./connections";

export async function handleCommentWebhook(
  provider: GitProvider,
  connection: ProviderConnectionRecord | null,
  payload: unknown
) {
  const adapter = getProviderAdapter(provider);
  const normalized = adapter.parseCommentEvent(payload);

  if (!normalized) {
    return Response.json({ received: true });
  }

  let resolvedConnection = connection;
  if (!resolvedConnection && normalized.connectionExternalId) {
    resolvedConnection = await getConnectionByExternalId(
      provider,
      normalized.connectionExternalId
    );
  }

  if (!resolvedConnection) {
    const pr = await prisma.pullRequest.findUnique({
      where: {
        provider_repoFullName_prNumber: {
          provider,
          repoFullName: normalized.repoFullName,
          prNumber: normalized.prNumber,
        },
      },
      select: { connectionId: true },
    });

    if (pr) {
      resolvedConnection = await getConnectionById(pr.connectionId);
    }
  }

  if (!resolvedConnection) {
    return Response.json(
      { error: "No connected account for this comment" },
      { status: 404 }
    );
  }

  const pullRequest = await prisma.pullRequest.findUnique({
    where: {
      provider_repoFullName_prNumber: {
        provider,
        repoFullName: normalized.repoFullName,
        prNumber: normalized.prNumber,
      },
    },
  });

  if (!pullRequest) {
    return Response.json({ received: true, skipped: "pr_not_found" });
  }

  await enqueue(QUEUES.prChatReceived, {
    pullRequestId: pullRequest.id,
    commentId: normalized.commentId,
    body: normalized.body,
    authorLogin: normalized.authorLogin,
  });

  return Response.json({ received: true, chat: true });
}
