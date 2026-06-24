import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { validateOAuthState } from "@/features/git-providers/lib/provider-config";
import { saveOAuthConnection } from "@/features/git-providers/server/connections";
import {
  exchangeGitlabCode,
  getGitlabUser,
} from "@/features/git-providers/gitlab/client";
import { ensureInstance } from "@/lib/instance";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  await ensureInstance();

  if (!code) {
    redirect(DASHBOARD_ROUTES.integrations);
  }

  if (!validateOAuthState(searchParams.get("state"))) {
    redirect(DASHBOARD_ROUTES.integrations);
  }

  const tokens = await exchangeGitlabCode(code);
  const user = await getGitlabUser(tokens.access_token);

  await saveOAuthConnection({
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
