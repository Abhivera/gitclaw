-- Drop unused auth tables (sessions managed externally; app uses a single local user)
DROP TABLE IF EXISTS "session";
DROP TABLE IF EXISTS "account";
DROP TABLE IF EXISTS "verification";
