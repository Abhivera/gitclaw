import type { Job, WorkHandler } from "pg-boss";
import { getBoss, QUEUES } from "./queue";
import { runReviewPullRequest } from "@/features/reviews/server/run-review-pr";
import { runChatPullRequest } from "@/features/reviews/server/run-chat-pr";
import { runAutoDescriptionPullRequest } from "@/features/reviews/server/run-auto-description";

const globalForWorkers = globalThis as unknown as {
  gitclawWorkersStarted: boolean | undefined;
};

// pg-boss hands each worker a batch of jobs; we process one at a time so a
// single failing job is retried without affecting its neighbours.
function eachJob<T>(
  handler: (data: T) => Promise<unknown>
): WorkHandler<T> {
  return async (jobs: Job<T>[]) => {
    for (const job of jobs) {
      await handler(job.data);
    }
  };
}

export async function startWorkers(): Promise<void> {
  if (globalForWorkers.gitclawWorkersStarted) {
    return;
  }
  globalForWorkers.gitclawWorkersStarted = true;

  const boss = await getBoss();

  await boss.work(QUEUES.prReceived, eachJob(runReviewPullRequest));
  await boss.work(QUEUES.prChatReceived, eachJob(runChatPullRequest));
  await boss.work(
    QUEUES.prAutoDescription,
    eachJob(runAutoDescriptionPullRequest)
  );

  console.info("[gitclaw] background workers started");
}
