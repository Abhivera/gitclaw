import { getProviderAdapter } from "@/features/git-providers/server/get-adapter";
import type { ProviderConnectionRecord } from "@/features/git-providers/types";
import { prisma } from "@/lib/db";

export async function syncRepositoriesFromProvider(
  connection: ProviderConnectionRecord
) {
  const adapter = getProviderAdapter(connection.provider);
  const remoteRepos = await adapter.listRepositories(connection);

  for (const repo of remoteRepos) {
    await prisma.repository.upsert({
      where: {
        connectionId_fullName: {
          connectionId: connection.id,
          fullName: repo.fullName,
        },
      },
      create: {
        connectionId: connection.id,
        provider: connection.provider,
        fullName: repo.fullName,
        defaultBranch: repo.defaultBranch,
      },
      update: {
        defaultBranch: repo.defaultBranch,
      },
    });
  }

  return remoteRepos.length;
}

export async function syncRepositoriesFromPullRequests(connectionId: string) {
  const prRepos = await prisma.pullRequest.findMany({
    where: { connectionId },
    select: { repoFullName: true, provider: true, baseBranch: true },
    distinct: ["repoFullName"],
  });

  for (const pr of prRepos) {
    await prisma.repository.upsert({
      where: {
        connectionId_fullName: {
          connectionId,
          fullName: pr.repoFullName,
        },
      },
      create: {
        connectionId,
        provider: pr.provider,
        fullName: pr.repoFullName,
        defaultBranch: pr.baseBranch,
      },
      update: {},
    });
  }

  return prRepos.length;
}
