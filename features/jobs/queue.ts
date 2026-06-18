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
  await Promise.all(
    Object.values(QUEUES).map((name) =>
      boss.createQueue(name, {
        retryLimit: 3,
        retryDelay: 5,
        retryBackoff: true,
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

export async function enqueue(
  name: QueueName,
  data: PrReceivedJob | AutoDescriptionJob | ChatReceivedJob
): Promise<void> {
  const boss = await getBoss();
  await boss.send(name, data);
}
