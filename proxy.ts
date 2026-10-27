import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeAdmin, hasAdminCredentials, isProtectedPath, isTrustedAdminOrigin } from "@/lib/admin-auth";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import {
  isDesktopApp,
  isDesktopSetupComplete,
} from "@/features/setup/lib/desktop-setup";

const SETUP_PATHS = new Set<string>([
  DASHBOARD_ROUTES.setup,
  DASHBOARD_ROUTES.configuration,
]);

export function proxy(request: NextRequest) {
  if (isProtectedPath(request.nextUrl.pathname)) {
    if (!hasAdminCredentials()) {
      return new NextResponse("Set GITCLAW_ADMIN_PASSWORD to at least 16 characters to enable administration.", {
        status: 503, headers: { "Cache-Control": "no-store" },
      });
    }
    if (!authorizeAdmin(request.headers)) {
      return new NextResponse("Administrator authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="GitClaw administration", charset="UTF-8"', "Cache-Control": "no-store" },
      });
    }
    if (!isTrustedAdminOrigin(request)) {
      return new NextResponse("Untrusted request origin", { status: 403 });
    }
  }
  if (!isDesktopApp() || isDesktopSetupComplete()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (SETUP_PATHS.has(pathname) || pathname.startsWith(`${DASHBOARD_ROUTES.setup}/`)) {
    return NextResponse.next();
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    const url = request.nextUrl.clone();
    url.pathname = DASHBOARD_ROUTES.setup;
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = DASHBOARD_ROUTES.setup;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/api/:path*"],
};
