-- Remove columns left over from the old auth stack
ALTER TABLE "user" DROP COLUMN IF EXISTS "emailVerified";
ALTER TABLE "user" DROP COLUMN IF EXISTS "image";
