import { prisma } from "@/lib/db";
import type { ReviewFinding } from "@/features/reviews/types/review-finding";
import { getOrgConnectionIds } from "@/features/organizations/server/org";
import { subWeeks, startOfWeek, format } from "date-fns";

export type ReviewsPerWeek = {
  week: string;
  count: number;
};

export type SeverityBreakdown = {
  severity: string;
  count: number;
};

export type TopFlaggedFile = {
  file: string;
  count: number;
};

export type ReviewAnalytics = {
  reviewsPerWeek: ReviewsPerWeek[];
  issuesBySeverity: SeverityBreakdown[];
  topFlaggedFiles: TopFlaggedFile[];
  avgTimeToFirstReviewMs: number | null;
  totalReviews: number;
  totalFindings: number;
};

function aggregateFindings(
  reviewFindings: unknown
): { issues: number; suggestions: number; files: Map<string, number> } {
  const files = new Map<string, number>();
  let issues = 0;
  let suggestions = 0;

  const findings = reviewFindings as ReviewFinding[] | null;
  if (!Array.isArray(findings)) {
    return { issues, suggestions, files };
  }

  for (const finding of findings) {
    if (finding.severity === "issue") {
      issues++;
    } else {
      suggestions++;
    }
    files.set(finding.file, (files.get(finding.file) ?? 0) + 1);
  }

  return { issues, suggestions, files };
}

export async function getReviewAnalytics(): Promise<ReviewAnalytics> {
  const { connectionIds } = await getOrgConnectionIds();

  const reviewedPrs = await prisma.pullRequest.findMany({
    where: {
      connectionId: { in: connectionIds },
      status: "reviewed",
      reviewedAt: { not: null },
    },
    select: {
      reviewedAt: true,
      createdAt: true,
      reviewFindings: true,
    },
    orderBy: { reviewedAt: "desc" },
  });

  const weekBuckets = new Map<string, number>();
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    weekBuckets.set(format(weekStart, "yyyy-MM-dd"), 0);
  }

  let totalIssues = 0;
  let totalSuggestions = 0;
  const fileCounts = new Map<string, number>();
  let totalLatencyMs = 0;
  let latencyCount = 0;

  for (const pr of reviewedPrs) {
    if (pr.reviewedAt) {
      const weekKey = format(
        startOfWeek(pr.reviewedAt, { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      );
      if (weekBuckets.has(weekKey)) {
        weekBuckets.set(weekKey, (weekBuckets.get(weekKey) ?? 0) + 1);
      }

      const latency = pr.reviewedAt.getTime() - pr.createdAt.getTime();
      if (latency > 0) {
        totalLatencyMs += latency;
        latencyCount++;
      }
    }

    const { issues, suggestions, files } = aggregateFindings(pr.reviewFindings);
    totalIssues += issues;
    totalSuggestions += suggestions;

    for (const [file, count] of files) {
      fileCounts.set(file, (fileCounts.get(file) ?? 0) + count);
    }
  }

  const reviewsPerWeek = Array.from(weekBuckets.entries()).map(
    ([week, count]) => ({
      week,
      count,
    })
  );

  const topFlaggedFiles = Array.from(fileCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([file, count]) => ({ file, count }));

  return {
    reviewsPerWeek,
    issuesBySeverity: [
      { severity: "issue", count: totalIssues },
      { severity: "suggestion", count: totalSuggestions },
    ],
    topFlaggedFiles,
    avgTimeToFirstReviewMs:
      latencyCount > 0 ? Math.round(totalLatencyMs / latencyCount) : null,
    totalReviews: reviewedPrs.length,
    totalFindings: totalIssues + totalSuggestions,
  };
}
