"use client";

import { useState, type CSSProperties } from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  AI_PROVIDER_OPTIONS,
  type FieldConfig,
} from "@/features/setup/lib/desktop-config-fields";
import { cn } from "@/lib/utils";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

function isToggleableSecret(field: FieldConfig): boolean {
  return field.type === "password" || field.key === "GITHUB_APP_PRIVATE_KEY";
}

function FieldDocsLink({ docsUrl, inline }: { docsUrl: string; inline?: boolean }) {
  return (
    <>
      {inline ? " " : null}
      <a
        href={docsUrl}
        target="_blank"
        rel="noreferrer"
        className="text-foreground underline underline-offset-2"
      >
        Read docs
      </a>
    </>
  );
}

function SecretVisibilityToggle({
  visible,
  onToggle,
  className,
}: {
  visible: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "absolute text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
      aria-label={visible ? "Hide value" : "Show value"}
    >
      {visible ? <EyeSlashIcon className="size-4" /> : <EyeIcon className="size-4" />}
    </button>
  );
}

export function ConfigField({
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
  const [showSecret, setShowSecret] = useState(false);
  const inputId = `config-${field.key}`;
  const isPassword = field.type === "password";
  const isSecretTextarea = field.key === "GITHUB_APP_PRIVATE_KEY";
  const hasVisibilityToggle = isToggleableSecret(field);
  const placeholder =
    field.placeholder ??
    (isPassword && secretIsSet ? "Leave blank to keep the current value" : undefined);

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
      <div className="relative">
        <textarea
          id={inputId}
          name={field.key}
          value={value}
          rows={4}
          placeholder={placeholder}
          onChange={(event) => onChange(field.key, event.target.value)}
          style={
            isSecretTextarea
              ? ({ WebkitTextSecurity: showSecret ? "none" : "disk" } as CSSProperties)
              : undefined
          }
          className={cn(
            "w-full rounded-md border border-input bg-input/20 px-2 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 md:text-xs/relaxed dark:bg-input/30",
            isSecretTextarea ? "pr-8" : undefined,
            issue ? "border-destructive" : undefined,
          )}
        />
        {isSecretTextarea ? (
          <SecretVisibilityToggle
            visible={showSecret}
            onToggle={() => setShowSecret((current) => !current)}
            className="right-2 top-2"
          />
        ) : null}
      </div>
    );
  } else if (isPassword) {
    control = (
      <div className="relative">
        <Input
          id={inputId}
          name={field.key}
          type={showSecret ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(field.key, event.target.value)}
          aria-invalid={issue ? true : undefined}
          className="pr-8"
        />
        <SecretVisibilityToggle
          visible={showSecret}
          onToggle={() => setShowSecret((current) => !current)}
          className="right-2 top-1/2 -translate-y-1/2"
        />
      </div>
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

  const description = field.description ? (
    <FieldDescription>
      {field.description}
      {field.docsUrl ? <FieldDocsLink docsUrl={field.docsUrl} inline /> : null}
    </FieldDescription>
  ) : field.docsUrl ? (
    <FieldDescription>
      <FieldDocsLink docsUrl={field.docsUrl} />
    </FieldDescription>
  ) : null;

  return (
    <Field data-invalid={issue ? true : undefined}>
      <FieldLabel htmlFor={inputId}>{field.label}</FieldLabel>
      {description}
      {control}
      {hasVisibilityToggle && secretIsSet ? (
        <FieldDescription>A value is already saved.</FieldDescription>
      ) : null}
      {issue ? <FieldError>{issue}</FieldError> : null}
    </Field>
  );
}
