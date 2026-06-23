-- DropIndex
DROP INDEX "pull_request_provider_repoFullName_prNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "pull_request_connectionId_repoFullName_prNumber_key" ON "pull_request"("connectionId", "repoFullName", "prNumber");
