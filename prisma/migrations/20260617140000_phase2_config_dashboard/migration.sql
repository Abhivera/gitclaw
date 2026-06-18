-- CreateTable
CREATE TABLE "repository" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "provider" "GitProvider" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultBranch" TEXT,
    "config" JSONB,
    "configSha" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repository_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "pull_request" ADD COLUMN "repositoryId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "repository_connectionId_fullName_key" ON "repository"("connectionId", "fullName");

-- AddForeignKey
ALTER TABLE "repository" ADD CONSTRAINT "repository_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "provider_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pull_request" ADD CONSTRAINT "pull_request_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;
