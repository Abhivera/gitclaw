"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { ConfigField } from "@/features/setup/components/desktop-config-field";
import { DesktopConfigActions } from "@/features/setup/components/desktop-config-actions";
import { ProviderPicker } from "@/features/setup/components/desktop-provider-picker";
import { useDesktopConfig } from "@/features/setup/hooks/use-desktop-config";
import {
  ADVANCED_FIELDS,
  AI_PROVIDER_CARDS,
  GIT_PROVIDER_CARDS,
  detectAiProvider,
  detectGitProvider,
  getFieldsForAiProvider,
  getFieldsForGitProvider,
  getGitFieldGroup,
  type AiProviderId,
  type GitProviderId,
} from "@/features/setup/lib/desktop-config-fields";
import { cn } from "@/lib/utils";
import { CaretDownIcon, CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { DOCS_ENV_VARS_URL } from "@/lib/links";

export function DesktopConfigurationForm() {
  const router = useRouter();
  const config = useDesktopConfig();
  const [aiProviderOverride, setAiProviderOverride] = useState<AiProviderId | null>(null);
  const [gitProviderOverride, setGitProviderOverride] = useState<GitProviderId | null>(null);

  const aiProvider =
    aiProviderOverride ?? detectAiProvider(config.values, config.secretsSet);
  const gitProvider =
    gitProviderOverride ?? detectGitProvider(config.values, config.secretsSet);

  const aiFields = useMemo(() => getFieldsForAiProvider(aiProvider), [aiProvider]);
  const gitFields = useMemo(() => getFieldsForGitProvider(gitProvider), [gitProvider]);
  const gitGroup = useMemo(() => getGitFieldGroup(gitProvider), [gitProvider]);

  const gitConfigured = useMemo(() => {
    const hasGitHub = Boolean(
      config.values.GITHUB_APP_SLUG?.trim() &&
        config.values.GITHUB_APP_ID?.trim() &&
        (config.values.GITHUB_APP_PRIVATE_KEY?.trim() || config.secretsSet.GITHUB_APP_PRIVATE_KEY) &&
        (config.values.GITHUB_WEBHOOK_SECRET?.trim() || config.secretsSet.GITHUB_WEBHOOK_SECRET),
    );
    const hasGitlab = Boolean(
      config.values.GITLAB_CLIENT_ID?.trim() &&
        (config.values.GITLAB_CLIENT_SECRET?.trim() || config.secretsSet.GITLAB_CLIENT_SECRET),
    );
    const hasBitbucket = Boolean(
      config.values.BITBUCKET_CLIENT_ID?.trim() &&
        (config.values.BITBUCKET_CLIENT_SECRET?.trim() ||
          config.secretsSet.BITBUCKET_CLIENT_SECRET),
    );

    return {
      github: hasGitHub,
      gitlab: hasGitlab,
      bitbucket: hasBitbucket,
    };
  }, [config.values, config.secretsSet]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await config.saveConfig();
    if (result.success) {
      router.refresh();
    }
  };

  if (config.loading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">Loading configuration…</CardContent>
      </Card>
    );
  }

  if (config.loadError) {
    return (
      <Card>
        <CardContent className="space-y-4 py-8">
          <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
            <WarningCircleIcon className="size-4 shrink-0" />
            {config.loadError}
          </p>
          <Button type="button" variant="outline" onClick={() => void config.loadConfig()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI provider</CardTitle>
          <CardDescription>Choose one provider and add the matching credentials.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ProviderPicker
            cards={AI_PROVIDER_CARDS}
            selected={aiProvider}
            onSelect={(id) => setAiProviderOverride(id as AiProviderId)}
          />
          <FieldSet>
            <FieldLegend className="sr-only">AI provider fields</FieldLegend>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Git provider</CardTitle>
          <CardDescription>
            Configure at least one provider. Select a provider to edit its credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ProviderPicker
            cards={GIT_PROVIDER_CARDS}
            selected={gitProvider}
            configured={gitConfigured}
            onSelect={(id) => setGitProviderOverride(id as GitProviderId)}
          />
          <div className={cn("rounded-lg border border-border p-4")}>
            <p className="mb-4 text-sm font-medium">{gitGroup.title}</p>
            <FieldSet>
              <FieldLegend className="sr-only">{gitGroup.title}</FieldLegend>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced</CardTitle>
          <CardDescription>
            Tunnel hostnames and model overrides. See the{" "}
            <a
              href={DOCS_ENV_VARS_URL}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline underline-offset-2"
            >
              environment variables docs
            </a>{" "}
            for details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <details className="group rounded-lg border border-border">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
              <span>Show advanced settings</span>
              <CaretDownIcon className="size-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-border px-4 py-4">
              <FieldSet>
                <FieldGroup>
                  {ADVANCED_FIELDS.map((field) => (
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
            </div>
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Power users</CardTitle>
          <CardDescription>
            The form writes the same <code className="text-foreground">.env</code> file the desktop app
            manages. You can still edit it manually in your default editor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DesktopConfigActions compact />
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-6 border-t border-border bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            {config.saved ? (
              <p className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400" role="status">
                <CheckCircleIcon className="size-4 shrink-0" weight="fill" />
                Configuration saved. GitClaw reloads automatically.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Save your changes — GitClaw reloads configuration from the file automatically.
              </p>
            )}

            {config.saveError ? (
              <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
                <WarningCircleIcon className="size-4 shrink-0" />
                {config.saveError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={config.saving}>
              {config.saving ? "Saving…" : "Save configuration"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

export function DesktopConfigurationUnavailable() {
  return (
    <Card>
      <CardContent className="space-y-3 py-8 text-sm text-muted-foreground">
        <p>In-app configuration is only available in the GitClaw desktop app.</p>
        <p>
          For self-hosted installs, copy <code className="text-foreground">.env.example</code> to{" "}
          <code className="text-foreground">.env</code> and follow the{" "}
          <Link href={DOCS_ENV_VARS_URL} className="text-foreground underline underline-offset-2">
            setup guide
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
