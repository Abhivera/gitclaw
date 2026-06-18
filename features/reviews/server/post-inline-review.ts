import type { PrFile } from "../types/review";
import type { ReviewFinding, StructuredReview } from "../types/review-finding";

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

/** Keep only findings that reference files present in the diff. */
export function filterFindingsToDiff(
  findings: ReviewFinding[],
  files: PrFile[]
): ReviewFinding[] {
  const filePaths = new Set(files.map((file) => file.filePath));
  return findings.filter((finding) => filePaths.has(finding.file));
}
