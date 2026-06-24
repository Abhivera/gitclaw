import { getOrCreateDefaultOrg } from "@/features/organizations/server/org";
import { prisma } from "@/lib/db";

export async function getSettingsData() {
  const org = await getOrCreateDefaultOrg();

  const members = await prisma.organizationMember.findMany({
    where: { orgId: org.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    organization: org,
    members,
  };
}
