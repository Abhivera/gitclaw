import { NextResponse } from "next/server";
import { authorizeAdmin, isTrustedAdminOrigin } from "@/lib/admin-auth";
import { isDesktopApp } from "@/features/setup/lib/is-desktop";
import { isAiProviderConfigured } from "@/features/git-providers/lib/provider-env";
import { localReviewInputSchema } from "@/features/local-reviews/types";
import { snapshotId } from "@/features/local-reviews/server/consent";
import { getAiReviewDestination } from "@/features/ai";
import { isSensitiveFile } from "@/features/ai/security";
import { generateReview } from "@/features/reviews/server/generate-review";
import { formatPrFilesForReview } from "@/features/reviews/server/pr-files";
import { filterFindingsToDiff } from "@/features/reviews/server/post-inline-review";

export const dynamic = "force-dynamic";
export const maxDuration = 90;
let reviewing = false;

function accessError(request: Request) {
  if (!isDesktopApp()) return NextResponse.json({ error: "Open local reviews in the desktop app." }, { status: 404 });
  if (!authorizeAdmin(request.headers)) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!isTrustedAdminOrigin(request)) return NextResponse.json({ error: "Untrusted origin" }, { status: 403 });
  if (!isAiProviderConfigured()) return NextResponse.json({ error: "Configure an AI provider in Settings first." }, { status: 409 });
}

export async function GET(request: Request) {
  const denied = accessError(request);
  if (denied) return denied;
  try { return NextResponse.json(getAiReviewDestination()); }
  catch { return NextResponse.json({ error: "Check your AI provider configuration." }, { status: 409 }); }
}

export async function POST(request: Request) {
  const denied = accessError(request);
  if (denied) return denied;
  if (reviewing) return NextResponse.json({ error: "A local review is already running." }, { status: 409 });
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: "Missing review input" }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 200_000) {
        await reader.cancel();
        return NextResponse.json({ error: "Select a smaller folder for this review." }, { status: 413 });
      }
      chunks.push(value);
    }
    const parsed = localReviewInputSchema.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (!parsed.success || parsed.data.files.some((file) => isSensitiveFile(file.filePath))) {
      return NextResponse.json({ error: "Invalid source snapshot or missing confirmation" }, { status: 400 });
    }
    const { folderName, files, consent } = parsed.data;
    // The files and current destination must be exactly the ones shown at confirmation.
    if (consent.snapshotId !== snapshotId(folderName, files) || consent.destinationId !== getAiReviewDestination().id) {
      return NextResponse.json({ error: "The source snapshot or AI destination changed. Preview and confirm again." }, { status: 409 });
    }
    const diff = formatPrFilesForReview(files);
    if (diff.length > 85_000) return NextResponse.json({ error: "Select a smaller folder for this review." }, { status: 413 });
    if (reviewing) return NextResponse.json({ error: "A local review is already running." }, { status: 409 });
    reviewing = true;
    try {
      const review = await generateReview({
        repoFullName: folderName,
        title: "Review a snapshot of selected local source files. These are existing files represented as additions for line addressing.",
        diff,
      });
      return NextResponse.json({ ...review, findings: filterFindingsToDiff(review.findings, files) });
    } finally { reviewing = false; }
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON input" }, { status: 400 });
    console.error("[gitclaw] local review failed", { name: error instanceof Error ? error.name : "Unknown" });
    return NextResponse.json({ error: "Review failed. Check your AI provider key, endpoint, and model, then try again." }, { status: 502 });
  } finally { reader.releaseLock(); }
}
