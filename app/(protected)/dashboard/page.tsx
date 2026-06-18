import { requireAuth } from "@/features/auth/actions";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { PrStatusBadge } from "@/features/dashboard/components/pr-status-badge";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { getDashboardOverview } from "@/features/dashboard/server/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Overview · Dashboard",
};

const DashboardPage = async () => {
  const session = await requireAuth();
  const overview = await getDashboardOverview(session.user.id);

  return (
    <>
      <DashboardHeader
        title="Overview"
        description="Review activity and connection status across your integrations."
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Reviews completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{overview.reviewCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>In progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{overview.pendingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {overview.connectionCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent pull requests</CardTitle>
            <Link
              href={DASHBOARD_ROUTES.pullRequest}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {overview.recentPrs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pull requests yet. Connect a provider and open a PR to get
                started.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PR</TableHead>
                    <TableHead>Repository</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.recentPrs.map((pr) => (
                    <TableRow key={pr.id}>
                      <TableCell>
                        <Link
                          href={`${DASHBOARD_ROUTES.pullRequest}/${pr.id}`}
                          className="font-medium hover:underline"
                        >
                          #{pr.prNumber} {pr.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {pr.repoFullName}
                      </TableCell>
                      <TableCell>
                        <PrStatusBadge status={pr.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(pr.updatedAt, { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connections</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.connections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No providers connected.{" "}
                <Link
                  href={DASHBOARD_ROUTES.integrations}
                  className="underline"
                >
                  Connect one
                </Link>
                .
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {overview.connections.map((connection) => (
                  <li key={connection.id} className="flex justify-between">
                    <span className="capitalize">{connection.provider}</span>
                    <span className="text-muted-foreground">
                      {connection.accountLogin ?? "Connected"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default DashboardPage;
