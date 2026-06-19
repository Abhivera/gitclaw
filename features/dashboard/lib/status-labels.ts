export const PR_STATUS_LABELS: Record<string, string> = {
  reviewed: "Reviewed",
  processing: "Processing",
  pending: "Pending",
  skipped: "Skipped",
  failed: "Failed",
};

export function getStatusLabel(status: string): string {
  return PR_STATUS_LABELS[status] ?? status;
}

export const PR_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "reviewed", label: "Reviewed" },
  { value: "processing", label: "Processing" },
  { value: "pending", label: "Pending" },
  { value: "skipped", label: "Skipped" },
  { value: "failed", label: "Failed" },
] as const;
