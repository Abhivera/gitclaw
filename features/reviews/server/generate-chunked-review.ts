import type { PrFile } from "../types/review";
import type { StructuredReview } from "../types/review-finding";
import { chunkPrFiles } from "../utils/chunk-code";
import { formatPrFilesForReview } from "./pr-files";
import { generateReview } from "./generate-review";

const MAX_SINGLE_REVIEW_CHARS = 48_000;

type ChunkedReviewInput = {
  repoFullName: string;
  title: string;
  prNumber: number;
  files: PrFile[];
  incremental?: boolean;
  context?: string;
  tone?: string;
  languageFocus?: string[];
  staticAnalysis?: string;
};

function dedupeFindings(
  findings: StructuredReview["findings"]
): StructuredReview["findings"] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.file}:${finding.line}:${finding.body}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export async function generateChunkedReview(
  input: ChunkedReviewInput
): Promise<StructuredReview> {
  const diff = formatPrFilesForReview(input.files);
  const totalSize = diff.length + (input.context?.length ?? 0);

  if (totalSize <= MAX_SINGLE_REVIEW_CHARS) {
    return generateReview({
      repoFullName: input.repoFullName,
      title: input.title,
      diff,
      incremental: input.incremental,
      context: input.context,
      tone: input.tone,
      languageFocus: input.languageFocus,
      staticAnalysis: input.staticAnalysis,
    });
  }

  const chunks = chunkPrFiles(input.prNumber, input.files);
  const allFindings: StructuredReview["findings"] = [];
  let summary = "";

  for (const chunk of chunks) {
    const chunkDiff = formatPrFilesForReview([
      { filePath: chunk.filePath, patch: chunk.text },
    ]);

    const review = await generateReview({
      repoFullName: input.repoFullName,
      title: input.title,
      diff: chunkDiff,
      incremental: input.incremental,
      context: input.context,
      tone: input.tone,
      languageFocus: input.languageFocus,
      staticAnalysis: input.staticAnalysis,
    });

    if (!summary) {
      summary = review.summary;
    }
    allFindings.push(...review.findings);
  }

  return {
    summary: summary || "Review completed across multiple diff chunks.",
    findings: dedupeFindings(allFindings),
  };
}
