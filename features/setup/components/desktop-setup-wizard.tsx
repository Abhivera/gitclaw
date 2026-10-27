"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldSet } from "@/components/ui/field";
import { ConfigField } from "@/features/setup/components/desktop-config-field";
import {
  DesktopConfigActions,
  DesktopConfigPath,
} from "@/features/setup/components/desktop-config-actions";
import { DesktopWebhookAssistant } from "@/features/setup/components/desktop-webhook-assistant";
import { ProviderPicker } from "@/features/setup/components/desktop-provider-picker";
import { useDesktopConfig } from "@/features/setup/hooks/use-desktop-config";
import {
  AI_PROVIDER_CARDS,
  GIT_PROVIDER_CARDS,
  TUNNEL_FIELDS,
  detectAiProvider,
  detectGitProvider,
  getFieldsForAiProvider,
  getFieldsForGitProvider,
  pickValuesForKeys,
  validateAiStep,
  validateGitStep,
  type AiProviderId,
  type GitProviderId,
} from "@/features/setup/lib/desktop-config-fields";
import type { DesktopSetupStatus } from "@/features/setup/lib/desktop-setup";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { cn } from "@/lib/utils";
import { CaretDownIcon, CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";

type WizardStep = "ai" | "git" | "tunnel" | "done";

const STEP_ORDER: WizardStep[] = ["ai", "git", "tunnel", "done"];

const STEP_LABELS: Record<Exclude<WizardStep, "done">, string> = {
  ai: "AI provider",
  git: "Git provider",
  tunnel: "Webhooks",
};

function getInitialStep(status: DesktopSetupStatus): WizardStep {
  if (!status.ai.complete) {
    return "ai";
  }
  return "done";
}

function stepIndex(step: WizardStep): number {
  if (step === "done") {
    return STEP_ORDER.length;
  }
  return STEP_ORDER.indexOf(step) + 1;
}

function WizardProgress({ currentStep }: { currentStep: WizardStep }) {
  const steps: Array<Exclude<WizardStep, "done">> = ["ai", "git", "tunnel"];
  const currentIndex = currentStep === "done" ? steps.length : steps.indexOf(currentStep);

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">
        Step {Math.min(currentIndex + 1, 3)} of 3
      </p>
      <div className="flex gap-2">
        {steps.map((step, index) => (
          <div
            key={step}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              index <= currentIndex ? "bg-primary" : "bg-muted",
            )}
            aria-hidden
          />
        ))}
      </div>
      <p className="text-sm font-medium">
        {currentStep === "done" ? "Setup complete" : STEP_LABELS[currentStep]}
      </p>
    </div>
  );
}

function AdvancedFileActions() {
  return (
    <details className="group rounded-lg border border-border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span>Edit configuration file directly</span>
        <CaretDownIcon className="size-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-border px-4 py-4">
        <DesktopConfigActions compact />
        <DesktopConfigPath />
      </div>
    </details>
  );
}

type DesktopSetupWizardProps = {
  status: DesktopSetupStatus;
  onDismissWelcome?: () => void;
};

