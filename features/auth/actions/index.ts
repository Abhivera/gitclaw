"use server";

import { auth } from "@/lib/auth";
import { formatEnvSetupMessage, getEnvIssues, isCoreEnvConfigured } from "@/lib/env";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_AUTH_CALLBACK, getSafeCallbackPath, SIGN_IN_PATH } from "../utils";

export async function signInWithGithub(formData: FormData) {
  if (!isCoreEnvConfigured()) {
    throw new Error(formatEnvSetupMessage(getEnvIssues()));
  }

  const callback = formData.get("callbackUrl");

  const redirectTo = getSafeCallbackPath(
    typeof callback === "string" ? callback : null,
  );
  const result = await auth.api.signInSocial({
    body: {
      provider: "github",
      callbackURL: redirectTo,
    },
    headers: await headers(),
  });

  if (result.url) {
    // result.url is an external OAuth provider URL, not an app route, so it
    // does not match the typedRoutes route union.
    redirect(result.url as Parameters<typeof redirect>[0]);
  }
}

export async function getServerSession() {
  if (!isCoreEnvConfigured()) {
    return null;
  }

  try {
    return await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    console.error("[gitclaw] failed to read session", error);
    return null;
  }
}

export async function requireAuth(redirectTo = SIGN_IN_PATH) {
  const session = await getServerSession();

  if (!session) {
    redirect(redirectTo as Parameters<typeof redirect>[0]);
  }

  return session;
}

export async function requireUnauth(redirectTo = DEFAULT_AUTH_CALLBACK) {
  const session = await getServerSession();

  if (session) {
    redirect(redirectTo as Parameters<typeof redirect>[0]);
  }
}
