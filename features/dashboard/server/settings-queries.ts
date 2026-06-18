import { getOrCreateDefaultOrg } from "@/features/organizations/server/org";
import { prisma } from "@/lib/db";

export async function getSettingsData(userId: string) {
  const org = await getOrCreateDefaultOrg(userId);

  const members = await prisma.organizationMember.findMany({
    where: { orgId: org.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
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
