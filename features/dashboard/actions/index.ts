"use server";

import { getServerSession } from "@/features/auth/actions";
import { enqueue, QUEUES } from "@/features/jobs/queue";
import { getOrgConnectionIds } from "@/features/organizations/server/org";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { DASHBOARD_ROUTES } from "../lib/routes";
import { toggleRepositoryEnabled } from "../server/queries";

export async function toggleRepoEnabled(formData: FormData) {
  const session = await getServerSession();
  if (!session) {
    return;
  }

  const repositoryId = formData.get("repositoryId");
  const enabled = formData.get("enabled") === "true";

  if (typeof repositoryId !== "string") {
    return;
  }

  await toggleRepositoryEnabled(session.user.id, repositoryId, enabled);
  revalidatePath(DASHBOARD_ROUTES.repos);
}

export async function rerunReview(formData: FormData) {
  const session = await getServerSession();
  if (!session) {
    return;
  }

  const pullRequestId = formData.get("pullRequestId");
  if (typeof pullRequestId !== "string") {
    return;
  }

  const { connectionIds } = await getOrgConnectionIds(session.user.id);

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
