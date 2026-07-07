"use client";

import { useCallback, useEffect, useState } from "react";
import { emptyFormState } from "@/features/setup/lib/desktop-config-fields";

export type ConfigSnapshot = {
  values: Record<string, string>;
  secretsSet: Record<string, boolean>;
};

async function fetchDesktopConfig(): Promise<ConfigSnapshot> {
  const response = await fetch("/api/desktop/config");
  if (!response.ok) {
    throw new Error("Could not load configuration.");
  }
  return (await response.json()) as ConfigSnapshot;
}

export function useDesktopConfig() {
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

  const handleChange = useCallback((key: string, value: string) => {
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
  }, []);

  const saveConfig = useCallback(
    async (updates?: Record<string, string>) => {
      setSaving(true);
      setSaveError(null);
      setSaved(false);
      setIssues({});

      const payload = updates ?? values;

      try {
        const response = await fetch("/api/desktop/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
            return { success: false as const };
          }

          throw new Error(data.error ?? "Failed to save configuration.");
        }

        setSaved(true);
        await loadConfig();
        return { success: true as const };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to save configuration.";
        setSaveError(message);
        return { success: false as const };
      } finally {
        setSaving(false);
      }
    },
    [loadConfig, values],
  );

  const setClientIssues = useCallback((nextIssues: Record<string, string>) => {
    setIssues(nextIssues);
    if (Object.keys(nextIssues).length > 0) {
      setSaveError("Fix the highlighted fields and try again.");
    }
  }, []);

  const clearSaveState = useCallback(() => {
    setSaved(false);
    setSaveError(null);
    setIssues({});
  }, []);

  return {
    values,
    secretsSet,
    issues,
    loading,
    loadError,
    saving,
    saveError,
    saved,
    handleChange,
    loadConfig,
    saveConfig,
    setClientIssues,
    clearSaveState,
    applyConfig,
  };
}
