"use server";

import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { deleteProviderConnection } from "@/features/git-providers/server/connections";
import type { GitProvider } from "@/lib/generated/prisma/client";
import { redirect } from "next/navigation";

export async function disconnectProvider(formData: FormData) {
  const provider = formData.get("provider") as GitProvider | null;

  if (!provider) {
    redirect(DASHBOARD_ROUTES.integrations);
  }

  await deleteProviderConnection(provider);
  redirect(DASHBOARD_ROUTES.integrations);
}
