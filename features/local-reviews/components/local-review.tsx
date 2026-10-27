"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/features/dashboard/components/markdown-content";
import { CopyButton } from "@/components/ui/copy-button";
import type { AiReviewDestination, LocalReviewSelection } from "../types";
import type { StructuredReview } from "@/features/reviews/types/review-finding";

export function LocalReview() {
  const [selection, setSelection] = useState<LocalReviewSelection | null>(null);
  const [destination, setDestination] = useState<AiReviewDestination | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState<"choosing" | "reviewing" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<StructuredReview | null>(null);

  const choose = async () => {
    setError(null); setConfirmed(false); setBusy("choosing"); setSelection(null); setDestination(null);
    try {
      if (!window.gitclawDesktop) throw new Error("Open GitClaw's installed desktop app to choose a folder.");
      const picked = await window.gitclawDesktop.chooseReviewFolder();
      if (!picked) return;
      if (!picked.files.length) throw new Error("No supported source files found. Choose a source folder with UTF-8 code files.");
      const response = await fetch("/api/desktop/local-review");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Configure your AI provider first.");
      setSelection(picked); setDestination(result);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not open folder."); }
    finally { setBusy(null); }
  };

  const run = async () => {
    if (!confirmed || !selection || !destination || !window.gitclawDesktop) return;
    setBusy("reviewing"); setError(null); setReview(null); setConfirmed(false);
    try {
      setReview(await window.gitclawDesktop.reviewLocalFolder({
        confirmed: true, snapshotId: selection.id, destinationId: destination.id,
      }));
    } catch (error) { setError(error instanceof Error ? error.message : "Review failed."); }
    finally { setBusy(null); setSelection(null); }
  };

  const report = review ? [review.summary, ...review.findings.map((finding) =>
    `${finding.file}:${finding.line} (${finding.severity})\n${finding.body}${finding.suggestion ? `\nSuggested fix:\n${finding.suggestion}` : ""}`)].join("\n\n") : "";

  return <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
    <section className="space-y-4 rounded-xl border bg-card p-6">
      <h2 className="text-lg font-semibold">Review a local source folder</h2>
      <p className="text-sm text-muted-foreground">Works without Git, a connected repository, or a webhook tunnel. GitClaw reads a bounded snapshot and never executes or changes your code. Ignored files, hidden files, dependencies, and common secret files are excluded.</p>
      <div className="flex flex-wrap items-center gap-4">
        <Button disabled={busy !== null} onClick={() => void choose()}>{busy === "choosing" ? "Reading source files…" : "Choose folder"}</Button>
        <Link href="/dashboard/settings/configuration" className="text-sm underline underline-offset-4">AI provider settings</Link>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>

    {selection && destination && <section className="space-y-4 rounded-xl border bg-card p-6">
      <h2 className="text-lg font-semibold">Confirm this review</h2>
      <p className="text-sm"><strong>{selection.folderName}</strong> · {selection.files.length} files · {(selection.totalBytes / 1024).toFixed(1)} KB</p>
      <div className="rounded-lg bg-muted p-4 text-sm">
        <p>Destination: <strong>{destination.provider}</strong></p>
        <p className="break-all font-mono text-xs">{destination.endpoint}</p>
        <p className="mt-1">Model: <strong>{destination.model}</strong></p>
      </div>
      <ul className="max-h-64 space-y-1 overflow-auto rounded-lg border p-3 font-mono text-xs">
        {selection.files.map((file) => <li key={file.filePath} className="flex justify-between gap-4"><span className="break-all">{file.filePath}</span><span className="shrink-0 text-muted-foreground">{file.lines} lines</span></li>)}
      </ul>
      {(selection.truncated || selection.skipped.length > 0) && <div className="space-y-2 rounded-lg border border-amber-500/40 p-3 text-sm">
        <p>Some files are outside this review. Choose a smaller folder for fuller coverage.</p>
        {selection.skipped.length > 0 && <details><summary>Skipped files ({selection.skipped.length})</summary><ul className="mt-2 max-h-32 overflow-auto text-xs">{selection.skipped.map((file, index) => <li key={index}>{file.filePath}: {file.reason}</li>)}</ul></details>}
      </div>}
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" checked={confirmed} disabled={busy !== null} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" />
        <span>I approve sending the listed source files to <strong>{destination.endpoint}</strong> for this review. Detected secrets are redacted, but detection cannot identify every secret.</span>
      </label>
      <Button disabled={!confirmed || busy !== null} onClick={() => void run()}>Confirm and review these files</Button>
    </section>}

    {busy === "reviewing" && <p role="status" className="rounded-xl border p-6 text-sm">Reviewing your confirmed snapshot… This usually takes up to a minute.</p>}
    {review && <section className="space-y-5 rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">Review results</h2><CopyButton value={report} /></div>
      <MarkdownContent content={review.summary} />
      {!review.findings.length && <p className="text-sm text-muted-foreground">No findings were returned for the included files. This is not a guarantee that the code is free of vulnerabilities.</p>}
      {review.findings.map((finding, index) => <article key={index} className="space-y-3 rounded-lg border p-4">
        <p className="break-all font-mono text-xs">{finding.file}:{finding.line} · {finding.severity}</p>
        <MarkdownContent content={finding.body} />
        {finding.suggestion && <pre className="overflow-x-auto rounded bg-muted p-3 text-xs"><code>{finding.suggestion}</code></pre>}
      </article>)}
      <p className="text-xs text-muted-foreground">Results are kept in this window. Copy your report before closing or navigating away.</p>
    </section>}
  </div>;
}
