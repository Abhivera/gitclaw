import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import {
  isDesktopApp,
  isDesktopSetupComplete,
} from "@/features/setup/lib/desktop-setup";

const SETUP_PATHS = new Set<string>([
  DASHBOARD_ROUTES.setup,
  DASHBOARD_ROUTES.configuration,
]);

export function middleware(request: NextRequest) {
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
  matcher: ["/", "/dashboard", "/dashboard/:path*"],
};
