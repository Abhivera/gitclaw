import type { ProviderConnection } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { refreshBitbucketToken } from "../bitbucket/client";
import { refreshGitlabToken } from "../gitlab/client";

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

function isTokenExpired(expiresAt: Date | null | undefined) {
  if (!expiresAt) {
    return false;
  }

  return expiresAt.getTime() - TOKEN_EXPIRY_BUFFER_MS <= Date.now();
}

export async function ensureFreshToken(
  connection: ProviderConnection
): Promise<ProviderConnection> {
  if (connection.provider === "github") {
    return connection;
  }

  if (!isTokenExpired(connection.accessTokenExpiresAt)) {
    return connection;
  }

  if (!connection.refreshToken) {
    return connection;
  }

  if (connection.provider === "gitlab") {
    const tokens = await refreshGitlabToken(connection.refreshToken);

    return prisma.providerConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? connection.refreshToken,
        accessTokenExpiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
      },
    });
  }

  const tokens = await refreshBitbucketToken(connection.refreshToken);

  return prisma.providerConnection.update({
    where: { id: connection.id },
    data: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? connection.refreshToken,
      accessTokenExpiresAt: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null,
    },
  });
}
