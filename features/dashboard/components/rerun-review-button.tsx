"use client";

import { Button } from "@/components/ui/button";
import { rerunReview } from "@/features/dashboard/actions";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { useTransition } from "react";

export function RerunReviewButton({ pullRequestId }: { pullRequestId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        const formData = new FormData();
        formData.set("pullRequestId", pullRequestId);
        startTransition(() => rerunReview(formData));
      }}
    >
      <ArrowsClockwise className="size-4" />
      {pending ? "Queuing…" : "Re-run review"}
    </Button>
  );
}
