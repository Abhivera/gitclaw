import type { PrFile } from "../types/review";
import type { ReviewFinding, StructuredReview } from "../types/review-finding";
import { parseDiff } from "../utils/parse-diff";
import { safeAiOutput } from "@/features/ai/security";

export function formatFindingBody(finding: ReviewFinding): string {
  const icon = finding.severity === "issue" ? "🚨" : "💡";
  let body = `${icon} **${finding.severity === "issue" ? "Issue" : "Suggestion"}**\n\n${finding.body}`;

  if (finding.suggestion) {
    body += `\n\n**Suggested fix:**\n\`\`\`\n${finding.suggestion}\n\`\`\``;
  }

  return body;
}

export function formatReviewSummary(review: StructuredReview): string {
  const lines = ["## GitClaw Review", "", review.summary];

  if (review.findings.length === 0) {
    lines.push("", "No issues found. ✅");
    return lines.join("\n");
  }

  const issues = review.findings.filter((f) => f.severity === "issue");
  const suggestions = review.findings.filter((f) => f.severity === "suggestion");

  if (issues.length > 0) {
    lines.push("", `### 🚨 Issues (${issues.length})`);
    for (const finding of issues) {
      lines.push(`- \`${finding.file}:${finding.line}\` — ${finding.body}`);
    }
  }

  if (suggestions.length > 0) {
    lines.push("", `### 💡 Suggestions (${suggestions.length})`);
    for (const finding of suggestions) {
      lines.push(`- \`${finding.file}:${finding.line}\` — ${finding.body}`);
    }
  }

  lines.push("", "_See inline comments for details._");
  return lines.join("\n");
}

/** Validate locations and content before either storage or publication. */
export function filterFindingsToDiff(
  findings: ReviewFinding[],
  files: PrFile[]
): ReviewFinding[] {
  const locations = new Map(files.map((file) => [file.filePath,
    new Set(parseDiff(file.patch).map((entry) => entry.line))]));
  const seen = new Set<string>();
  return findings.filter((finding) => {
    if (!Number.isSafeInteger(finding.line) || !locations.get(finding.file)?.has(finding.line) ||
        !finding.body.trim() || finding.body.length > 8_000 ||
        (finding.suggestion?.length ?? 0) > 8_000) return false;
    const key = `${finding.file}:${finding.line}:${finding.body}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 100).map((finding) => ({ ...finding,
    body: safeAiOutput(finding.body),
    ...(finding.suggestion ? { suggestion: safeAiOutput(finding.suggestion) } : {}),
  }));
}
