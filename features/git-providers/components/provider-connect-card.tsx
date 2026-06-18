import type { ReactNode } from "react";

import type { ProviderConnectionStatus } from "@/features/git-providers/types";
import {
  statusBadge,
  statusButtonClass,
} from "@/features/dashboard/lib/status-style";
import { disconnectProvider } from "@/features/git-providers/actions";
import type { GitProvider } from "@/lib/generated/prisma/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ProviderConnectCardProps = {
  provider: GitProvider;
  label: string;
  description: string;
  icon: ReactNode;
  installUrl: string | null;
  configured: boolean;
  setupHint?: string;
  connection: ProviderConnectionStatus;
  setupSteps?: string[];
};

function PlugsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden fill="currentColor">
      <path d="M116,36V20a12,12,0,0,1,24,0V36a12,12,0,0,1-24,0Zm80,32a12,12,0,0,0,8.49-3.51l8-8a12,12,0,0,0-17-17l-8,8A12,12,0,0,0,196,68ZM60,64.49a12,12,0,0,0,17,0l8-8a12,12,0,0,0-17-17l-8,8A12,12,0,0,0,60,64.49ZM232,116H216a12,12,0,0,0,0,24h16a12,12,0,0,0,0-24Zm-32,76.49a12,12,0,0,0-17,0l-8,8a12,12,0,0,0,17,17l8-8A12,12,0,0,0,200,192.49ZM72,180.49a12,12,0,0,0-17,0l-8,8a12,12,0,0,0,17,17l8-8A12,12,0,0,0,72,180.49ZM40,116H24a12,12,0,0,0,0,24H40a12,12,0,0,0,0-24ZM76,76a40,40,0,0,1,53.53,59.54l-1.08,1.07L116,149.22a40,40,0,1,1-56.57-56.57l1.07-1.08A39.85,39.85,0,0,1,76,76Zm24,88a16,16,0,1,0-16,16A16,16,0,0,0,100,164Zm88-16a40,40,0,0,1-53.53-59.54l1.08-1.07,12.45-12.61a40,40,0,1,1,56.57,56.57l-1.07,1.08A39.85,39.85,0,0,1,188,148Zm-24-88a16,16,0,1,0,16,16A16,16,0,0,0,164,60Z" />
    </svg>
  );
}

function ArrowSquareOutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden fill="currentColor">
      <path d="M224,104a12,12,0,0,1-12,12H184.49l-82.35,82.34a12,12,0,0,1-17-17L167.51,99H140a12,12,0,0,1,0-24h72A12,12,0,0,1,224,87Zm-84.49,9H140a12,12,0,0,0,0,24h31.51L88,216.49a12,12,0,0,0,17,17L188.49,133H220a12,12,0,0,0,0-24H192a12,12,0,0,0-8.49,3.51L139.51,113Z" />
    </svg>
  );
}

function WebhookSetup({
  webhookUrl,
  webhookSecret,
}: {
  webhookUrl: string | null;
  webhookSecret: string | null;
}) {
  if (!webhookUrl) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-none border border-border bg-muted/40 p-3 text-xs">
      <p className="font-medium text-foreground">Webhook setup</p>
      <p className="text-muted-foreground">
        Add a project or repository webhook pointing to this URL. Enable merge
        request / pull request events.
      </p>
      <div className="space-y-1">
        <p className="text-muted-foreground">Webhook URL</p>
        <code className="block break-all rounded-none bg-background px-2 py-1 text-[11px]">
          {webhookUrl}
        </code>
      </div>
      {webhookSecret ? (
        <div className="space-y-1">
          <p className="text-muted-foreground">Secret token</p>
          <code className="block break-all rounded-none bg-background px-2 py-1 text-[11px]">
            {webhookSecret}
          </code>
        </div>
      ) : null}
    </div>
  );
}

export function ProviderConnectCard({
  provider,
  label,
  description,
  icon,
  installUrl,
  configured,
  setupHint,
  connection,
  setupSteps = [],
}: ProviderConnectCardProps) {
  const { connected, accountLogin, webhookUrl, webhookSecret } = connection;

  let cardBorderClass = "border-border";
  let iconWrapperClass = "border-border bg-muted";
  let statusTone: "success" | "neutral" | "warning" = "neutral";
  let statusLabel = "Not connected";

  if (!configured) {
    statusTone = "warning";
    statusLabel = "Not configured";
  } else if (connected) {
    cardBorderClass = "border-green-500/30";
    iconWrapperClass =
      "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400";
    statusTone = "success";
    statusLabel = "Connected";
  }

  return (
    <Card className={cn("max-w-2xl transition-colors", cardBorderClass)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-none border",
                iconWrapperClass
              )}
            >
              {icon}
            </span>
            <div>
              <CardTitle>{label}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <span className={statusBadge(statusTone)}>{statusLabel}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!configured ? (
          <p className="text-xs text-muted-foreground">{setupHint}</p>
        ) : connected ? (
          <p className="text-xs text-muted-foreground">
            Connected as{" "}
            <span className="font-medium text-green-700 dark:text-green-400">
              @{accountLogin}
            </span>
            . Reviews run when webhooks are received for connected repositories.
          </p>
        ) : (
          <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
            {setupSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        )}
        <WebhookSetup
          webhookUrl={connected ? webhookUrl : null}
          webhookSecret={connected ? webhookSecret : null}
        />
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {connected ? (
          <form action={disconnectProvider}>
            <input type="hidden" name="provider" value={provider} />
            <Button
              type="submit"
              variant="outline"
              className={statusButtonClass.danger}
            >
              <PlugsIcon className="size-4" />
              Disconnect {label}
            </Button>
          </form>
        ) : configured && installUrl ? (
          <Button
            nativeButton={false}
            render={<a href={installUrl} />}
            className={statusButtonClass.success}
          >
            {icon}
            Connect {label}
            <ArrowSquareOutIcon className="size-3 opacity-80" />
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