export function DesktopSetupWizard({ status, onDismissWelcome }: DesktopSetupWizardProps) {
  const router = useRouter();
  const config = useDesktopConfig();
  const [aiProviderOverride, setAiProviderOverride] = useState<AiProviderId | null>(null);
  const [gitProviderOverride, setGitProviderOverride] = useState<GitProviderId | null>(null);

  const aiProvider =
    aiProviderOverride ?? detectAiProvider(config.values, config.secretsSet);
  const gitProvider =
    gitProviderOverride ??
    detectGitProvider(config.values, config.secretsSet, {
      github: status.gitProvider.github,
      gitlab: status.gitProvider.gitlab,
      bitbucket: status.gitProvider.bitbucket,
    });
  const [currentStep, setCurrentStep] = useState<WizardStep>(() => getInitialStep(status));
  const [applying, setApplying] = useState(false);

  const aiFields = useMemo(() => getFieldsForAiProvider(aiProvider), [aiProvider]);
  const gitFields = useMemo(() => getFieldsForGitProvider(gitProvider), [gitProvider]);

  const gitConfigured = useMemo(
    () => ({
      github: status.gitProvider.github,
      gitlab: status.gitProvider.gitlab,
      bitbucket: status.gitProvider.bitbucket,
    }),
    [status.gitProvider],
  );

  const handleSaveAndContinue = async () => {
    config.clearSaveState();

    if (currentStep === "ai") {
      const clientIssues = validateAiStep(aiProvider, config.values, config.secretsSet);
      if (Object.keys(clientIssues).length > 0) {
        config.setClientIssues(clientIssues);
        return;
      }

      const keys = aiFields.map((field) => field.key);
      const result = await config.saveConfig({
        ...pickValuesForKeys(config.values, keys),
        AI_PROVIDER: aiProvider === "ollama" ? "openai-compatible" : aiProvider,
      });
      if (!result.success) {
        return;
      }

      setApplying(true);
      router.refresh();
      await new Promise((resolve) => setTimeout(resolve, 500));
      setApplying(false);
      setCurrentStep("done");
      return;
    }

    if (currentStep === "git") {
      const clientIssues = validateGitStep(gitProvider, config.values, config.secretsSet);
      if (Object.keys(clientIssues).length > 0) {
        config.setClientIssues(clientIssues);
        return;
      }

      const keys = gitFields.map((field) => field.key);
      const result = await config.saveConfig(pickValuesForKeys(config.values, keys));
      if (!result.success) {
        return;
      }

      setApplying(true);
      router.refresh();
      await new Promise((resolve) => setTimeout(resolve, 500));
      setApplying(false);
      setCurrentStep("tunnel");
      return;
    }

    if (currentStep === "tunnel") {
      const keys = TUNNEL_FIELDS.map((field) => field.key);
      const result = await config.saveConfig(pickValuesForKeys(config.values, keys));
      if (!result.success) {
        return;
      }

      setApplying(true);
      router.refresh();
      await new Promise((resolve) => setTimeout(resolve, 500));
      setApplying(false);
      setCurrentStep("done");
    }
  };

  const handleSkipTunnel = () => {
    setCurrentStep("done");
  };

  const handleBack = () => {
    config.clearSaveState();
    if (currentStep === "git") {
      setCurrentStep("ai");
    } else if (currentStep === "tunnel") {
      setCurrentStep("git");
    }
  };

  if (config.loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Loading configuration…
      </div>
    );
  }

  if (config.loadError) {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
          <WarningCircleIcon className="size-4 shrink-0" />
          {config.loadError}
        </p>
        <Button type="button" variant="outline" onClick={() => void config.loadConfig()}>
          Try again
        </Button>
      </div>
    );
  }

  if (currentStep === "done") {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 text-center">
          <CheckCircleIcon
            className="mx-auto size-10 text-green-600 dark:text-green-400"
            weight="fill"
          />
          <h2 className="mt-3 text-lg font-semibold">You&apos;re ready to review code</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your AI configuration is saved. Choose a local source folder to review now.
            You can also configure a git provider and webhook tunnel for pull request reviews.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button
            render={
              <Link href={DASHBOARD_ROUTES.localReview} onClick={onDismissWelcome} />
            }
            nativeButton={false}
          >
            Review a local folder
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep("git")}
          >
            Set up pull request reviews
          </Button>
          {status.gitProvider.complete && <Link href={DASHBOARD_ROUTES.integrations} onClick={onDismissWelcome} className="text-sm underline">Connect repositories</Link>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WizardProgress currentStep={currentStep} />

      {currentStep === "ai" ? (
        <section className="space-y-5 rounded-xl border border-border bg-card p-5">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Choose your AI provider</h2>
            <p className="text-sm text-muted-foreground">
              Pick one provider and add the matching API key or local endpoint URL.
            </p>
          </div>
          <ProviderPicker
            cards={AI_PROVIDER_CARDS}
            selected={aiProvider}
            onSelect={(id) => {
              setAiProviderOverride(id as AiProviderId);
              config.clearSaveState();
            }}
          />
          <FieldSet>
            <FieldGroup>
              {aiFields.map((field) => (
                <ConfigField
                  key={field.key}
                  field={field}
                  value={config.values[field.key] ?? ""}
                  secretIsSet={Boolean(config.secretsSet[field.key])}
                  issue={config.issues[field.key]}
                  onChange={config.handleChange}
                />
              ))}
            </FieldGroup>
          </FieldSet>
        </section>
      ) : null}

      {currentStep === "git" ? (
        <section className="space-y-5 rounded-xl border border-border bg-card p-5">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Choose your git provider</h2>
            <p className="text-sm text-muted-foreground">
              Configure at least one provider. GitHub is the most common starting point.
            </p>
          </div>
          <ProviderPicker
            cards={GIT_PROVIDER_CARDS}
            selected={gitProvider}
            configured={gitConfigured}
            onSelect={(id) => {
              setGitProviderOverride(id as GitProviderId);
              config.clearSaveState();
            }}
          />
          <FieldSet>
            <FieldGroup>
              {gitFields.map((field) => (
                <ConfigField
                  key={field.key}
                  field={field}
                  value={config.values[field.key] ?? ""}
                  secretIsSet={Boolean(config.secretsSet[field.key])}
                  issue={config.issues[field.key]}
                  onChange={config.handleChange}
                />
              ))}
            </FieldGroup>
          </FieldSet>
        </section>
      ) : null}

      {currentStep === "tunnel" ? (
        <section className="space-y-5 rounded-xl border border-border bg-card p-5">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Webhooks and tunnel</h2>
            <p className="text-sm text-muted-foreground">
              Your PC runs GitClaw locally — git hosts need a public URL to send pull request
              events. This step is optional but recommended before connecting repositories.
            </p>
          </div>

          {status.webhooks.tunnel ? (
            <DesktopWebhookAssistant status={status.webhooks.tunnel} variant="setup" />
          ) : null}

          <FieldSet>
            <FieldGroup>
              {TUNNEL_FIELDS.map((field) => (
                <ConfigField
                  key={field.key}
                  field={field}
                  value={config.values[field.key] ?? ""}
                  secretIsSet={Boolean(config.secretsSet[field.key])}
                  issue={config.issues[field.key]}
                  onChange={config.handleChange}
                />
              ))}
            </FieldGroup>
          </FieldSet>
        </section>
      ) : null}

      <AdvancedFileActions />

      <div className="space-y-3 border-t border-border pt-4">
        {config.saved ? (
          <p className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400" role="status">
            <CheckCircleIcon className="size-4 shrink-0" weight="fill" />
            {applying ? "Saved — applying changes…" : "Configuration saved. GitClaw reloads automatically."}
          </p>
        ) : null}

        {config.saveError ? (
          <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
            <WarningCircleIcon className="size-4 shrink-0" />
            {config.saveError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {currentStep !== "ai" ? (
            <Button type="button" variant="outline" onClick={handleBack} disabled={config.saving || applying}>
              Back
            </Button>
          ) : null}

          {currentStep === "tunnel" ? (
            <Button type="button" variant="ghost" onClick={handleSkipTunnel} disabled={config.saving || applying}>
              Skip for now
            </Button>
          ) : null}

          <Button
            type="button"
            onClick={() => void handleSaveAndContinue()}
            disabled={config.saving || applying}
          >
            {config.saving
              ? "Saving…"
              : applying
                ? "Applying…"
                : currentStep === "tunnel"
                  ? "Save and finish"
                  : "Save and continue"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Step {stepIndex(currentStep)} — changes apply automatically after you save.
        </p>
      </div>
    </div>
  );
}
