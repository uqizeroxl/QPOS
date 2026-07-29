#!/bin/sh
set -e

echo "=== QPOS Server Entrypoint ==="

echo "[1/3] Running master database migrations..."
npx prisma migrate deploy --config prisma.master.config.ts

echo "[2/3] Running tenant database migrations..."
npx prisma migrate deploy --config prisma.config.ts

echo "[3/3] Bootstrapping default store..."
node dist/scripts/bootstrap-master-default-store.js

echo "Starting server..."
exec node dist/server.js
