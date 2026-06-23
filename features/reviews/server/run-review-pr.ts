import { getProviderAdapter } from "@/features/git-providers/server/get-adapter";
import { getConnectionById } from "@/features/git-providers/server/connections";
import { filterFilesByConfig } from "@/features/config/server/filter-files";
import { loadRepositoryConfig } from "@/features/config/server/load-repo-config";
import { prisma } from "@/lib/db";
import type { PrReceivedJob } from "@/features/jobs/queue";
import { formatPrFilesForReview } from "./pr-files";
import {
  filterFindingsToDiff,
  formatReviewSummary,
} from "./post-inline-review";
import { generateChunkedReview } from "./generate-chunked-review";
import { fetchReviewContext } from "./fetch-review-context";
import { getOrganizationForConnection } from "@/features/organizations/server/org";
import { sendSlackReviewNotification } from "@/features/notifications/server/slack";
import {
  runStaticAnalysis,
  formatStaticAnalysisForPrompt,
} from "@/features/static-analysis/server/run-static-analysis";

function toPullRequestRecord(pullRequest: {
  id: string;
  provider: "github" | "gitlab" | "bitbucket";
  connectionId: string;
  repoFullName: string;
  prNumber: number;
  projectExternalId: string | null;
  headSha: string;
  baseBranch: string;
}) {
  return {
    id: pullRequest.id,
    provider: pullRequest.provider,
    connectionId: pullRequest.connectionId,
    repoFullName: pullRequest.repoFullName,
    prNumber: pullRequest.prNumber,
    projectExternalId: pullRequest.projectExternalId,
    headSha: pullRequest.headSha,
    baseBranch: pullRequest.baseBranch,
  };
}

async function postReviewWithConfig(
  adapter: ReturnType<typeof getProviderAdapter>,
  connection: NonNullable<Awaited<ReturnType<typeof getConnectionById>>>,
  prRecord: ReturnType<typeof toPullRequestRecord>,
  review: Awaited<ReturnType<typeof generateChunkedReview>>,
  findings: Awaited<ReturnType<typeof filterFindingsToDiff>>,
  config: Awaited<ReturnType<typeof loadRepositoryConfig>>
) {
  const postSummary = config.reviews.post_summary;
  const postInline = config.reviews.post_inline;

  if (!postSummary && !postInline) {
    return;
  }

  if (postInline && findings.length > 0) {
    const reviewToPost = postSummary
      ? review
      : { ...review, summary: "", findings: review.findings };
    await adapter.postReview(
      connection,
      prRecord,
      reviewToPost,
      postInline ? findings : []
    );
    return;
  }

  if (postSummary) {
    const summary = formatReviewSummary(review);
    await adapter.postPullRequestComment(connection, prRecord, summary);
  }
}

export async function runReviewPullRequest({ pullRequestId }: PrReceivedJob) {
  const pullRequest = await prisma.pullRequest.update({
    where: { id: pullRequestId },
    data: { status: "processing" },
  });

  try {
    const connection = await getConnectionById(pullRequest.connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${pullRequest.connectionId}`);
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

    const adapter = getProviderAdapter(pullRequest.provider);
    const prRecord = toPullRequestRecord(pullRequest);
    const useIncremental =
      config.reviews.incremental && Boolean(pullRequest.lastReviewedSha);

    try {
      await adapter.setCommitStatus(connection, prRecord, {
        state: "pending",
        description: "GitClaw review in progress",
      });
    } catch (error) {
      console.warn("[gitclaw] failed to set pending status", error);
    }

    const rawFiles = await adapter.getPullRequestFiles(connection, prRecord, {
      sinceSha: useIncremental
        ? (pullRequest.lastReviewedSha ?? undefined)
        : undefined,
    });
    const files = filterFilesByConfig(rawFiles, config);

    const diff = formatPrFilesForReview(files);

    if (!diff.trim()) {
      await prisma.pullRequest.update({
        where: { id: pullRequestId },
        data: {
          status: "reviewed",
          lastReviewedSha: pullRequest.headSha,
          reviewRunCount: { increment: 1 },
          reviewedAt: new Date(),
        },
      });

      try {
        await adapter.setCommitStatus(connection, prRecord, {
          state: "success",
          description: "No reviewable code changes",
        });
      } catch {
        /* ignore */
      }

      return { pullRequestId, status: "reviewed", reason: "no code to review" };
    }

    const context = await fetchReviewContext({
      provider: pullRequest.provider,
      connection,
      repoFullName: pullRequest.repoFullName,
      baseBranch: pullRequest.baseBranch,
      files,
      config,
    });

    const staticAnalysisPrompt = formatStaticAnalysisForPrompt(
      runStaticAnalysis(files, config)
    );

    const review = await generateChunkedReview({
      repoFullName: pullRequest.repoFullName,
      title: pullRequest.title,
      prNumber: pullRequest.prNumber,
      files,
      incremental: useIncremental,
      context,
      tone: config.tone,
      languageFocus: config.language_focus,
      staticAnalysis: staticAnalysisPrompt,
    });

    const findings = filterFindingsToDiff(review.findings, files);
    const summary = formatReviewSummary({ ...review, findings });

    await postReviewWithConfig(
      adapter,
      connection,
      prRecord,
      review,
      findings,
      config
    );

    const hasIssues = findings.some((f) => f.severity === "issue");

    await prisma.pullRequest.update({
      where: { id: pullRequestId },
      data: {
        status: "reviewed",
        reviewComment: summary,
        reviewFindings: findings,
        lastReviewedSha: pullRequest.headSha,
        reviewRunCount: { increment: 1 },
        reviewedAt: new Date(),
      },
    });

    const organization = await getOrganizationForConnection(
      pullRequest.connectionId
    );
    if (organization?.slackWebhookUrl) {
      try {
        await sendSlackReviewNotification({
          webhookUrl: organization.slackWebhookUrl,
          repoFullName: pullRequest.repoFullName,
          prNumber: pullRequest.prNumber,
          title: pullRequest.title,
          provider: pullRequest.provider,
          findingCount: findings.length,
          issueCount: findings.filter((finding) => finding.severity === "issue")
            .length,
          pullRequestId,
        });
      } catch (error) {
        console.warn("[gitclaw] failed to send Slack notification", error);
      }
    }

    try {
      await adapter.setCommitStatus(connection, prRecord, {
        state: hasIssues ? "failure" : "success",
        description: hasIssues
          ? `Found ${findings.filter((f) => f.severity === "issue").length} issue(s)`
          : "Review passed — no issues found",
      });
    } catch {
      /* ignore */
    }

    return {
      pullRequestId,
      status: "reviewed",
      findingCount: findings.length,
      incremental: useIncremental,
    };
  } catch (error) {
    console.error("[gitclaw] review job failed", { pullRequestId, error });

    await prisma.pullRequest.update({
      where: { id: pullRequestId },
      data: { status: "failed" },
    });

    try {
      const connection = await getConnectionById(pullRequest.connectionId);
      if (connection) {
        const adapter = getProviderAdapter(pullRequest.provider);
        await adapter.setCommitStatus(
          connection,
          toPullRequestRecord(pullRequest),
          {
            state: "failure",
            description: "GitClaw review failed",
          }
        );
      }
    } catch (statusError) {
      console.warn("[gitclaw] failed to set failure status", statusError);
    }

    throw error;
  }
}
