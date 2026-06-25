"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BRAND_ICON_MARK } from "@/lib/brand";
import { DOCS_ENV_VARS_URL } from "@/lib/links";
import type { DesktopSetupStatus } from "@/features/setup/lib/desktop-setup";
import {
  DesktopConfigActions,
  DesktopConfigPath,
} from "@/features/setup/components/desktop-config-actions";
import { DesktopWebhookAssistant } from "@/features/setup/components/desktop-webhook-assistant";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, CircleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { cn } from "@/lib/utils";

type DesktopSetupProps = {
  status: DesktopSetupStatus;
};

function StepIcon({ complete }: { complete: boolean }) {
  if (complete) {
    return <CheckCircleIcon className="size-5 shrink-0 text-green-600 dark:text-green-400" weight="fill" />;
  }

  return <CircleIcon className="size-5 shrink-0 text-muted-foreground" />;
}

function SetupStep({
  complete,
  title,
  description,
  children,
  showActions = false,
}: {
  complete: boolean;
  title: string;
  description: string;
  children?: React.ReactNode;
  showActions?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border p-5",
        complete ? "border-green-500/30 bg-green-500/5" : "border-border bg-card",
      )}
    >
      <div className="flex gap-3">
        <StepIcon complete={complete} />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
          {children}
          {showActions && !complete ? <DesktopConfigActions compact /> : null}
        </div>
      </div>
    </section>
  );
}

export function DesktopSetup({ status }: DesktopSetupProps) {
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    void window.gitclawDesktop?.getFirstRunComplete().then((complete) => {
      if (complete) {
        setShowWelcome(false);
      }
    });
  }, []);

  const dismissWelcome = () => {
    setShowWelcome(false);
    void window.gitclawDesktop?.markFirstRunComplete();
  };

  const requiredStepsComplete = [status.ai.complete, status.gitProvider.complete].filter(Boolean)
    .length;
  const webhookStepComplete = status.webhooks.complete;

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-10">
        <header className="space-y-4 text-center">
          <div className="flex justify-center">
            <Image src={BRAND_ICON_MARK} alt="GitClaw" width={48} height={48} priority />
          </div>
          <div className="space-y-2">
            {showWelcome ? (
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Welcome to GitClaw
              </p>
            ) : null}
            <h1 className="text-2xl font-semibold tracking-tight">
              {showWelcome ? "Set up your reviewer" : "Finish setup"}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Add an AI provider and at least one git host, then restart the app. Use the
              configuration form or edit the file directly — database and local URLs are managed
              for you.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {requiredStepsComplete} of 2 required steps complete
            {webhookStepComplete ? " · tunnel configured" : " · step 3 recommended for webhooks"}
          </p>
        </header>

        <div className="space-y-4">
          <SetupStep
            complete={status.ai.complete}
            title="1. AI provider"
            description="Choose OpenRouter, Groq, or a local OpenAI-compatible endpoint (Ollama). Add the matching API key or base URL to your configuration file."
            showActions
          >
            <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
              <li>
                OpenRouter — set <code className="text-foreground">OPENROUTER_API_KEY</code>
              </li>
              <li>
                Groq — set <code className="text-foreground">GROQ_API_KEY</code>
              </li>
              <li>
                Ollama / local — set <code className="text-foreground">OPENAI_BASE_URL</code> (e.g.{" "}
                <code className="text-foreground">http://localhost:11434/v1</code>)
              </li>
            </ul>
          </SetupStep>

          <SetupStep
            complete={status.gitProvider.complete}
            title="2. Git provider"
            description="Configure at least one provider. GitHub is the most common starting point."
            showActions
          >
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className={status.gitProvider.github ? "text-green-700 dark:text-green-400" : undefined}>
                GitHub — <code className="text-foreground">GITHUB_APP_SLUG</code>,{" "}
                <code className="text-foreground">GITHUB_APP_ID</code>,{" "}
                <code className="text-foreground">GITHUB_APP_PRIVATE_KEY</code>,{" "}
                <code className="text-foreground">GITHUB_WEBHOOK_SECRET</code>
              </li>
              <li className={status.gitProvider.gitlab ? "text-green-700 dark:text-green-400" : undefined}>
                GitLab — <code className="text-foreground">GITLAB_CLIENT_ID</code> and{" "}
                <code className="text-foreground">GITLAB_CLIENT_SECRET</code>
              </li>
              <li
                className={status.gitProvider.bitbucket ? "text-green-700 dark:text-green-400" : undefined}
              >
                Bitbucket — <code className="text-foreground">BITBUCKET_CLIENT_ID</code> and{" "}
                <code className="text-foreground">BITBUCKET_CLIENT_SECRET</code>
              </li>
            </ul>
          </SetupStep>

          <SetupStep
            complete={status.webhooks.complete}
            title="3. Webhooks and tunnel"
            description="Your PC runs GitClaw locally — git hosts need a public URL to send pull request events."
          >
            {status.webhooks.tunnel ? (
              <DesktopWebhookAssistant status={status.webhooks.tunnel} variant="setup" />
            ) : (
              <DesktopConfigActions compact />
            )}
          </SetupStep>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-5">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Configuration</h2>
            <p className="text-sm text-muted-foreground">
              Use the in-app form for guided setup, or edit the file below. GitClaw reloads
              configuration automatically when you save.
            </p>
            <Button render={<Link href={DASHBOARD_ROUTES.configuration} />} nativeButton={false}>
              Open configuration form
            </Button>
            <DesktopConfigPath />
          </div>
          <DesktopConfigActions />
        </div>

        <footer className="flex flex-col items-center gap-3 border-t border-border pt-6 text-center">
          {status.isComplete ? (
            <>
              <p className="text-sm text-muted-foreground">
                AI and git provider keys are set. Open Integrations to connect your repositories.
              </p>
              <Button
                render={<Link href={DASHBOARD_ROUTES.integrations} onClick={dismissWelcome} />}
                nativeButton={false}
              >
                Go to Integrations
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete steps 1 and 2, then save your configuration.{" "}
              <a
                href={DOCS_ENV_VARS_URL}
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline underline-offset-2"
              >
                Read the docs
              </a>
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}
