import type { ComponentType } from "react";
import { ArrowUpRightIcon } from "@phosphor-icons/react";

type DownloadCardProps = {
  title: string;
  description: string;
  href: string;
  fileLabel?: string;
  icon: ComponentType<{ className?: string }>;
  highlight?: boolean;
};

export function DownloadCard({
  title,
  description,
  href,
  fileLabel,
  icon: Icon,
  highlight,
}: DownloadCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={[
        "group flex flex-col rounded-2xl border p-5 transition",
        highlight
          ? "border-[#8d6e9e]/45 bg-[#8d6e9e]/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
          : "border-white/[0.08] bg-[#0a0e14]/80 hover:border-[#8d6e9e]/25 hover:bg-[#0d1219]",
      ].join(" ")}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8d6e9e]/15 ring-1 ring-[#8d6e9e]/30">
          <Icon className="h-5 w-5 text-[#d1c6d6]" />
        </div>
        <ArrowUpRightIcon
          className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:text-[#b29bbd]"
          aria-hidden
        />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-zinc-50">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-zinc-500">{description}</p>
      {fileLabel && (
        <p className="mt-3 truncate font-mono text-xs text-zinc-600" title={fileLabel}>
          {fileLabel}
        </p>
      )}
    </a>
  );
}
