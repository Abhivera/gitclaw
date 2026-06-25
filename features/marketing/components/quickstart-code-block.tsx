"use client";

import { CopyButton } from "@/components/ui/copy-button";

type QuickstartCodeBlockProps = {
  label?: string;
  value: string;
};

export function QuickstartCodeBlock({ label, value }: QuickstartCodeBlockProps) {
  return (
    <div className="qs-code">
      <div className="qs-code-head">
        {label ? <span className="qs-code-label">{label}</span> : <span />}
        <CopyButton
          value={value}
          label="Copy"
          className="border-[var(--line)] bg-[var(--bg-raised)] text-[var(--text-dim)] hover:bg-[var(--bg)]"
        />
      </div>
      <pre className="qs-code-body">{value}</pre>
    </div>
  );
}
