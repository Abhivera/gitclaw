import { statusBadge } from "@/features/dashboard/lib/status-style";
import { cn } from "@/lib/utils";
import { WarningCircleIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";

type SeverityBadgeProps = {
  severity: string;
  className?: string;
};

const SEVERITY_CONFIG: Record<
  string,
  {
    label: string;
    tone: "danger" | "warning";
    Icon: typeof WarningCircleIcon;
  }
> = {
  issue: {
    label: "Issue",
    tone: "danger",
    Icon: WarningCircleIcon,
  },
  suggestion: {
    label: "Suggestion",
    tone: "warning",
    Icon: WarningIcon,
  },
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity] ?? {
    label: severity,
    tone: "warning" as const,
    Icon: WarningIcon,
  };
  const { label, tone, Icon } = config;

  return (
    <span className={cn(statusBadge(tone, "gap-1"), className)}>
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}
