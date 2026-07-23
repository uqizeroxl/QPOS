#!/bin/sh
set -eu

psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  --set=tenant_db="$POSTGRES_TENANT_DB" <<'SQL'
CREATE DATABASE :"tenant_db";
SQL
