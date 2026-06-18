import { requireAuth } from "@/features/auth/actions";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { RepoEnableToggle } from "@/features/dashboard/components/repo-enable-toggle";
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

const RepositoriesPage = async () => {
  const session = await requireAuth();
  const repositories = await getDashboardRepositories(session.user.id);

  return (
    <>
      <DashboardHeader
        title="Repositories"
        description="Synced repositories from your connected providers. Toggle reviews per repo."
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {repositories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No repositories synced yet. Repositories appear after your first PR
            webhook or when listed from your provider.
          </p>
        ) : (
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
        )}
      </div>
    </>
  );
};

export default RepositoriesPage;
