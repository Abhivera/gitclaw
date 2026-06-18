"use server";

import { getServerSession } from "@/features/auth/actions";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { deleteUserConnection } from "@/features/git-providers/server/connections";
import type { GitProvider } from "@/lib/generated/prisma/client";
import { redirect } from "next/navigation";

export async function disconnectProvider(formData: FormData) {
  const session = await getServerSession();
  const provider = formData.get("provider") as GitProvider | null;

  if (!session || !provider) {
    redirect("/sign-in");
  }

  await deleteUserConnection(session.user.id, provider);
  redirect(DASHBOARD_ROUTES.integrations);
}
