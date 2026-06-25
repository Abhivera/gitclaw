"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DesktopConfigActions } from "@/features/setup/components/desktop-config-actions";
import { DESKTOP_USER_ENV_KEYS } from "@/lib/env";
import { cn } from "@/lib/utils";
import { CaretDownIcon, CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";

import { DOCS_ENV_VARS_URL } from "@/lib/links";

type ConfigSnapshot = {
  values: Record<string, string>;
  secretsSet: Record<string, boolean>;
};

type FieldConfig = {
  key: (typeof DESKTOP_USER_ENV_KEYS)[number];
  label: string;
  description?: string;
  type?: "text" | "password" | "url" | "textarea";
  placeholder?: string;
};

type FieldGroupConfig = {
  title: string;
  description: string;
  fields: FieldConfig[];
};

const CONFIG_FIELD_GROUPS: FieldGroupConfig[] = [
  {
    title: "GitHub",
    description: "Required to connect repositories and receive pull request webhooks.",
    fields: [
      { key: "GITHUB_APP_SLUG", label: "App slug" },
      { key: "GITHUB_APP_ID", label: "App ID" },
      {
        key: "GITHUB_APP_PRIVATE_KEY",
        label: "Private key",
        type: "textarea",
        description: "Paste the PEM key from your GitHub App settings.",
      },
      {
        key: "GITHUB_WEBHOOK_SECRET",
        label: "Webhook secret",
        type: "password",
      },
    ],
  },
  {
    title: "GitLab",
    description: "OAuth application credentials for GitLab.com or self-hosted GitLab.",
    fields: [
      { key: "GITLAB_CLIENT_ID", label: "Client ID" },
      { key: "GITLAB_CLIENT_SECRET", label: "Client secret", type: "password" },
      {
        key: "GITLAB_BASE_URL",
        label: "Base URL",
        type: "url",
        placeholder: "https://gitlab.com",
        description: "Leave blank for GitLab.com.",
      },
    ],
  },
  {
    title: "Bitbucket",
    description: "OAuth consumer credentials for Bitbucket Cloud.",
    fields: [
      { key: "BITBUCKET_CLIENT_ID", label: "Client ID" },
      { key: "BITBUCKET_CLIENT_SECRET", label: "Client secret", type: "password" },
    ],
  },
  {
    title: "AI provider",
    description: "Choose one provider and add the matching credentials.",
    fields: [
      { key: "OPENROUTER_API_KEY", label: "OpenRouter API key", type: "password" },
      { key: "ANTHROPIC_API_KEY", label: "Anthropic API key", type: "password" },
      { key: "GROQ_API_KEY", label: "Groq API key", type: "password" },
      {
        key: "OPENAI_BASE_URL",
        label: "OpenAI-compatible base URL",
        type: "url",
        placeholder: "http://localhost:11434/v1",
        description: "For Ollama or other OpenAI-compatible endpoints.",
      },
      {
        key: "OPENAI_API_KEY",
        label: "OpenAI-compatible API key",
        type: "password",
        description: "Only needed if your endpoint requires an API key.",
      },
    ],
  },
];

const ADVANCED_FIELDS: FieldConfig[] = [
  {
    key: "ALLOWED_DEV_ORIGINS",
    label: "Allowed dev origins",
    description: "Comma-separated tunnel hostnames (e.g. abc123.ngrok-free.app).",
  },
  {
    key: "GITCLAW_REVIEW_MODEL",
    label: "Review model",
    description: "Override the default model for your AI provider.",
  },
  {
    key: "AI_PROVIDER",
    label: "AI provider override",
    description: "Set explicitly if auto-detection does not match your setup.",
  },
];

const AI_PROVIDER_OPTIONS = [
  { value: "", label: "Auto-detect" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "groq", label: "Groq" },
  { value: "openai-compatible", label: "OpenAI-compatible" },
  { value: "ollama", label: "Ollama" },
];

function emptyFormState(): Record<string, string> {
  return Object.fromEntries(DESKTOP_USER_ENV_KEYS.map((key) => [key, ""]));
}

async function fetchDesktopConfig(): Promise<ConfigSnapshot> {
  const response = await fetch("/api/desktop/config");
  if (!response.ok) {
    throw new Error("Could not load configuration.");
  }
  return (await response.json()) as ConfigSnapshot;
}

function ConfigField({
  field,
  value,
  secretIsSet,
  issue,
  onChange,
}: {
  field: FieldConfig;
  value: string;
  secretIsSet: boolean;
  issue?: string;
  onChange: (key: string, value: string) => void;
}) {
  const inputId = `config-${field.key}`;
  const isSecret = field.type === "password";
  const placeholder =
    field.placeholder ??
    (isSecret && secretIsSet ? "Leave blank to keep the current value" : undefined);

  let control: React.ReactNode;

  if (field.key === "AI_PROVIDER") {
    control = (
      <select
        id={inputId}
        name={field.key}
        value={value}
        onChange={(event) => onChange(field.key, event.target.value)}
        className={cn(
          "h-7 w-full rounded-md border border-input bg-input/20 px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 md:text-xs/relaxed dark:bg-input/30",
          issue ? "border-destructive" : undefined,
        )}
      >
        {AI_PROVIDER_OPTIONS.map((option) => (
          <option key={option.value || "auto"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else if (field.type === "textarea") {
    control = (
      <textarea
        id={inputId}
        name={field.key}
        value={value}
        rows={4}
        placeholder={placeholder}
        onChange={(event) => onChange(field.key, event.target.value)}
        className={cn(
          "w-full rounded-md border border-input bg-input/20 px-2 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 md:text-xs/relaxed dark:bg-input/30",
          issue ? "border-destructive" : undefined,
        )}
      />
    );
  } else {
    control = (
      <Input
        id={inputId}
        name={field.key}
        type={field.type ?? "text"}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(field.key, event.target.value)}
        aria-invalid={issue ? true : undefined}
      />
    );
  }

  return (
    <Field data-invalid={issue ? true : undefined}>
      <FieldLabel htmlFor={inputId}>{field.label}</FieldLabel>
      {field.description ? <FieldDescription>{field.description}</FieldDescription> : null}
      {control}
      {isSecret && secretIsSet ? (
        <FieldDescription>A value is already saved.</FieldDescription>
      ) : null}
      {issue ? <FieldError>{issue}</FieldError> : null}
    </Field>
  );
}

export function DesktopConfigurationForm() {
  const [values, setValues] = useState<Record<string, string>>(emptyFormState);
  const [secretsSet, setSecretsSet] = useState<Record<string, boolean>>({});
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const applyConfig = useCallback((data: ConfigSnapshot) => {
    setValues({ ...emptyFormState(), ...data.values });
    setSecretsSet(data.secretsSet);
  }, []);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const data = await fetchDesktopConfig();
      applyConfig(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load configuration.";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [applyConfig]);

  useEffect(() => {
    let cancelled = false;

    fetchDesktopConfig()
      .then((data) => {
        if (!cancelled) {
          applyConfig(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Could not load configuration.";
          setLoadError(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applyConfig]);

  const handleChange = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setIssues((current) => {
      if (!(key in current)) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    setIssues({});

    try {
      const response = await fetch("/api/desktop/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = (await response.json()) as {
          error?: string;
          issues?: Array<{ path: (string | number)[]; message: string }>;
        };

        if (data.issues?.length) {
          const nextIssues: Record<string, string> = {};
          for (const issue of data.issues) {
            const key = String(issue.path[0] ?? "");
            if (key) {
              nextIssues[key] = issue.message;
            }
          }
          setIssues(nextIssues);
          setSaveError("Fix the highlighted fields and try again.");
          return;
        }

        throw new Error(data.error ?? "Failed to save configuration.");
      }

      setSaved(true);
      await loadConfig();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save configuration.";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">Loading configuration…</CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="space-y-4 py-8">
          <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
            <WarningCircleIcon className="size-4 shrink-0" />
            {loadError}
          </p>
          <Button type="button" variant="outline" onClick={() => void loadConfig()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {CONFIG_FIELD_GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldSet>
              <FieldLegend className="sr-only">{group.title}</FieldLegend>
              <FieldGroup>
                {group.fields.map((field) => (
                  <ConfigField
                    key={field.key}
                    field={field}
                    value={values[field.key] ?? ""}
                    secretIsSet={Boolean(secretsSet[field.key])}
                    issue={issues[field.key]}
                    onChange={handleChange}
                  />
                ))}
              </FieldGroup>
            </FieldSet>
          </CardContent>
        </Card>
      ))}

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
                      value={values[field.key] ?? ""}
                      secretIsSet={Boolean(secretsSet[field.key])}
                      issue={issues[field.key]}
                      onChange={handleChange}
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
            {saved ? (
              <p className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400" role="status">
                <CheckCircleIcon className="size-4 shrink-0" weight="fill" />
                Configuration saved. GitClaw reloads automatically.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Save your changes — GitClaw reloads configuration from the file automatically.
              </p>
            )}

            {saveError ? (
              <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
                <WarningCircleIcon className="size-4 shrink-0" />
                {saveError}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save configuration"}
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
