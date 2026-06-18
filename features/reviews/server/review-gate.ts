export type SkipReason =
  | "draft"
  | "skip_review_title"
  | "duplicate_sha"
  | "bot_author"
  | "repo_disabled"
  | "reviews_disabled";

const BOT_LOGIN_PATTERNS = [
  /\[bot\]$/i,
  /-bot$/i,
  /^dependabot/i,
  /^renovate/i,
  /^github-actions/i,
  /^gitlab-bot/i,
  /^bitbucket-pipelines/i,
];

const SKIP_REVIEW_PATTERN = /\[skip\s*review\]/i;

export function isBotAuthor(authorLogin: string | null): boolean {
  if (!authorLogin) {
    return false;
  }
  return BOT_LOGIN_PATTERNS.some((pattern) => pattern.test(authorLogin));
}

export function shouldSkipReview(params: {
  title: string;
  authorLogin: string | null;
  headSha: string;
  isDraft: boolean;
  lastReviewedSha: string | null;
  repoEnabled?: boolean;
  reviewsEnabled?: boolean;
}): { skip: boolean; reason?: SkipReason } {
  if (params.repoEnabled === false) {
    return { skip: true, reason: "repo_disabled" };
  }

  if (params.reviewsEnabled === false) {
    return { skip: true, reason: "reviews_disabled" };
  }

  if (params.isDraft) {
    return { skip: true, reason: "draft" };
  }

  if (SKIP_REVIEW_PATTERN.test(params.title)) {
    return { skip: true, reason: "skip_review_title" };
  }

  if (isBotAuthor(params.authorLogin)) {
    return { skip: true, reason: "bot_author" };
  }

  if (
    params.lastReviewedSha &&
    params.lastReviewedSha === params.headSha
  ) {
    return { skip: true, reason: "duplicate_sha" };
  }

  return { skip: false };
}
