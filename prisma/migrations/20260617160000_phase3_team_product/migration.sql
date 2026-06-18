-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "slackWebhookUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_member" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE INDEX "organization_member_userId_idx" ON "organization_member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_member_orgId_userId_key" ON "organization_member"("orgId", "userId");

-- Add organizationId column (nullable during backfill)
ALTER TABLE "provider_connection" ADD COLUMN "organizationId" TEXT;

-- Backfill: one default org per user that has provider connections
DO $$
DECLARE
    rec RECORD;
    new_org_id TEXT;
    base_slug TEXT;
    final_slug TEXT;
    slug_suffix INT;
BEGIN
    FOR rec IN
        SELECT DISTINCT pc."userId" AS uid, u."name", u."email"
        FROM "provider_connection" pc
        JOIN "user" u ON u."id" = pc."userId"
    LOOP
        new_org_id := 'org_' || substr(md5(random()::text || rec.uid), 1, 24);
        base_slug := lower(regexp_replace(coalesce(nullif(trim(rec.name), ''), split_part(rec.email, '@', 1)), '[^a-z0-9]+', '-', 'g'));
        IF base_slug = '' OR base_slug IS NULL THEN
            base_slug := 'workspace';
        END IF;
        final_slug := left(base_slug, 48);
        slug_suffix := 0;
        WHILE EXISTS (SELECT 1 FROM "organization" WHERE "slug" = final_slug) LOOP
            slug_suffix := slug_suffix + 1;
            final_slug := left(base_slug, 44) || '-' || slug_suffix::text;
        END LOOP;

        INSERT INTO "organization" ("id", "name", "slug", "createdAt", "updatedAt")
        VALUES (
            new_org_id,
            coalesce(nullif(trim(rec.name), ''), split_part(rec.email, '@', 1)) || '''s workspace',
            final_slug,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );

        INSERT INTO "organization_member" ("id", "orgId", "userId", "role", "createdAt")
        VALUES (
            'mbr_' || substr(md5(random()::text || rec.uid), 1, 24),
            new_org_id,
            rec.uid,
            'owner',
            CURRENT_TIMESTAMP
        );

        UPDATE "provider_connection"
        SET "organizationId" = new_org_id
        WHERE "userId" = rec.uid;
    END LOOP;
END $$;

-- For any orphaned connections (shouldn't happen), assign a throwaway org
DO $$
DECLARE
    rec RECORD;
    new_org_id TEXT;
BEGIN
    FOR rec IN
        SELECT pc."id" AS connection_id, pc."userId" AS uid
        FROM "provider_connection" pc
        WHERE pc."organizationId" IS NULL
    LOOP
        new_org_id := 'org_' || substr(md5(random()::text || rec.connection_id), 1, 24);

        INSERT INTO "organization" ("id", "name", "slug", "createdAt", "updatedAt")
        VALUES (
            new_org_id,
            'Migrated workspace',
            'migrated-' || substr(md5(rec.connection_id), 1, 12),
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );

        IF rec.uid IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM "organization_member" WHERE "orgId" = new_org_id AND "userId" = rec.uid
        ) THEN
            INSERT INTO "organization_member" ("id", "orgId", "userId", "role", "createdAt")
            VALUES (
                'mbr_' || substr(md5(random()::text || rec.connection_id), 1, 24),
                new_org_id,
                rec.uid,
                'owner',
                CURRENT_TIMESTAMP
            );
        END IF;

        UPDATE "provider_connection"
        SET "organizationId" = new_org_id
        WHERE "id" = rec.connection_id;
    END LOOP;
END $$;

-- Make organizationId required
ALTER TABLE "provider_connection" ALTER COLUMN "organizationId" SET NOT NULL;

-- Drop old user-scoped unique index and foreign key
DROP INDEX IF EXISTS "provider_connection_userId_provider_key";
ALTER TABLE "provider_connection" DROP CONSTRAINT IF EXISTS "provider_connection_userId_fkey";
ALTER TABLE "provider_connection" DROP COLUMN "userId";

-- Create new unique index for org-scoped connections
CREATE UNIQUE INDEX "provider_connection_organizationId_provider_key" ON "provider_connection"("organizationId", "provider");

-- AddForeignKey
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_connection" ADD CONSTRAINT "provider_connection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
