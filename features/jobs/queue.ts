import { PgBoss } from "pg-boss";
import { env } from "@/lib/env";

export const QUEUES = {
  prReceived: "pr.received",
  prChatReceived: "pr.chat-received",
  prAutoDescription: "pr.auto-description",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export type PrReceivedJob = { pullRequestId: string };
export type AutoDescriptionJob = { pullRequestId: string };
export type ChatReceivedJob = {
  pullRequestId: string;
  commentId: string;
  body: string;
  authorLogin: string | null;
};

const globalForBoss = globalThis as unknown as {
  pgBoss: Promise<PgBoss> | undefined;
};

async function bootstrap(): Promise<PgBoss> {
  const boss = new PgBoss({
    connectionString: env.DATABASE_URL,
    // pg-boss manages its own `pgboss` schema; keep the pool small since the
    // app already holds a Prisma pool against the same database.
    max: 4,
  });

  boss.on("error", (error: unknown) => {
    console.error("[gitclaw] pg-boss error", error);
  });

  await boss.start();

  // Every queue must exist before sending or working. Durable retries with
  // exponential backoff so transient provider/AI failures recover on their own.
  // `stately` on review queues: at most one queued + one active job per PR key,
  // so duplicate webhooks cannot run overlapping reviews.
  await Promise.all(
    Object.values(QUEUES).map((name) =>
      boss.createQueue(name, {
        retryLimit: 3,
        retryDelay: 5,
        retryBackoff: true,
        policy: name === QUEUES.prChatReceived ? "standard" : "stately",
      })
    )
  );

  return boss;
}

export function getBoss(): Promise<PgBoss> {
  if (!globalForBoss.pgBoss) {
    globalForBoss.pgBoss = bootstrap();
  }
  return globalForBoss.pgBoss;
}

function singletonKeyFor(
  name: QueueName,
  data: PrReceivedJob | AutoDescriptionJob | ChatReceivedJob
): string | undefined {
  if (name === QUEUES.prChatReceived) {
    const chat = data as ChatReceivedJob;
    return `${chat.pullRequestId}:${chat.commentId}`;
  }
  if ("pullRequestId" in data) {
    return data.pullRequestId;
  }
  return undefined;
}

export async function enqueue(
  name: QueueName,
  data: PrReceivedJob | AutoDescriptionJob | ChatReceivedJob
): Promise<void> {
  const boss = await getBoss();
  const singletonKey = singletonKeyFor(name, data);
  await boss.send(name, data, singletonKey ? { singletonKey } : undefined);
}
