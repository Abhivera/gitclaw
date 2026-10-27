import { getGithubInstallUrl } from "@/features/git-providers/github/adapter";
import { getGitlabOAuthUrl } from "@/features/git-providers/gitlab/client";
import { getBitbucketOAuthUrl } from "@/features/git-providers/bitbucket/client";
import { createOAuthState } from "@/features/git-providers/server/oauth-state";
import { requireAdmin } from "@/lib/require-admin";
import { NextResponse } from "next/server";

export async function GET(_request: Request, context: { params: Promise<{ provider: string }> }) {
  await requireAdmin();
  const { provider } = await context.params;
  if (!["github", "gitlab", "bitbucket"].includes(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }
  const state = await createOAuthState(provider);
  const url = provider === "github" ? getGithubInstallUrl(state)
    : provider === "gitlab" ? getGitlabOAuthUrl(state) : getBitbucketOAuthUrl(state);
  return NextResponse.redirect(url);
}
