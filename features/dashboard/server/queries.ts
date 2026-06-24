import { prisma } from "@/lib/db";
import { getConnectionById } from "@/features/git-providers/server/connections";
import { getOrgConnectionIds } from "@/features/organizations/server/org";
import {
  syncRepositoriesFromProvider,
  syncRepositoriesFromPullRequests,
} from "@/features/repositories/server/sync-repositories";
import {
  DASHBOARD_PAGE_SIZE,
  getPaginationMeta,
} from "@/features/dashboard/lib/pagination";

export async function getDashboardOverview() {
  const { org, connectionIds } = await getOrgConnectionIds();

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

export async function getDashboardRepositories(page = 1) {
  const { org, connectionIds } = await getOrgConnectionIds();

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

  const where = { connectionId: { in: connectionIds } };
  const total = await prisma.repository.count({ where });
  const { skip, totalPages, page: safePage } = getPaginationMeta(total, page);

  const items = await prisma.repository.findMany({
    where,
    orderBy: { fullName: "asc" },
    skip,
    take: DASHBOARD_PAGE_SIZE,
    include: {
      _count: { select: { pullRequests: true } },
    },
  });

  return {
    items,
    total,
    page: safePage,
    pageSize: DASHBOARD_PAGE_SIZE,
    totalPages,
  };
}

export async function getDashboardPullRequests(
  filters?: { status?: string; repo?: string; page?: number }
) {
  const { connectionIds } = await getOrgConnectionIds();
  const where = {
    connectionId: { in: connectionIds },
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.repo ? { repoFullName: filters.repo } : {}),
  };

  const total = await prisma.pullRequest.count({ where });
  const { skip, totalPages, page } = getPaginationMeta(
    total,
    filters?.page ?? 1
  );

  const items = await prisma.pullRequest.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip,
    take: DASHBOARD_PAGE_SIZE,
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

  return {
    items,
    total,
    page,
    pageSize: DASHBOARD_PAGE_SIZE,
    totalPages,
  };
}

export async function getPullRequestRepoOptions() {
  const { connectionIds } = await getOrgConnectionIds();

  const repos = await prisma.pullRequest.findMany({
    where: { connectionId: { in: connectionIds } },
    select: { repoFullName: true },
    distinct: ["repoFullName"],
    orderBy: { repoFullName: "asc" },
  });

  return repos.map((repo) => repo.repoFullName);
}

export async function getPullRequestStatus(pullRequestId: string) {
  const { connectionIds } = await getOrgConnectionIds();

  return prisma.pullRequest.findFirst({
    where: {
      id: pullRequestId,
      connectionId: { in: connectionIds },
    },
    select: {
      status: true,
      reviewRunCount: true,
      reviewedAt: true,
    },
  });
}

export async function getPullRequestDetail(pullRequestId: string) {
  const { connectionIds } = await getOrgConnectionIds();

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
  repositoryId: string,
  enabled: boolean
) {
  const { connectionIds } = await getOrgConnectionIds();

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
