#!/bin/sh
set -e

echo "[gitclaw] Applying database migrations..."
npx prisma migrate deploy

echo "[gitclaw] Starting server..."
exec npx next start -p "${PORT:-3000}"
