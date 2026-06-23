import type { NextConfig } from "next";

function parseAllowedDevOrigins(): string[] | undefined {
  const raw = process.env.ALLOWED_DEV_ORIGINS;
  if (!raw) {
    return undefined;
  }

  const origins = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : undefined;
}

const allowedDevOrigins = parseAllowedDevOrigins();
const isDesktopBuild = process.env.DESKTOP_BUILD === "1";

const nextConfig: NextConfig = {
  ...(isDesktopBuild ? { output: "standalone" as const } : {}),
  typedRoutes: true,
  // pg-boss (and its pg driver) must run as a native Node dependency, not be
  // bundled by the server compiler.
  serverExternalPackages: ["pg-boss"],
  async redirects() {
    return [
      {
        source: "/dashboard/github",
        destination: "/dashboard/integrations",
        permanent: true,
      },
    ];
  },
  ...(allowedDevOrigins ? { allowedDevOrigins } : {}),
  experimental: {
    // Faster dev restarts — https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopackFileSystemCacheForDev
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
