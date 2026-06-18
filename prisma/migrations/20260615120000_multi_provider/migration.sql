-- CreateEnum
CREATE TYPE "GitProvider" AS ENUM ('github', 'gitlab', 'bitbucket');

-- CreateTable
CREATE TABLE "provider_connection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "GitProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "accountLogin" TEXT,
    "accountType" TEXT,
    "webhookSecret" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_connection_pkey" PRIMARY KEY ("id")
);

-- Migrate GitHub installations into provider_connection
INSERT INTO "provider_connection" (
    "id",
    "userId",
    "provider",
    "externalId",
    "accountLogin",
    "accountType",
    "webhookSecret",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "userId",
    'github'::"GitProvider",
    "installationId"::TEXT,
    "accountLogin",
    "accountType",
    "id",
    "createdAt",
    "updatedAt"
FROM "github_installation";

-- Add new columns to pull_request
ALTER TABLE "pull_request" ADD COLUMN "provider" "GitProvider" NOT NULL DEFAULT 'github';
ALTER TABLE "pull_request" ADD COLUMN "connectionId" TEXT;
ALTER TABLE "pull_request" ADD COLUMN "projectExternalId" TEXT;

-- Link existing PRs to their provider connections
UPDATE "pull_request" pr
SET "connectionId" = pc."id"
FROM "provider_connection" pc
WHERE pc."provider" = 'github'
  AND pc."externalId" = pr."installationId"::TEXT;

-- For PRs without a matching connection, create orphan connections is not possible;
-- delete PRs that cannot be linked (shouldn't exist in normal operation)
DELETE FROM "pull_request" WHERE "connectionId" IS NULL;

ALTER TABLE "pull_request" ALTER COLUMN "connectionId" SET NOT NULL;
ALTER TABLE "pull_request" DROP COLUMN "installationId";

-- Drop old unique constraint and add provider-aware one
DROP INDEX IF EXISTS "pull_request_repoFullName_prNumber_key";
CREATE UNIQUE INDEX "pull_request_provider_repoFullName_prNumber_key" ON "pull_request"("provider", "repoFullName", "prNumber");

-- AddForeignKey
ALTER TABLE "provider_connection" ADD CONSTRAINT "provider_connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pull_request" ADD CONSTRAINT "pull_request_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "provider_connection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "provider_connection_userId_provider_key" ON "provider_connection"("userId", "provider");
CREATE UNIQUE INDEX "provider_connection_provider_externalId_key" ON "provider_connection"("provider", "externalId");

-- DropTable
DROP TABLE "github_installation";
