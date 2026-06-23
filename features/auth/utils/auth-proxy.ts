import { auth } from "@/lib/auth";
import { isCoreEnvConfigured } from "@/lib/env";
import { getSafeCallbackPath, SIGN_IN_PATH } from "./index";
import { NextRequest, NextResponse } from "next/server";

function redirectToSignIn(request: NextRequest, pathname: string) {
  const signInUrl = new URL(SIGN_IN_PATH, request.url);
  // Include query string so filters/search params survive the round-trip through sign-in.
  signInUrl.searchParams.set(
    "callbackUrl",
    `${pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(signInUrl);
}

function getPostAuthRedirectPath(request: NextRequest): string {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
  return getSafeCallbackPath(callbackUrl);
}

// "/sign-in": logged-in users redirect away; guests process
export async function handleAuthProxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isCoreEnvConfigured()) {
    if (pathname === SIGN_IN_PATH) {
      return NextResponse.next();
    }
    return redirectToSignIn(request, pathname);
  }

  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;

  try {
    session = await auth.api.getSession({
      headers: request.headers,
    });
  } catch (error) {
    console.error("[gitclaw] auth proxy session check failed", error);
  }

  if (pathname === SIGN_IN_PATH) {
    if (session) {
      const redirectPath = getPostAuthRedirectPath(request);
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    return NextResponse.next();
  }

  if (!session) {
    return redirectToSignIn(request, pathname);
  }

  return NextResponse.next();
}
