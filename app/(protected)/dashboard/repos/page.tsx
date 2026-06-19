import { requireAuth } from "@/features/auth/actions";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { Pagination } from "@/features/dashboard/components/pagination";
import { RepoEnableToggle } from "@/features/dashboard/components/repo-enable-toggle";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { parsePageParam } from "@/features/dashboard/lib/pagination";
import { getDashboardRepositories } from "@/features/dashboard/server/queries";
import { Badge } from "@/components/ui/badge";
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
  title: "Repositories · Dashboard",
};

type SearchParams = Promise<{ page?: string }>;

const RepositoriesPage = async ({
  searchParams,
}: {
  searchParams: SearchParams;
}) => {
  const session = await requireAuth();
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const { items: repositories, total, totalPages, page: currentPage } =
    await getDashboardRepositories(session.user.id, page);

  return (
    <>
      <DashboardHeader
        title="Repositories"
        description="Synced repositories from your connected providers. Toggle reviews per repo."
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {repositories.length === 0 ? (
          <EmptyState
            title="No repositories synced"
            description="Repositories appear after your first pull request webhook or when listed from your connected provider."
            action={{
              label: "Set up integrations",
              href: DASHBOARD_ROUTES.integrations,
            }}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Default branch</TableHead>
                  <TableHead>Config</TableHead>
                  <TableHead>PRs</TableHead>
                  <TableHead>Reviews</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repositories.map((repo) => (
                  <TableRow key={repo.id}>
                    <TableCell className="font-medium">{repo.fullName}</TableCell>
                    <TableCell className="capitalize">{repo.provider}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {repo.defaultBranch ?? "—"}
                    </TableCell>
                    <TableCell>
                      {repo.configSha ? (
                        <Badge variant="outline">.gitclaw.yaml</Badge>
                      ) : (
                        <span className="text-muted-foreground">Default</span>
                      )}
                    </TableCell>
                    <TableCell>{repo._count.pullRequests}</TableCell>
                    <TableCell>
                      <RepoEnableToggle
                        repositoryId={repo.id}
                        enabled={repo.enabled}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              total={total}
              basePath={DASHBOARD_ROUTES.repos}
            />
          </>
        )}
      </div>
    </>
  );
};

export default RepositoriesPage;
