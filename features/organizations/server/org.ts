import { prisma } from "@/lib/db";
import { INSTANCE_USER_ID } from "@/lib/instance";
import type { Organization } from "@/lib/generated/prisma/client";

const DEFAULT_ORG_SLUG = "workspace";

export async function getOrCreateDefaultOrg(): Promise<Organization> {
  // Upserts keyed on unique constraints so concurrent callers (dashboard
  // layout, workers, webhooks) never race into a P2002 on a fresh database.
  const org = await prisma.organization.upsert({
    where: { slug: DEFAULT_ORG_SLUG },
    create: {
      name: "GitClaw workspace",
      slug: DEFAULT_ORG_SLUG,
    },
    update: {},
  });

  await prisma.organizationMember.upsert({
    where: {
      orgId_userId: { orgId: org.id, userId: INSTANCE_USER_ID },
    },
    create: {
      orgId: org.id,
      userId: INSTANCE_USER_ID,
      role: "owner",
    },
    update: {},
  });

  return org;
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
