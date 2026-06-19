"use client";

import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { PR_STATUS_OPTIONS } from "@/features/dashboard/lib/status-labels";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

type PullRequestFiltersProps = {
  repos: string[];
  currentStatus?: string;
  currentRepo?: string;
};

export function PullRequestFilters({
  repos,
  currentStatus = "",
  currentRepo = "",
}: PullRequestFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const updateFilters = useCallback(
    (updates: { status?: string; repo?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.status !== undefined) {
        if (updates.status) {
          params.set("status", updates.status);
        } else {
          params.delete("status");
        }
      }

      if (updates.repo !== undefined) {
        if (updates.repo) {
          params.set("repo", updates.repo);
        } else {
          params.delete("repo");
        }
      }

      params.delete("page");

      const query = params.toString();
      startTransition(() => {
        router.push(
          query
            ? `${DASHBOARD_ROUTES.pullRequest}?${query}`
            : DASHBOARD_ROUTES.pullRequest
        );
      });
    },
    [router, searchParams]
  );

  const hasFilters = Boolean(currentStatus || currentRepo);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3",
        pending && "opacity-60"
      )}
    >
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Status</span>
        <select
          value={currentStatus}
          onChange={(e) => updateFilters({ status: e.target.value })}
          className="h-8 rounded-none border border-border bg-background px-2 text-sm"
          aria-label="Filter by status"
        >
          {PR_STATUS_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {repos.length > 0 ? (
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Repository</span>
          <select
            value={currentRepo}
            onChange={(e) => updateFilters({ repo: e.target.value })}
            className="h-8 max-w-xs rounded-none border border-border bg-background px-2 text-sm"
            aria-label="Filter by repository"
          >
            <option value="">All repositories</option>
            {repos.map((repo) => (
              <option key={repo} value={repo}>
                {repo}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {hasFilters ? (
        <button
          type="button"
          onClick={() => updateFilters({ status: "", repo: "" })}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
