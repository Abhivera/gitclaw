import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { saveInstallation } from "@/features/git-providers/github/installation";
import { validateOAuthState } from "@/features/git-providers/lib/provider-config";
import { getServerSession } from "@/features/auth/actions";
import { redirect } from "next/navigation";

function buildSignInCallbackUrl(searchParams: URLSearchParams): string {
  const query = searchParams.toString();
  if (query) {
    return `/api/github/callback?${query}`;
  }

  return DASHBOARD_ROUTES.integrations;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const installationId = searchParams.get("installation_id");
  const session = await getServerSession();

  if (!session) {
    const callbackUrl = buildSignInCallbackUrl(searchParams);
    redirect(
      `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}` as Parameters<
        typeof redirect
      >[0]
    );
  }

  if (!validateOAuthState(searchParams.get("state"), session.user.id)) {
    redirect(DASHBOARD_ROUTES.integrations);
  }

  if (installationId) {
    await saveInstallation(session.user.id, Number(installationId));
  }

  redirect(DASHBOARD_ROUTES.integrations);
}
