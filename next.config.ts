import type { NextConfig } from "next";
import { parseAllowedDevOriginsList } from "./lib/env-helpers";

const allowedDevOrigins = parseAllowedDevOriginsList(process.env.ALLOWED_DEV_ORIGINS);
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
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
  experimental: {
    // Faster dev restarts — https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopackFileSystemCacheForDev
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
