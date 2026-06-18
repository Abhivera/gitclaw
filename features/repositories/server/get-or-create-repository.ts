import type { GitProvider } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";

export async function getOrCreateRepository(input: {
  connectionId: string;
  provider: GitProvider;
  fullName: string;
  defaultBranch?: string | null;
}) {
  return prisma.repository.upsert({
    where: {
      connectionId_fullName: {
        connectionId: input.connectionId,
        fullName: input.fullName,
      },
    },
    create: {
      connectionId: input.connectionId,
      provider: input.provider,
      fullName: input.fullName,
      defaultBranch: input.defaultBranch ?? null,
    },
    update: {
      defaultBranch: input.defaultBranch ?? undefined,
    },
  });
}
