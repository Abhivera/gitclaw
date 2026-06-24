import { prisma } from "@/lib/db";
import { INSTANCE_USER_ID } from "@/lib/instance";
import type { Organization } from "@/lib/generated/prisma/client";

const DEFAULT_ORG_SLUG = "workspace";

export async function getOrCreateDefaultOrg(): Promise<Organization> {
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: INSTANCE_USER_ID },
    include: { org: true },
    orderBy: { createdAt: "asc" },
  });

  if (membership) {
    return membership.org;
  }

  return prisma.organization.create({
    data: {
      name: "GitClaw workspace",
      slug: DEFAULT_ORG_SLUG,
      members: {
        create: {
          userId: INSTANCE_USER_ID,
          role: "owner",
        },
      },
    },
  });
}

export async function getOrgConnectionIds() {
  const org = await getOrCreateDefaultOrg();
  const connections = await prisma.providerConnection.findMany({
    where: { organizationId: org.id },
    select: { id: true },
  });

  return {
    org,
    connectionIds: connections.map((connection) => connection.id),
  };
}

export async function getOrganizationForConnection(connectionId: string) {
  const connection = await prisma.providerConnection.findUnique({
    where: { id: connectionId },
    select: {
      organization: true,
    },
  });

  return connection?.organization ?? null;
}
