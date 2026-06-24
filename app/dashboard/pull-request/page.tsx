import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { Pagination } from "@/features/dashboard/components/pagination";
import { PullRequestFilters } from "@/features/dashboard/components/pull-request-filters";
import { PrStatusBadge } from "@/features/dashboard/components/pr-status-badge";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { parsePageParam } from "@/features/dashboard/lib/pagination";
import {
  getDashboardPullRequests,
  getPullRequestRepoOptions,
} from "@/features/dashboard/server/queries";
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
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Pull requests · Dashboard",
};

type SearchParams = Promise<{ status?: string; repo?: string; page?: string }>;

const PullRequestsPage = async ({
  searchParams,
}: {
  searchParams: SearchParams;
}) => {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const [pullRequestData, repos] = await Promise.all([
    getDashboardPullRequests({
      status: params.status,
      repo: params.repo,
      page,
    }),
    getPullRequestRepoOptions(),
  ]);

  const { items: pullRequests, total, totalPages, page: currentPage } =
    pullRequestData;
  const hasFilters = Boolean(params.status || params.repo);

  return (
    <>
      <DashboardHeader
        title="Pull requests"
        description="Review history across all connected repositories."
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Suspense fallback={null}>
          <PullRequestFilters
            repos={repos}
            currentStatus={params.status ?? ""}
            currentRepo={params.repo ?? ""}
          />
        </Suspense>

        {pullRequests.length === 0 ? (
          <EmptyState
            title={hasFilters ? "No matching pull requests" : "No pull requests yet"}
            description={
              hasFilters
                ? "Try adjusting your filters to see more results."
                : "Connect a git provider and open a pull request to start receiving AI reviews."
            }
            action={
              hasFilters
                ? undefined
                : {
                    label: "Connect a provider",
                    href: DASHBOARD_ROUTES.integrations,
                  }
            }
          />
        ) : (
          <>
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
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              total={total}
              basePath={DASHBOARD_ROUTES.pullRequest}
              searchParams={{
                status: params.status,
                repo: params.repo,
              }}
            />
          </>
        )}
      </div>
    </>
  );
};

export default PullRequestsPage;
