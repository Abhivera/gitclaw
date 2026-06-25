"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { DesktopConfigActions } from "@/features/setup/components/desktop-config-actions";
import { WebhookUrlRow } from "@/features/setup/components/webhook-url-row";
import type { DesktopTunnelStatus } from "@/features/setup/lib/desktop-tunnel";
import { cn } from "@/lib/utils";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";

const NGROK_URL = "https://ngrok.com/download";
const CLOUDFLARED_URL = "https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/";

type DesktopWebhookAssistantProps = {
  status: DesktopTunnelStatus;
  variant?: "setup" | "banner";
};

function TunnelStatusBadge({ configured }: { configured: boolean }) {
  if (configured) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-800 dark:text-green-300">
        <CheckCircleIcon className="size-3.5" weight="fill" />
        Tunnel configured
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-900 dark:text-amber-200">
      <WarningCircleIcon className="size-3.5" weight="fill" />
      Tunnel not configured
    </span>
  );
}

function TunnelSteps({ localPort }: { localPort: number }) {
  return (
    <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
      <li>
        Install{" "}
        <a
          href={NGROK_URL}
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline underline-offset-2"
        >
          ngrok
        </a>{" "}
        or{" "}
        <a
          href={CLOUDFLARED_URL}
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline underline-offset-2"
        >
          cloudflared
        </a>
        .
      </li>
      <li>
        Start a tunnel to your local GitClaw port ({localPort}):
        <div className="mt-2 space-y-1">
          <code className="block rounded-md bg-muted px-2 py-1 text-xs text-foreground">
            ngrok http {localPort}
          </code>
          <code className="block rounded-md bg-muted px-2 py-1 text-xs text-foreground">
            cloudflared tunnel --url http://127.0.0.1:{localPort}
          </code>
        </div>
      </li>
      <li>
        Copy the public hostname (e.g.{" "}
        <code className="text-foreground">abc123.ngrok-free.app</code>) into{" "}
        <code className="text-foreground">ALLOWED_DEV_ORIGINS</code> in{" "}
        <Link
          href={DASHBOARD_ROUTES.configuration}
          className="text-foreground underline underline-offset-2"
        >
          Settings → Configuration
        </Link>
        .
      </li>
      <li>Save the tunnel hostname — GitClaw reloads configuration automatically.</li>
    </ol>
  );
}

export function DesktopWebhookAssistant({
  status,
  variant = "setup",
}: DesktopWebhookAssistantProps) {
  const isBanner = variant === "banner";

  return (
    <div
      className={cn(
        "space-y-4",
        isBanner && !status.tunnelConfigured
          ? "rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-4"
          : undefined,
      )}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {isBanner ? (
            <h2
              className={cn(
                "text-sm font-semibold",
                status.tunnelConfigured
                  ? "text-green-900 dark:text-green-100"
                  : "text-amber-950 dark:text-amber-50",
              )}
            >
              {status.tunnelConfigured ? "Webhook tunnel ready" : "Webhooks need a public URL"}
            </h2>
          ) : null}
          <TunnelStatusBadge configured={status.tunnelConfigured} />
        </div>
        <p
          className={cn(
            "text-sm leading-relaxed",
            isBanner && !status.tunnelConfigured
              ? "text-amber-900/85 dark:text-amber-100/85"
              : "text-muted-foreground",
          )}
        >
          GitClaw runs on your PC. GitHub, GitLab, and Bitbucket must reach a public URL to
          deliver pull request events — use a tunnel while developing locally.
        </p>
      </div>

      <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-xs font-medium text-foreground">Local app URL</p>
        <code className="block break-all text-xs text-muted-foreground">{status.appUrl}</code>
        <p className="text-xs text-muted-foreground">
          This address only works on your machine. Git hosts cannot use it for webhooks.
        </p>
      </div>

      {status.tunnelConfigured && status.tunnelBaseUrl ? (
        <div className="space-y-3 rounded-lg border border-green-500/30 bg-green-500/5 p-3">
          <p className="text-xs font-medium text-green-800 dark:text-green-300">
            Public webhook base
          </p>
          <code className="block break-all text-xs text-foreground">{status.tunnelBaseUrl}</code>
          <WebhookUrlRow label="GitHub App webhook URL" url={status.githubWebhookUrl} />
          <p className="text-xs text-muted-foreground">
            Set this URL in your GitHub App settings. GitLab and Bitbucket webhook URLs appear on
            each card after you connect.
          </p>
        </div>
      ) : (
        <TunnelSteps localPort={status.localPort} />
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          render={<Link href={DASHBOARD_ROUTES.configuration} />}
          nativeButton={false}
          size="sm"
          variant={isBanner ? "outline" : "default"}
        >
          Open configuration
        </Button>
        <DesktopConfigActions compact />
      </div>
    </div>
  );
}
