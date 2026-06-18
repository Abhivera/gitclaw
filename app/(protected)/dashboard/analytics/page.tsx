import { requireAuth } from "@/features/auth/actions";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { getReviewAnalytics } from "@/features/analytics/server/queries";
import { ReviewsPerWeekChart } from "@/features/analytics/components/reviews-chart";
import { SeverityChart } from "@/features/analytics/components/severity-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics · Dashboard",
};

function formatDuration(ms: number): string {
  if (ms < 60_000) {
    return `${Math.round(ms / 1000)}s`;
  }
  if (ms < 3_600_000) {
    return `${Math.round(ms / 60_000)}m`;
  }
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

const AnalyticsPage = async () => {
  const session = await requireAuth();
  const analytics = await getReviewAnalytics(session.user.id);

  return (
    <>
      <DashboardHeader
        title="Analytics"
        description="Review activity, findings, and performance across your workspace."
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{analytics.totalReviews}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total findings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{analytics.totalFindings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Avg. time to review</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {analytics.avgTimeToFirstReviewMs
                  ? formatDuration(analytics.avgTimeToFirstReviewMs)
                  : "—"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Reviews per week</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.totalReviews === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No reviews yet. Analytics will appear after your first PR
                  review completes.
                </p>
              ) : (
                <ReviewsPerWeekChart data={analytics.reviewsPerWeek} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Findings by severity</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.totalFindings === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No findings recorded yet.
                </p>
              ) : (
                <SeverityChart data={analytics.issuesBySeverity} />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Most-flagged files</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topFlaggedFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No file-level data yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead className="text-right">Findings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topFlaggedFiles.map((row) => (
                    <TableRow key={row.file}>
                      <TableCell className="font-mono text-sm">
                        {row.file}
                      </TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AnalyticsPage;
