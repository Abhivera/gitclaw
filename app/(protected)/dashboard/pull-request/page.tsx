import { requireAuth } from "@/features/auth/actions";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { PrStatusBadge } from "@/features/dashboard/components/pr-status-badge";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { getDashboardPullRequests } from "@/features/dashboard/server/queries";
import { getPullRequestUrl } from "@/features/git-providers/lib/pr-url";
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
  title: "Pull requests · Dashboard",
};

type SearchParams = Promise<{ status?: string; repo?: string }>;

const PullRequestsPage = async ({
  searchParams,
}: {
  searchParams: SearchParams;
}) => {
  const session = await requireAuth();
  const params = await searchParams;
  const pullRequests = await getDashboardPullRequests(session.user.id, {
    status: params.status,
    repo: params.repo,
  });

  return (
    <>
      <DashboardHeader
        title="Pull requests"
        description="Review history across all connected repositories."
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {pullRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pull requests recorded yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PR</TableHead>
                <TableHead>Repository</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Runs</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pullRequests.map((pr) => (
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
                  <TableCell className="text-muted-foreground">
                    {pr.authorLogin ?? "—"}
                  </TableCell>
                  <TableCell>
                    <PrStatusBadge status={pr.status} />
                  </TableCell>
                  <TableCell>{pr.reviewRunCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(pr.updatedAt, { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <a
                      href={getPullRequestUrl(
                        pr.provider,
                        pr.repoFullName,
                        pr.prNumber
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Open on host →
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
};

export default PullRequestsPage;
