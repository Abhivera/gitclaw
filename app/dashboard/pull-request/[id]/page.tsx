import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { MarkdownContent } from "@/features/dashboard/components/markdown-content";
import { PullRequestStatusSection } from "@/features/dashboard/components/pull-request-status-section";
import { SeverityBadge } from "@/features/dashboard/components/severity-badge";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { getPullRequestDetail } from "@/features/dashboard/server/queries";
import { getPullRequestUrl } from "@/features/git-providers/lib/pr-url";
import type { ReviewFinding } from "@/features/reviews/types/review-finding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Pull request · Dashboard",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

const PullRequestDetailPage = async ({ params }: PageProps) => {
  const { id } = await params;
  const pullRequest = await getPullRequestDetail(id);

  if (!pullRequest) {
    notFound();
  }

  const findings = (pullRequest.reviewFindings as ReviewFinding[] | null) ?? [];
  const sortedFindings = [...findings].sort((a, b) => {
    if (a.severity === b.severity) {
      return 0;
    }
    return a.severity === "issue" ? -1 : 1;
  });
  const hostUrl = getPullRequestUrl(
    pullRequest.provider,
    pullRequest.repoFullName,
    pullRequest.prNumber
  );

  return (
    <>
      <DashboardHeader
        title={`#${pullRequest.prNumber} ${pullRequest.title}`}
        description={pullRequest.repoFullName}
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <PullRequestStatusSection
            key={pullRequest.status}
            pullRequestId={pullRequest.id}
            initialStatus={pullRequest.status}
          />
          <span className="text-sm text-muted-foreground capitalize">
            {pullRequest.provider}
          </span>
          {pullRequest.authorLogin ? (
            <span className="text-sm text-muted-foreground">
              by {pullRequest.authorLogin}
            </span>
          ) : null}
          <a
            href={hostUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline"
          >
            Open on git host
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Head SHA</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="text-xs">{pullRequest.headSha.slice(0, 12)}</code>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Review runs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {pullRequest.reviewRunCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Last reviewed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {pullRequest.reviewedAt
                  ? format(pullRequest.reviewedAt, "PPp")
                  : "Not yet reviewed"}
              </p>
            </CardContent>
          </Card>
        </div>

        {pullRequest.skipReason ? (
          <Card>
            <CardHeader>
              <CardTitle>Skipped</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Reason: {pullRequest.skipReason.replace(/_/g, " ")}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {pullRequest.reviewComment ? (
          <Card>
            <CardHeader>
              <CardTitle>Review summary</CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownContent content={pullRequest.reviewComment} />
            </CardContent>
          </Card>
        ) : null}

        {sortedFindings.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Findings ({sortedFindings.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sortedFindings.map((finding, index) => (
                <div
                  key={`${finding.file}-${finding.line}-${index}`}
                  className="rounded-md border border-border p-3"
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <SeverityBadge severity={finding.severity} />
                    <code className="text-xs text-muted-foreground">
                      {finding.file}:{finding.line}
                    </code>
                  </div>
                  <p className="mt-2 text-sm">{finding.body}</p>
                  {finding.suggestion ? (
                    <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-xs">
                      {finding.suggestion}
                    </pre>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Link
          href={DASHBOARD_ROUTES.pullRequest}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to pull requests
        </Link>
      </div>
    </>
  );
};

export default PullRequestDetailPage;
