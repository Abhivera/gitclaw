import { getStatusLabel } from "@/features/dashboard/lib/status-labels";
import { statusBadge } from "@/features/dashboard/lib/status-style";

const STATUS_TONE: Record<
  string,
  "success" | "warning" | "danger" | "info" | "neutral"
> = {
  reviewed: "success",
  processing: "info",
  pending: "warning",
  skipped: "neutral",
  failed: "danger",
};

export function PrStatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return <span className={statusBadge(tone)}>{getStatusLabel(status)}</span>;
}
