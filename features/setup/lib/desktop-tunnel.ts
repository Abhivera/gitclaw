import { getEnvValue, parseAllowedDevOriginsList } from "@/lib/env-helpers";

const DEFAULT_DESKTOP_PORT = 13100;

export function getDesktopAppUrl(): string {
  return getEnvValue("APP_URL") ?? `http://127.0.0.1:${DEFAULT_DESKTOP_PORT}`;
}

export function getAllowedDevOrigins(): string[] {
  return parseAllowedDevOriginsList(getEnvValue("ALLOWED_DEV_ORIGINS"));
}

export function normalizeTunnelOrigin(origin: string): string {
  const trimmed = origin.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.replace(/\/$/, "");
  }

  return `https://${trimmed}`;
}

export function getDesktopTunnelBaseUrl(): string | null {
  const origins = getAllowedDevOrigins();
  if (origins.length === 0) {
    return null;
  }

  return normalizeTunnelOrigin(origins[0]);
}

export function getDesktopWebhookBaseUrl(): string {
  return getDesktopTunnelBaseUrl() ?? getDesktopAppUrl();
}

export function getDesktopLocalPort(): number {
  try {
    const url = new URL(getDesktopAppUrl());
    if (url.port) {
      return Number(url.port);
    }

    return url.protocol === "https:" ? 443 : 80;
  } catch {
    return DEFAULT_DESKTOP_PORT;
  }
}

export type DesktopTunnelStatus = {
  appUrl: string;
  localPort: number;
  allowedOrigins: string[];
  tunnelConfigured: boolean;
  tunnelBaseUrl: string | null;
  webhookBaseUrl: string;
  githubWebhookUrl: string;
};

export function getDesktopTunnelStatus(): DesktopTunnelStatus {
  const appUrl = getDesktopAppUrl();
  const allowedOrigins = getAllowedDevOrigins();
  const tunnelBaseUrl = getDesktopTunnelBaseUrl();
  const webhookBaseUrl = getDesktopWebhookBaseUrl();

  return {
    appUrl,
    localPort: getDesktopLocalPort(),
    allowedOrigins,
    tunnelConfigured: tunnelBaseUrl !== null,
    tunnelBaseUrl,
    webhookBaseUrl,
    githubWebhookUrl: `${webhookBaseUrl}/api/github/webhook`,
  };
}
