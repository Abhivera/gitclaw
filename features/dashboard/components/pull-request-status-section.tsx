"use client";

import { PrStatusBadge } from "@/features/dashboard/components/pr-status-badge";
import { RerunReviewButton } from "@/features/dashboard/components/rerun-review-button";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const ACTIVE_STATUSES = new Set(["pending", "processing"]);
const POLL_INTERVAL_MS = 3000;

type PullRequestStatusSectionProps = {
  pullRequestId: string;
  initialStatus: string;
};

type StatusResponse = {
  status: string;
  reviewRunCount: number;
  reviewedAt: string | null;
};

export function PullRequestStatusSection({
  pullRequestId,
  initialStatus,
}: PullRequestStatusSectionProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [polling, setPolling] = useState(ACTIVE_STATUSES.has(initialStatus));
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!polling) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch(
          `/api/dashboard/pull-requests/${pullRequestId}/status`
        );
        if (!response.ok || cancelled) {
          return;
        }

        const data = (await response.json()) as StatusResponse;
        const previousStatus = statusRef.current;

        if (data.status !== previousStatus) {
          setStatus(data.status);

          if (!ACTIVE_STATUSES.has(data.status)) {
            setPolling(false);
            router.refresh();
          }
        }
      } catch {
        // Ignore transient network errors; next poll will retry.
      }
    };

    void poll();
    const intervalId = window.setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [polling, pullRequestId, router]);

  const handleQueued = useCallback(() => {
    setStatus("pending");
    setPolling(true);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <PrStatusBadge status={status} />
      <RerunReviewButton pullRequestId={pullRequestId} onQueued={handleQueued} />
    </div>
  );
}
