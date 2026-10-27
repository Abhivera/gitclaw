import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { saveInstallation } from "@/features/git-providers/github/installation";
import { validateOAuthState } from "@/features/git-providers/server/oauth-state";
import { ensureInstance } from "@/lib/instance";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const installationId = searchParams.get("installation_id");
  await ensureInstance();

  if (!(await validateOAuthState("github", searchParams.get("state")))) {
    redirect(DASHBOARD_ROUTES.integrations);
  }

  if (installationId) {
    await saveInstallation(Number(installationId));
  }

  redirect(DASHBOARD_ROUTES.integrations);
}
