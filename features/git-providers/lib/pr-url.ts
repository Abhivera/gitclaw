import type { GitProvider } from "@/lib/generated/prisma/client";

export function getPullRequestUrl(
  provider: GitProvider,
  repoFullName: string,
  prNumber: number
): string {
  switch (provider) {
    case "github":
      return `https://github.com/${repoFullName}/pull/${prNumber}`;
    case "gitlab":
      return `https://gitlab.com/${repoFullName}/-/merge_requests/${prNumber}`;
    case "bitbucket":
      return `https://bitbucket.org/${repoFullName}/pull-requests/${prNumber}`;
  }
}
