import type { GitProvider, Prisma } from "@/lib/generated/prisma/client";
import type { ProviderConnectionRecord, ProviderConnectionStatus } from "../types";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { randomBytes } from "crypto";
import { getOrCreateDefaultOrg } from "@/features/organizations/server/org";
import { ensureFreshToken } from "./ensure-fresh-token";
import { getProviderWebhookUrl } from "../utils/webhook-url";

function toConnectionRecord(
  connection: Awaited<ReturnType<typeof prisma.providerConnection.findFirst>>
): ProviderConnectionRecord | null {
  if (!connection) {
    return null;
  }

  return {
    id: connection.id,
    provider: connection.provider,
    externalId: connection.externalId,
    accessToken: connection.accessToken,
    refreshToken: connection.refreshToken,
    accessTokenExpiresAt: connection.accessTokenExpiresAt,
    accountLogin: connection.accountLogin,
    webhookSecret: connection.webhookSecret,
    metadata: connection.metadata,
  };
}

export async function getConnectionById(connectionId: string) {
  const connection = await prisma.providerConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) {
    return null;
  }

  const freshConnection = await ensureFreshToken(connection);
  return toConnectionRecord(freshConnection);
}

export async function getConnectionByExternalId(
  provider: GitProvider,
  externalId: string
) {
  const connection = await prisma.providerConnection.findUnique({
    where: {
      provider_externalId: { provider, externalId },
    },
  });

  if (!connection) {
    return null;
  }

  const freshConnection = await ensureFreshToken(connection);
  return toConnectionRecord(freshConnection);
}

async function getOrgConnection(organizationId: string, provider: GitProvider) {
  const connection = await prisma.providerConnection.findUnique({
    where: {
      organizationId_provider: { organizationId, provider },
    },
  });

  return connection;
}

export async function getUserConnection(userId: string, provider: GitProvider) {
  const org = await getOrCreateDefaultOrg(userId);
  return getOrgConnection(org.id, provider);
}

export async function getConnectionStatus(
  userId: string,
  provider: GitProvider,
  baseUrl?: string
): Promise<ProviderConnectionStatus> {
  const connection = await getUserConnection(userId, provider);

  if (!connection) {
    return {
      connected: false,
      accountLogin: null,
      installedAt: null,
      connectionId: null,
      webhookUrl: null,
      webhookSecret: null,
    };
  }

  const origin = baseUrl ?? env.BETTER_AUTH_URL;
  const webhookUrl =
    provider === "github"
      ? null
      : getProviderWebhookUrl(provider, connection.id, origin);

  return {
    connected: true,
    accountLogin: connection.accountLogin,
    installedAt: connection.createdAt.toISOString(),
    connectionId: connection.id,
    webhookUrl,
    webhookSecret: provider === "github" ? null : connection.webhookSecret,
  };
}

export async function saveGithubConnection(
  userId: string,
  installationId: number,
  accountLogin: string | null,
  accountType: string | null
) {
  const org = await getOrCreateDefaultOrg(userId);
  const externalId = String(installationId);

  await prisma.providerConnection.upsert({
    where: {
      organizationId_provider: { organizationId: org.id, provider: "github" },
    },
    create: {
      organizationId: org.id,
      provider: "github",
      externalId,
      accountLogin,
      accountType,
      webhookSecret: randomBytes(24).toString("hex"),
    },
    update: {
      externalId,
      accountLogin,
      accountType,
    },
  });
}

export async function saveOAuthConnection(input: {
  userId: string;
  provider: Extract<GitProvider, "gitlab" | "bitbucket">;
  externalId: string;
  accessToken: string;
  refreshToken?: string | null;
  accessTokenExpiresAt?: Date | null;
  accountLogin: string | null;
  accountType?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  const org = await getOrCreateDefaultOrg(input.userId);

  await prisma.providerConnection.upsert({
    where: {
      organizationId_provider: {
        organizationId: org.id,
        provider: input.provider,
      },
    },
    create: {
      organizationId: org.id,
      provider: input.provider,
      externalId: input.externalId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken ?? null,
      accessTokenExpiresAt: input.accessTokenExpiresAt ?? null,
      accountLogin: input.accountLogin,
      accountType: input.accountType ?? null,
      webhookSecret: randomBytes(24).toString("hex"),
      metadata: input.metadata ?? undefined,
    },
    update: {
      externalId: input.externalId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken ?? null,
      accessTokenExpiresAt: input.accessTokenExpiresAt ?? null,
      accountLogin: input.accountLogin,
      accountType: input.accountType ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}

export async function deleteUserConnection(
  userId: string,
  provider: GitProvider
) {
  const org = await getOrCreateDefaultOrg(userId);

  const connections = await prisma.providerConnection.findMany({
    where: { organizationId: org.id, provider },
    select: { id: true },
  });

  if (connections.length === 0) {
    return;
  }

  const connectionIds = connections.map((connection) => connection.id);

  // Pull requests reference connections without onDelete: Cascade, so remove
  // them first. Repositories cascade when the connection row is deleted.
  await prisma.$transaction([
    prisma.pullRequest.deleteMany({
      where: { connectionId: { in: connectionIds } },
    }),
    prisma.providerConnection.deleteMany({
      where: { id: { in: connectionIds } },
    }),
  ]);
}
