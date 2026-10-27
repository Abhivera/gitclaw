"use server";

import { requireAdmin } from "@/lib/require-admin";

import { enqueue, QUEUES } from "@/features/jobs/queue";
import { getOrgConnectionIds } from "@/features/organizations/server/org";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { DASHBOARD_ROUTES } from "../lib/routes";
import { toggleRepositoryEnabled } from "../server/queries";

export async function toggleRepoEnabled(formData: FormData) {
  await requireAdmin();
  const repositoryId = formData.get("repositoryId");
  const enabled = formData.get("enabled") === "true";

  if (typeof repositoryId !== "string") {
    return;
  }

  await toggleRepositoryEnabled(repositoryId, enabled);
  revalidatePath(DASHBOARD_ROUTES.repos);
}

export async function rerunReview(formData: FormData) {
  await requireAdmin();
  const pullRequestId = formData.get("pullRequestId");

  if (typeof pullRequestId !== "string") {
    return;
  }

  const { connectionIds } = await getOrgConnectionIds();

  const pullRequest = await prisma.pullRequest.findFirst({
    where: {
      id: pullRequestId,
      connectionId: { in: connectionIds },
    },
  });

  if (!pullRequest) {
    return;
  }

  await prisma.pullRequest.update({
    where: { id: pullRequestId },
    data: { status: "pending", skipReason: null },
  });

  await enqueue(QUEUES.prReceived, { pullRequestId });

  revalidatePath(`${DASHBOARD_ROUTES.pullRequest}/${pullRequestId}`);
  revalidatePath(DASHBOARD_ROUTES.pullRequest);
}
