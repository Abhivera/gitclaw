"use client";

import { Switch } from "@/components/ui/switch";
import { toggleRepoEnabled } from "@/features/dashboard/actions";
import { useTransition } from "react";

type RepoEnableToggleProps = {
  repositoryId: string;
  enabled: boolean;
};

export function RepoEnableToggle({
  repositoryId,
  enabled,
}: RepoEnableToggleProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Switch
      checked={enabled}
      disabled={pending}
      onCheckedChange={(checked) => {
        const formData = new FormData();
        formData.set("repositoryId", repositoryId);
        formData.set("enabled", String(checked));
        startTransition(() => toggleRepoEnabled(formData));
      }}
      aria-label="Enable reviews for repository"
    />
  );
}
