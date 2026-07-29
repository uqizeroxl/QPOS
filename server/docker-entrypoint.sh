#!/bin/sh
set -e

echo "=== QPOS Server Entrypoint ==="

echo "[1/5] Running master database migrations..."
npx prisma migrate deploy --config prisma.master.config.ts

echo "[2/5] Syncing master database schema..."
npx prisma db push --config prisma.master.config.ts

echo "[3/5] Running tenant database migrations..."
npx prisma migrate deploy --config prisma.config.ts

echo "[4/5] Syncing tenant database schema..."
npx prisma db push --config prisma.config.ts

echo "[5/5] Bootstrapping default store..."
node dist/scripts/bootstrap-master-default-store.js

echo "Starting server..."
exec node dist/server.js
