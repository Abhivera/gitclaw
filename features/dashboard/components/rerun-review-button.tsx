"use client";

import { Button } from "@/components/ui/button";
import { rerunReview } from "@/features/dashboard/actions";
import { cn } from "@/lib/utils";
import { ArrowsClockwise, CheckCircleIcon } from "@phosphor-icons/react";
import { useState, useTransition } from "react";

type RerunReviewButtonProps = {
  pullRequestId: string;
  onQueued?: () => void;
};

export function RerunReviewButton({
  pullRequestId,
  onQueued,
}: RerunReviewButtonProps) {
  const [pending, startTransition] = useTransition();
  const [queued, setQueued] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          const formData = new FormData();
          formData.set("pullRequestId", pullRequestId);
          startTransition(async () => {
            await rerunReview(formData);
            setQueued(true);
            onQueued?.();
            setTimeout(() => setQueued(false), 4000);
          });
        }}
      >
        <ArrowsClockwise className={cn("size-4", pending && "animate-spin")} />
        {pending ? "Queuing…" : "Re-run review"}
      </Button>
      {queued ? (
        <span
          className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400"
          role="status"
        >
          <CheckCircleIcon className="size-3.5" />
          Review queued
        </span>
      ) : null}
    </div>
  );
}
