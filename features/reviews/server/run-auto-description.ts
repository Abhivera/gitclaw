import { getProviderAdapter } from "@/features/git-providers/server/get-adapter";
import { getConnectionById } from "@/features/git-providers/server/connections";
import { filterFilesByConfig } from "@/features/config/server/filter-files";
import { loadRepositoryConfig } from "@/features/config/server/load-repo-config";
import { prisma } from "@/lib/db";
import type { AutoDescriptionJob } from "@/features/jobs/queue";
import { generatePrDescription } from "./generate-pr-description";

function isDescriptionEmpty(body: string | null): boolean {
  if (!body) {
    return true;
  }
  const trimmed = body.trim();
  return trimmed.length === 0 || trimmed === "_No description provided._";
}

export async function runAutoDescriptionPullRequest({
  pullRequestId,
}: AutoDescriptionJob) {
  const pullRequest = await prisma.pullRequest.findUnique({
    where: { id: pullRequestId },
  });

  if (!pullRequest) {
    throw new Error(`Pull request not found: ${pullRequestId}`);
  }

  const connection = await getConnectionById(pullRequest.connectionId);
  if (!connection) {
    throw new Error(`Connection not found: ${pullRequest.connectionId}`);
  }

  const adapter = getProviderAdapter(pullRequest.provider);
  const prRecord = {
    id: pullRequest.id,
    provider: pullRequest.provider,
    connectionId: pullRequest.connectionId,
    repoFullName: pullRequest.repoFullName,
    prNumber: pullRequest.prNumber,
    projectExternalId: pullRequest.projectExternalId,
    headSha: pullRequest.headSha,
    baseBranch: pullRequest.baseBranch,
  };

  const existingBody = await adapter.getPullRequestBody(connection, prRecord);

  if (!isDescriptionEmpty(existingBody)) {
    return { pullRequestId, skipped: "description_exists" };
  }

  const repository = pullRequest.repositoryId
    ? await prisma.repository.findUnique({
        where: { id: pullRequest.repositoryId },
      })
    : null;

  const config = repository
    ? await loadRepositoryConfig(connection, repository)
    : (await import("@/features/config/types/gitclaw-config"))
        .DEFAULT_GITCLAW_CONFIG;

  if (!config.auto_description) {
    return { pullRequestId, skipped: "disabled_in_config" };
  }

  const rawFiles = await adapter.getPullRequestFiles(connection, prRecord);
  const files = filterFilesByConfig(rawFiles, config);

  if (files.length === 0) {
    return { pullRequestId, skipped: "no_files" };
  }

  const description = await generatePrDescription({
    repoFullName: pullRequest.repoFullName,
    title: pullRequest.title,
    files,
  });

  await adapter.updatePullRequestDescription(connection, prRecord, description);

  return { pullRequestId, generated: true };
}
