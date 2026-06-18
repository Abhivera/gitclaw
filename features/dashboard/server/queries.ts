import { prisma } from "@/lib/db";
import { getConnectionById } from "@/features/git-providers/server/connections";
import { getOrgConnectionIds } from "@/features/organizations/server/org";
import {
  syncRepositoriesFromProvider,
  syncRepositoriesFromPullRequests,
} from "@/features/repositories/server/sync-repositories";

export async function getDashboardOverview(userId: string) {
  const { org, connectionIds } = await getOrgConnectionIds(userId);

  const [reviewCount, recentPrs, connections] = await Promise.all([
    prisma.pullRequest.count({
      where: {
        connectionId: { in: connectionIds },
        status: "reviewed",
      },
    }),
    prisma.pullRequest.findMany({
      where: { connectionId: { in: connectionIds } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        repoFullName: true,
        prNumber: true,
        provider: true,
        status: true,
        updatedAt: true,
      },
    }),
    prisma.providerConnection.findMany({
      where: { organizationId: org.id },
      select: {
        id: true,
        provider: true,
        accountLogin: true,
        createdAt: true,
      },
    }),
  ]);

  const pendingCount = await prisma.pullRequest.count({
    where: {
      connectionId: { in: connectionIds },
      status: { in: ["pending", "processing"] },
    },
  });

  return {
    reviewCount,
    pendingCount,
    connectionCount: connections.length,
    recentPrs,
    connections,
    organization: org,
  };
}

export async function getDashboardRepositories(userId: string) {
  const { org, connectionIds } = await getOrgConnectionIds(userId);

  const connections = await prisma.providerConnection.findMany({
    where: { organizationId: org.id },
    select: { id: true, provider: true },
  });

  for (const connection of connections) {
    const record = await getConnectionById(connection.id);
    if (!record) {
      continue;
    }
    try {
      await syncRepositoriesFromProvider(record);
    } catch {
      await syncRepositoriesFromPullRequests(connection.id);
    }
  }

  return prisma.repository.findMany({
    where: { connectionId: { in: connectionIds } },
    orderBy: { fullName: "asc" },
    include: {
      _count: { select: { pullRequests: true } },
    },
  });
}

export async function getDashboardPullRequests(
  userId: string,
  filters?: { status?: string; repo?: string }
) {
  const { connectionIds } = await getOrgConnectionIds(userId);

  return prisma.pullRequest.findMany({
    where: {
      connectionId: { in: connectionIds },
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.repo ? { repoFullName: filters.repo } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      repoFullName: true,
      prNumber: true,
      provider: true,
      status: true,
      authorLogin: true,
      headSha: true,
      reviewRunCount: true,
      reviewedAt: true,
      updatedAt: true,
      createdAt: true,
    },
  });
}

export async function getPullRequestDetail(userId: string, pullRequestId: string) {
  const { connectionIds } = await getOrgConnectionIds(userId);

  return prisma.pullRequest.findFirst({
    where: {
      id: pullRequestId,
      connectionId: { in: connectionIds },
    },
    include: {
      repository: {
        select: {
          id: true,
          enabled: true,
          config: true,
          configSha: true,
        },
      },
    },
  });
}

export async function toggleRepositoryEnabled(
  userId: string,
  repositoryId: string,
  enabled: boolean
) {
  const { connectionIds } = await getOrgConnectionIds(userId);

  const repo = await prisma.repository.findFirst({
    where: {
      id: repositoryId,
      connectionId: { in: connectionIds },
    },
  });

  if (!repo) {
    throw new Error("Repository not found");
  }

  return prisma.repository.update({
    where: { id: repositoryId },
    data: { enabled },
  });
}
