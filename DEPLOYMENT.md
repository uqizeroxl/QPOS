# QPOS Production Deployment

## Prerequisites

- Docker Engine with Docker Compose v2.
- A Linux host with persistent storage and sufficient PostgreSQL capacity.
- A DNS name and TLS termination at a load balancer or HTTPS reverse proxy.

## First deployment

1. Copy `.env.production.example` to `.env.production`.
2. Replace every placeholder password and secret. Use a random `JWT_SECRET` of at least 32 characters.
3. Keep `DEFAULT_OWNER_PASSWORD` secret. It is used only when the first tenant has no users.
4. Validate and start the stack:

   ```sh
   docker compose --env-file .env.production -f docker-compose.production.yml config
   docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
   docker compose --env-file .env.production -f docker-compose.production.yml ps
   ```

5. Open the configured HTTP port and log in with `DEFAULT_OWNER_USERNAME` and `DEFAULT_OWNER_PASSWORD`. Change deployment credentials after the initial account is established.

The startup jobs apply the master and default-tenant migrations before bootstrap and application startup. They are safe to run again. The public nginx service routes `/api/*` to the backend and all other paths to the frontend.

## Deploying an update

```sh
docker compose --env-file .env.production -f docker-compose.production.yml build
docker compose --env-file .env.production -f docker-compose.production.yml up -d
docker compose --env-file .env.production -f docker-compose.production.yml ps
```

Review migration SQL before deployment and take a database backup first. For additional tenant databases, run `prisma migrate deploy` once for each registry `databaseUrl`; the Compose migration job covers only the default tenant configured by `POSTGRES_TENANT_DB`.

## Health and logs

```sh
curl --fail http://localhost/
docker compose --env-file .env.production -f docker-compose.production.yml logs --tail=200 backend nginx postgres
```

Do not expose PostgreSQL publicly. Terminate TLS before port 80 or extend `nginx/nginx.conf` with managed certificates. Restrict `.env.production` permissions and never commit it.

## Backup

Back up the master registry and every tenant database. A master-only backup is not sufficient because transactions and stock live in tenant databases.

```sh
mkdir -p backups
docker compose --env-file .env.production -f docker-compose.production.yml exec -T postgres \
  pg_dump -U qpos -Fc qpos_master > backups/qpos_master.dump
docker compose --env-file .env.production -f docker-compose.production.yml exec -T postgres \
  pg_dump -U qpos -Fc qpos_tenant > backups/qpos_tenant.dump
```

Replace database names and user when production values differ. Encrypt backups, copy them off-host, define retention, and regularly test restoration.

## Restore

Stop application writes, restore tenant databases first, then restore the master registry so its tenant connection records point to available databases:

```sh
docker compose --env-file .env.production -f docker-compose.production.yml stop nginx backend
docker compose --env-file .env.production -f docker-compose.production.yml exec -T postgres \
  pg_restore -U qpos --clean --if-exists -d qpos_tenant < backups/qpos_tenant.dump
docker compose --env-file .env.production -f docker-compose.production.yml exec -T postgres \
  pg_restore -U qpos --clean --if-exists -d qpos_master < backups/qpos_master.dump
docker compose --env-file .env.production -f docker-compose.production.yml up -d
```

After restoration, verify login, product listing, dashboard, reports, and a controlled checkout. Confirm that a repeated checkout using the same `Idempotency-Key` returns the same transaction and deducts stock only once.

## Checkout idempotency

Clients may send a unique `Idempotency-Key` header on `POST /api/transactions`. Retrying the identical payload with the same key returns the original successful transaction. Reusing that key for a different payload returns HTTP 409. Calls without the header retain the legacy behavior.
