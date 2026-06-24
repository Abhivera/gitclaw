import type { GitProvider } from "../types";
import { env } from "@/lib/env";

export function getProviderWebhookUrl(
  provider: GitProvider,
  connectionId: string,
  baseUrl?: string
) {
  const origin = baseUrl ?? env.APP_URL;
  return `${origin}/api/${provider}/webhook/${connectionId}`;
}
