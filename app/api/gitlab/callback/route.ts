import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { getServerSession } from "@/features/auth/actions";
import { validateOAuthState } from "@/features/git-providers/lib/provider-config";
import { saveOAuthConnection } from "@/features/git-providers/server/connections";
import {
  exchangeGitlabCode,
  getGitlabUser,
} from "@/features/git-providers/gitlab/client";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const session = await getServerSession();

  if (!session) {
    redirect(
      `/sign-in?callbackUrl=${encodeURIComponent("/api/gitlab/callback?" + searchParams.toString())}` as Parameters<
        typeof redirect
      >[0]
    );
  }

  if (!code) {
    redirect(DASHBOARD_ROUTES.integrations);
  }

  if (!validateOAuthState(searchParams.get("state"), session.user.id)) {
    redirect(DASHBOARD_ROUTES.integrations);
  }

  const tokens = await exchangeGitlabCode(code);
  const user = await getGitlabUser(tokens.access_token);

  await saveOAuthConnection({
    userId: session.user.id,
    provider: "gitlab",
    externalId: String(user.id),
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    accessTokenExpiresAt: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null,
    accountLogin: user.username,
    accountType: "user",
    metadata: { name: user.name },
  });

  redirect(DASHBOARD_ROUTES.integrations);
}
