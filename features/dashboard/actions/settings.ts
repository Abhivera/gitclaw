"use server";

import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { getOrCreateDefaultOrg } from "@/features/organizations/server/org";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateSlackWebhook(formData: FormData) {
  const webhookUrl = formData.get("slackWebhookUrl");

  if (typeof webhookUrl !== "string") {
    return;
  }

  const org = await getOrCreateDefaultOrg();
  const trimmed = webhookUrl.trim();

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      slackWebhookUrl: trimmed.length > 0 ? trimmed : null,
    },
  });

  revalidatePath(DASHBOARD_ROUTES.settings);
}
