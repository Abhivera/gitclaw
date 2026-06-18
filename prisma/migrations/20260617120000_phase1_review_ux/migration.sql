-- incremental reviews, structured findings, review gating
ALTER TABLE "pull_request" ADD COLUMN "reviewFindings" JSONB;
ALTER TABLE "pull_request" ADD COLUMN "lastReviewedSha" TEXT;
ALTER TABLE "pull_request" ADD COLUMN "reviewRunCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "pull_request" ADD COLUMN "skipReason" TEXT;
