import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { validateOAuthState } from "@/features/git-providers/lib/provider-config";
import { saveOAuthConnection } from "@/features/git-providers/server/connections";
import {
  exchangeBitbucketCode,
  getBitbucketUser,
} from "@/features/git-providers/bitbucket/client";
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

  const tokens = await exchangeBitbucketCode(code);
  const user = await getBitbucketUser(tokens.access_token);

  await saveOAuthConnection({
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
