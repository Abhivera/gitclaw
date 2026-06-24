import { getOrCreateDefaultOrg } from "@/features/organizations/server/org";
import { prisma } from "@/lib/db";
import { isCoreEnvConfigured } from "@/lib/env";

export const INSTANCE_USER_ID = "local";

export async function ensureInstance(): Promise<void> {
  if (!isCoreEnvConfigured()) {
    throw new Error("GitClaw environment is not configured.");
  }

  await prisma.user.upsert({
    where: { id: INSTANCE_USER_ID },
    create: {
      id: INSTANCE_USER_ID,
      name: "GitClaw",
      email: "local@gitclaw.local",
    },
    update: {},
  });

  await getOrCreateDefaultOrg();
}
