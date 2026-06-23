import { enqueue, QUEUES } from "@/features/jobs/queue";
import type { GitProvider } from "@/lib/generated/prisma/client";
import { getProviderAdapter } from "../server/get-adapter";
import {
  getConnectionByExternalId,
  getConnectionById,
} from "../server/connections";
import { loadRepositoryConfig } from "@/features/config/server/load-repo-config";
import { getOrCreateRepository } from "@/features/repositories/server/get-or-create-repository";
import {
  findExistingPullRequest,
  savePullRequest,
} from "@/features/reviews/server/save-pull-request";
import { shouldSkipReview } from "@/features/reviews/server/review-gate";
import { handleCommentWebhook } from "./comment-webhook-handler";
import { CHAT_BITBUCKET_EVENTS } from "../constants";

export async function handleProviderWebhook(
  provider: GitProvider,
  connectionId: string | null,
  request: Request
) {
  const adapter = getProviderAdapter(provider);

  let connection = null;
  if (connectionId) {
    connection = await getConnectionById(connectionId);
    if (!connection || connection.provider !== provider) {
      return Response.json({ error: "Connection not found" }, { status: 404 });
    }
  }

  const { valid, payload } = await adapter.verifyWebhook(
    request,
    connection ?? undefined
  );

  if (!valid || !payload) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (provider === "github") {
    const eventName = request.headers.get("x-github-event");
    if (eventName === "issue_comment") {
      return handleCommentWebhook(provider, connection, payload);
    }
    if (eventName !== "pull_request") {
      return Response.json({ received: true });
    }
  }

  if (provider === "gitlab") {
    const event = payload as { object_kind?: string };
    if (event.object_kind === "note") {
      return handleCommentWebhook(provider, connection, payload);
    }
    if (event.object_kind !== "merge_request") {
      return Response.json({ received: true });
    }
  }

  if (provider === "bitbucket") {
    const eventName = request.headers.get("x-event-key");
    if (eventName && CHAT_BITBUCKET_EVENTS.includes(eventName)) {
      return handleCommentWebhook(provider, connection, payload);
    }
    const { REVIEWABLE_BITBUCKET_EVENTS } = await import("../constants");
    if (!eventName || !REVIEWABLE_BITBUCKET_EVENTS.includes(eventName)) {
      return Response.json({ received: true });
    }
  }

  const normalized = adapter.parsePullRequestEvent(payload);
  if (!normalized) {
    return Response.json({ received: true });
  }

  if (!connection && normalized.connectionExternalId) {
    connection = await getConnectionByExternalId(
      provider,
      normalized.connectionExternalId
    );
  }

  if (!connection) {
    return Response.json(
      { error: "No connected account for this event" },
      { status: 404 }
    );
  }

  const repository = await getOrCreateRepository({
    connectionId: connection.id,
    provider,
    fullName: normalized.repoFullName,
    defaultBranch: normalized.baseBranch,
  });

  const config = await loadRepositoryConfig(connection, repository);

  const existing = await findExistingPullRequest(connection.id, normalized);
  const gate = shouldSkipReview({
    title: normalized.title,
    authorLogin: normalized.authorLogin,
    headSha: normalized.headSha,
    isDraft: normalized.isDraft,
    lastReviewedSha: existing?.lastReviewedSha ?? null,
    repoEnabled: repository.enabled,
    reviewsEnabled: config.reviews.enabled,
  });

  const isOpened =
    normalized.action === "opened" ||
    normalized.action === "open" ||
    request.headers.get("x-event-key") === "pullrequest:created";

  if (gate.skip) {
    const saved = await savePullRequest(connection.id, normalized, {
      status: "skipped",
      skipReason: gate.reason,
      repositoryId: repository.id,
    });

    if (isOpened && config.auto_description) {
      await enqueue(QUEUES.prAutoDescription, { pullRequestId: saved.id });
    }

    return Response.json({ received: true, skipped: gate.reason });
  }

  const pullRequest = await savePullRequest(connection.id, normalized, {
    repositoryId: repository.id,
  });

  await enqueue(QUEUES.prReceived, { pullRequestId: pullRequest.id });

  if (isOpened && config.auto_description) {
    await enqueue(QUEUES.prAutoDescription, { pullRequestId: pullRequest.id });
  }

  return Response.json({ received: true });
}
