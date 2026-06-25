import { CopyButton } from "@/components/ui/copy-button";

type WebhookUrlRowProps = {
  label: string;
  url: string;
  description?: string;
};

export function WebhookUrlRow({ label, url, description }: WebhookUrlRowProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <CopyButton value={url} label="Copy URL" />
      </div>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      <code className="block break-all rounded-md bg-background px-2 py-1.5 text-[11px] text-foreground ring-1 ring-border">
        {url}
      </code>
    </div>
  );
}
