import { createHash, timingSafeEqual } from "node:crypto";

type AdminEnvironment = Record<string, string | undefined>;

function equalSecret(actual: string, expected: string): boolean {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(actual), digest(expected));
}

/** Fail closed. Desktop credentials are ephemeral and supplied by Electron only. */
export function authorizeAdmin(
  headers: Headers,
  env: AdminEnvironment = process.env,
): boolean {
  const desktopToken = env.GITCLAW_DESKTOP_TOKEN;
  if (env.GITCLAW_DESKTOP === "1" && desktopToken &&
      equalSecret(headers.get("x-gitclaw-desktop-token") ?? "", desktopToken)) {
    return true;
  }
  const password = env.GITCLAW_ADMIN_PASSWORD;
  if (!password || password.length < 16) return false;
  const auth = headers.get("authorization") ?? "";
  if (!/^Basic /i.test(auth)) return false;
  const credentials = Buffer.from(auth.slice(6), "base64").toString("utf8");
  return equalSecret(credentials, `admin:${password}`);
}

export function hasAdminCredentials(env: AdminEnvironment = process.env): boolean {
  return Boolean((env.GITCLAW_ADMIN_PASSWORD?.length ?? 0) >= 16 ||
    (env.GITCLAW_DESKTOP === "1" && env.GITCLAW_DESKTOP_TOKEN));
}

export function isProtectedPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/") ||
    pathname === "/api/desktop" || pathname.startsWith("/api/desktop/") ||
    pathname === "/api/dashboard" || pathname.startsWith("/api/dashboard/") ||
    /^\/api\/(github|gitlab|bitbucket)\/(callback|connect)\/?$/.test(pathname);
}

/** Browser credentials are ambient; mutations also require an explicit trusted origin. */
export function isTrustedAdminOrigin(request: Request, appUrl = process.env.APP_URL): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  const origin = request.headers.get("origin");
  if (!origin || origin === "null") return false;
  try {
    const trusted = new Set([new URL(request.url).origin]);
    if (appUrl) trusted.add(new URL(appUrl).origin);
    return trusted.has(origin);
  } catch {
    return false;
  }
}
