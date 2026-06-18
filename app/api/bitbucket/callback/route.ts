import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { getServerSession } from "@/features/auth/actions";
import { validateOAuthState } from "@/features/git-providers/lib/provider-config";
import { saveOAuthConnection } from "@/features/git-providers/server/connections";
import {
  exchangeBitbucketCode,
  getBitbucketUser,
} from "@/features/git-providers/bitbucket/client";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const session = await getServerSession();

  if (!session) {
    redirect(
      `/sign-in?callbackUrl=${encodeURIComponent("/api/bitbucket/callback?" + searchParams.toString())}` as Parameters<
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

  const tokens = await exchangeBitbucketCode(code);
  const user = await getBitbucketUser(tokens.access_token);

  await saveOAuthConnection({
    userId: session.user.id,
    provider: "bitbucket",
    externalId: user.uuid,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    accessTokenExpiresAt: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null,
    accountLogin: user.username,
    accountType: "user",
    metadata: { displayName: user.display_name },
  });

  redirect(DASHBOARD_ROUTES.integrations);
}
