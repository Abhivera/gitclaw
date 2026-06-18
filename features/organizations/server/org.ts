import { prisma } from "@/lib/db";
import type { Organization } from "@/lib/generated/prisma/client";

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return slug || "workspace";
}

async function uniqueSlug(base: string) {
  let slug = slugify(base);
  let suffix = 0;

  while (await prisma.organization.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugify(base).slice(0, 44)}-${suffix}`;
  }

  return slug;
}

export async function getOrCreateDefaultOrg(userId: string): Promise<Organization> {
  const membership = await prisma.organizationMember.findFirst({
    where: { userId },
    include: { org: true },
    orderBy: { createdAt: "asc" },
  });

  if (membership) {
    return membership.org;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }

  const baseName = user.name?.trim() || user.email.split("@")[0];
  const slug = await uniqueSlug(baseName);

  return prisma.organization.create({
    data: {
      name: `${baseName}'s workspace`,
      slug,
      members: {
        create: {
          userId,
          role: "owner",
        },
      },
    },
  });
}

export async function getOrgConnectionIds(userId: string) {
  const org = await getOrCreateDefaultOrg(userId);
  const connections = await prisma.providerConnection.findMany({
    where: { organizationId: org.id },
    select: { id: true },
  });

  return {
    org,
    connectionIds: connections.map((connection) => connection.id),
  };
}

export async function requireOrgMembership(userId: string, orgId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      orgId_userId: { orgId, userId },
    },
    include: { org: true },
  });

  if (!membership) {
    throw new Error("Organization not found");
  }

  return membership;
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
