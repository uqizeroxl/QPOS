# QPOS — Project Analysis

## Overview

**QPOS** is a web-based Point of Sale (POS) / Retail Management System built with **React 19**, **TypeScript 6**, **Vite 8**, and **Tailwind CSS 4**. It targets small-to-medium retail businesses (minimarkets, convenience stores). The frontend is in `src/`, the backend (Express + Prisma, multi-tenant) is in `server/`.

## Project Structure

```
QPOS/
├── src/                          # Frontend (React 19 + Vite 8 + Tailwind CSS 4)
│   ├── types/                    # Unified type definitions (source of truth)
│   ├── pages/                    # Route-level page components
│   ├── contexts/                 # React Context providers + *ContextValue.ts
│   ├── hooks/                    # Custom hooks (one per domain)
│   ├── services/                 # API service layer (Axios)
│   ├── components/               # Reusable UI components
│   ├── constants/                # App constants, API config, routes
│   ├── utils/                    # Utility functions
│   ├── i18n/                     # Internationalization (id/en)
│   ├── routes/                   # React Router setup
│   └── layouts/                  # Layout components
├── server/                       # Backend (Express.js + Prisma + PostgreSQL)
│   ├── prisma/                   # Prisma schemas + migrations
│   │   ├── schema.prisma         # Tenant/store schema (12 models)
│   │   └── master/schema.prisma  # Master DB schema (multi-tenant)
│   ├── src/
│   │   ├── controllers/          # Route handlers
│   │   ├── services/             # Business logic
│   │   ├── routes/               # Express routes
│   │   ├── middleware/           # Auth, error handling
│   │   └── generated/            # Auto-generated Prisma client
│   └── scripts/                  # PDF generation (Python reportlab)
├── package.json                  # Root scripts
└── docker-compose.yml            # PostgreSQL + server orchestration
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 6, Vite 8, Tailwind CSS 4, react-router-dom 7, Axios 1.18, lucide-react, i18next |
| Backend | Express.js 4, Prisma 7.8 (PostgreSQL), JWT auth (jsonwebtoken + bcryptjs), ExcelJS |
| Database | PostgreSQL 16 (multi-tenant via master DB + per-store databases) |
| Build | Vite 8 + @vitejs/plugin-react (SWC) |
| Linting | ESLint 10 + typescript-eslint |

## Shared Types (`src/types/`)

All domain types are defined in `src/types/` as the single source of truth, derived from the Prisma schema:

| File | Types |
|------|-------|
| `enums.ts` | `RecordStatus`, `ActivityType`, `UserRole`, `StockAdjustmentType`, `StockReferenceType`, `PurchaseOrderStatus`, `NotificationType`, `NotificationCategory` |
| `product.ts` | `Product`, `ProductFormValues`, `BulkProductDraft`, `BarcodeLabelSize/Settings/Payload`, `ProductApiItem` |
| `category.ts` | `Category`, `CategoryFormValues`, `CategoryApiItem` |
| `supplier.ts` | `Supplier`, `SupplierFormValues`, `SupplierApiItem` |
| `transaction.ts` | `TransactionListItem`, `TransactionApiResponse`, `CreateTransactionPayload`, `GetTransactionsParams` |
| `cashier.ts` | `CashierProduct`, `CartItem`, `TransactionItem`, `SalesTransaction` |
| `auth.ts` | `AuthUser`, `AuthPayload`, `LoginPayload`, `OAuthLoginResponse`, `OAuthRegistrationPayload`, `StoreInfo` |
| `settings.ts` | `AppSettings`, `defaultSettings` |
| `activity.ts` | `ActivityLogItem`, `AddActivityPayload` |
| `notification.ts` | `AppNotification`, `AddNotificationPayload` |
| `stock.ts` | `StockHistoryItem`, `StockAdjustmentPayload`, `RestockProductPayload`, `ProductDatasetPreview` |
| `dashboard.ts` | `DashboardData` |
| `report.ts` | `SalesReportData`, `SalesReportFilters`, `ProductDatasetResetResult`, `ReceiptFooterSettings` |
| `api.ts` | `ApiResponse<T>`, `PaginatedData<T>`, `PaginatedListResponse<T>`, `PaginationMeta`, `PaginationParams` |
| `index.ts` | Barrel export for all types |

## Routing (`src/routes/AppRoutes.tsx`)

- `/` — Login (public)
- `/dashboard`, `/product`, `/category`, `/supplier`, `/restock`, `/stock-history`, `/cashier`, `/barcode-labels`, `/transactions`, `/transactions/:id`, `/transaction-history`, `/report`, `/setting`, `/help`, `/notifications` — protected by `<ProtectedRoute />`
- `*` — NotFoundPage

## Auth

- Backend auth via JWT (master DB `accounts` table + `store_members`)
- Four roles: `OWNER`, `ADMIN`, `CASHIER`, `WAREHOUSE`
- Auth state persisted in localStorage (token + user)
- Multi-tenant: each store has its own database

## Backend Schema (Prisma)

### Master Database (`prisma/master/schema.prisma`)

| Model | Purpose |
|-------|---------|
| `Account` | Global user accounts |
| `Store` | Tenant store instances |
| `StoreMember` | Account ↔ Store mapping with role |
| `TenantDatabaseRegistry` | Per-store database URL + migration status |

### Tenant Database (`prisma/schema.prisma`)

| Model | Key Fields |
|-------|-----------|
| `Category` | name (unique), description, status |
| `Supplier` | name (unique), phone, email, address, notes, isActive |
| `Product` | barcode (optional), name, purchasePrice, sellingPrice, stock, categoryId FK, supplierId FK |
| `Transaction` | invoiceNumber, subtotal, discount, grandTotal, paidAmount, change, cashierName |
| `TransactionItem` | productId, productBarcode, productName, unitPrice, quantity |
| `PurchaseOrder` | poNumber, supplierId, status |
| `StockHistory` | productId, type (ADD/REDUCE/SET), quantity, previousStock, currentStock |
| `Settings` | storeName, phone, address, receiptFooter |
| `ActivityLog` | type, title, description, metadata (JSON) |
| `Notification` | title, type, category, isRead |
| `User` | username, passwordHash, role, isActive |

## Backend API Endpoints

| Mount | Auth | Key Endpoints |
|-------|------|---------------|
| `/api/auth` | Per-route | `POST /login`, `GET /profile`, `POST /logout` |
| `/api/categories` | OWNER/ADMIN/WAREHOUSE | Full CRUD |
| `/api/products` | Per-route | CRUD + `/restocks` + `/dataset/*` + `/barcode` + stock adjustments |
| `/api/suppliers` | OWNER/ADMIN/WAREHOUSE | Full CRUD |
| `/api/transactions` | OWNER/ADMIN/CASHIER | Create (idempotent) + list + detail + history reset |
| `/api/settings` | Per-route | Receipt footer + dataset reset |
| `/api/dashboard` | All roles | Stats, recent transactions, low stock, top products |
| `/api/reports` | OWNER/ADMIN | Sales reports (JSON, Excel, PDF) |

## Development Commands

```bash
npm run dev              # Start frontend dev server (Vite HMR)
npm run dev:server       # Start backend dev server (ts-node-dev)
npm run build            # Type-check + production build
npm run lint             # ESLint on all source files
npm run preview          # Preview production build
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run Prisma migrations
npm run seed             # Seed database with sample data
```

## Conventions

- **Types**: All in `src/types/`, imported by services, contexts, and pages
- Pages in `src/pages/` organized per-module folders
- Contexts in `src/contexts/` paired with a `*ContextValue.ts` file
- Hooks in `src/hooks/` mirror contexts (one hook per domain)
- Services in `src/services/` (one per domain, maps API responses to frontend types)
- Constants in `src/constants/`
- Utilities in `src/utils/`
- Backend follows controller → service → Prisma pattern
- Language: Indonesian throughout (UI labels, Rupiah currency)

## Deployment

### Frontend (Vercel)

- Hosted on **Vercel** at `https://www.qpos.shop`
- Configured via `vercel.json` (SPA rewrites + Vite framework)
- Build command: `npm run build` (Vite)
- Output: `dist/`

#### Environment Variables (Vercel)

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | `https://api.qpos.shop/api` | Backend API base URL. Inlined at build time by Vite. If missing, falls back to `VITE_API_BASE_URL`, then `/api`. |

**IMPORTANT**: Vite inlines `import.meta.env.*` at **build time**. If you change env vars on Vercel, you MUST trigger a new deployment for changes to take effect.

### Backend (VPS + Docker)

- Hosted on a **VPS** (Ubuntu) at `https://api.qpos.shop`
- Docker Compose orchestration (`docker-compose.yml` at project root)
- Two containers: `qpos-db` (PostgreSQL 16) + `qpos-server` (Express.js on Node 22)

#### Docker Services

| Service | Image | Port Mapping | Purpose |
|---------|-------|-------------|---------|
| `qpos-db` | `postgres:16-alpine` | `5433:5432` | PostgreSQL database (tenant + master) |
| `qpos-server` | Custom (multi-stage `server/Dockerfile`) | `8000:8000` | Express.js API server |

#### Environment Variables (Backend)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Express listen port (set to `8000` in docker-compose) |
| `NODE_ENV` | No | `development` | `production` enables combined Morgan logging |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string for tenant database |
| `MASTER_DATABASE_URL` | **Yes** | — | PostgreSQL connection string for master database |
| `JWT_SECRET` | **Yes** | `qpos-development-secret` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | No | `1d` | JWT token expiration |
| `DEFAULT_OWNER_USERNAME` | No | `owner` | Bootstrap: default owner username |
| `DEFAULT_OWNER_PASSWORD` | No | `owner123` | Bootstrap: default owner password |
| `DEFAULT_OWNER_NAME` | No | `Owner` | Bootstrap: default owner display name |
| `TRANSACTION_RETENTION_DAYS` | No | `14` | Days to keep transaction history |
| `CORS_ORIGIN` | No | — | Allowed CORS origin (`https://www.qpos.shop`) |

#### Database Architecture (Multi-Tenant)

**Dual-database model on a single PostgreSQL instance:**

1. **Master DB** (`qpos_master`) — accessed via `MASTER_DATABASE_URL`
   - `accounts` — Global user accounts
   - `stores` — Tenant store instances
   - `store_members` — Account ↔ Store mapping with role
   - `tenant_database_registries` — Maps stores to their database URLs

2. **Tenant DB** (`qpos`) — accessed via `DATABASE_URL`
   - All business tables: categories, suppliers, products, transactions, stock_histories, etc.
   - Each store has its own database (multi-tenant isolation)

**Runtime flow:** Auth middleware resolves `storeId` from JWT → `getStorePrisma(storeId)` looks up DB URL from master DB → creates cached PrismaClient for that store's DB.

#### Deployment Commands (VPS)

**Full setup (new deployment):**
```bash
cd ~/QPOS
sudo docker compose up -d --build
sudo docker compose run --rm qpos-server npx prisma migrate deploy --config prisma.master.config.ts
sudo docker compose run --rm qpos-server npx prisma migrate deploy --config prisma.config.ts
sudo docker compose exec qpos-server node dist/scripts/bootstrap-master-default-store.js
```

**Re-deploy after code changes:**
```bash
cd ~/QPOS
git pull
sudo docker compose up -d --build
```

**Run migrations after schema changes:**
```bash
# Master DB
sudo docker compose run --rm qpos-server npx prisma migrate deploy --config prisma.master.config.ts
# Tenant DB
sudo docker compose run --rm qpos-server npx prisma migrate deploy --config prisma.config.ts
```

**Reset tenant DB (WARNING: deletes all business data):**
```bash
sudo docker compose stop qpos-server
sudo docker compose exec -T qpos-db psql -U qpos -d postgres -c "DROP DATABASE qpos;"
sudo docker compose exec -T qpos-db psql -U qpos -d postgres -c "CREATE DATABASE qpos;"
sudo docker compose run --rm qpos-server npx prisma migrate deploy --config prisma.config.ts
sudo docker compose up -d
sudo docker compose exec qpos-server node dist/scripts/bootstrap-master-default-store.js
```

**Bootstrap default store + users:**
```bash
sudo docker compose exec qpos-server node dist/scripts/bootstrap-master-default-store.js
```
This creates a default OWNER user (`owner` / `owner123`) and registers the "Multazam" store in the master DB.

#### Dockerfile Details (`server/Dockerfile`)

Multi-stage build:
1. **Build stage** (`node:22-alpine`): `npm ci` → `prisma generate` (tenant + master) → `tsc`
2. **Runtime stage** (`node:22-alpine`): Python 3 + reportlab (for PDF generation) + compiled `dist/` + Prisma client + prisma schemas

**IMPORTANT**: Use `docker compose run` (not `exec`) for one-off commands like migrations when the server is stopped. `docker compose exec` requires the container to be running.

#### Reverse Proxy

- nginx serves the SPA frontend with `try_files $uri $uri/ /index.html`
- API proxy to backend is configured at infrastructure level (domain routing)
- Frontend `VITE_API_URL` points directly to `https://api.qpos.shop/api`

## Known Issues & Gotchas

### Column Casing (PostgreSQL + Prisma)

PostgreSQL folds unquoted identifiers to lowercase. Prisma quotes column names as camelCase. If tables are created with raw SQL without quoted identifiers, columns become lowercase (e.g., `passwordhash`) but Prisma queries for `"passwordHash"` (quoted camelCase), causing `ColumnNotFound` errors.

**Rule**: Always use Prisma migrations (`prisma migrate deploy`) to create/modify tables. Never create tables manually with unquoted SQL.

### Vite Env Vars at Build Time

`import.meta.env.VITE_*` values are inlined into the JavaScript bundle at build time. Changing env vars on Vercel without rebuilding won't affect the deployed app.

### `docker compose run` vs `docker compose exec`

- `docker compose run` — starts a **new one-off container** (use for migrations when server is stopped)
- `docker compose exec` — runs in the **already running** container (fails if container is stopped/crash-looping)

### Frontend API Configuration

- `src/constants/api.ts` reads: `VITE_API_URL` → `VITE_API_BASE_URL` → `/api` (fallback)
- `src/services/api/axiosInstance.ts` uses `API_BASE_URL` as the axios `baseURL`
- All API calls go through `apiService` or `axiosInstance` — no hardcoded URLs
- Auth token attached via axios request interceptor from `localStorage`
- 401 responses auto-clear auth from `localStorage`

### Lint Warnings (Pre-existing)

The ESLint config includes `react-hooks/set-state-in-effect` and `react-hooks/preserve-manual-memoization` rules from React Compiler. These produce ~19 warnings across the codebase but are safe to ignore — they are common patterns in React 19 codebases.

### TypeScript 6 Union Narrowing with `in` Operator

TypeScript 6.0 does not narrow `OAuthLoginResponse` (union of `AuthPayload | OAuthRegistrationPayload`) after a `"needsRegistration" in auth` guard with early return. The `in` type guard should exclude union members missing the property, but TS 6 fails to apply this narrowing. Workaround: use `as AuthPayload` assertions after the guard.

### Frontend Type Mismatches

- `SalesTransaction.transactionNumber` (frontend) maps from `Transaction.invoiceNumber` (backend API) — intentional alias
- `CategoryStatus` = `"Aktif" | "Nonaktif"` for display, `RecordStatus` = `"ACTIVE" | "INACTIVE"` for API payloads
- `ProductFormValues.status` is `ProductStatus` (`"Aktif"/"Nonaktif"`), must be converted to `RecordStatus` (`"ACTIVE"/"INACTIVE"`) before sending to API (done in `productService.ts:buildProductPayload`)
- `UserRole` values: `OWNER | ADMIN | CASHIER | WAREHOUSE` (uppercase)

### Commit History

- `b02e28d` — `refactor: consolidate pos-web and qpos-server into root project` (initial consolidation)
- `2db06b6` — `fix: resolve all TypeScript build errors from type consolidation`

### Session History

**2026-07-27 — Multi-store, OAuth, Toast refactor**

- Multi-store OWNER support: `GET /auth/stores`, `POST /auth/switch-store`, `StoreSwitcher` component in navbar
- Google OAuth login (`@react-oauth/google`): implicit flow, `/register` page for new OAuth users to set store name + create tenant DB
- Removed Apple, WhatsApp, phone login buttons (Apple requires paid Developer Program)
- `useToast()` system existed but not used everywhere — applied to `SettingPage`, `LoginPage`, `StoreSwitcher`
- Welcome toast on login: `"Selamat datang, {name}, di {store}"`
- Switch-store toast: `"Berhasil pindah ke toko {name}"`

**Pending:**
- VPS: `sudo docker compose run --rm qpos-server npx prisma migrate deploy --config prisma.master.config.ts` (adds OAuth columns to `accounts` table)
- Vercel: set `VITE_GOOGLE_CLIENT_ID` and redeploy

**2026-07-27 — TS 6 build fix**

- `npm run build` failed with TS 6 error: `OAuthLoginResponse` union not narrowed after `"needsRegistration" in auth` check in `LoginPage.tsx:57-58`
- Fix: added `as AuthPayload` type assertions on `login()` and `stores` access after the early return guard

**2026-07-28 — Onboarding wizard, Role management, Store switcher gate, Trust proxy**

- Multi-step registration wizard (`RegisterPage.tsx`): 4-step onboarding (Google bind → Profile → Store → Success) with progress bar; Google binding mandatory as step 1
- Role management (`RoleManagementPage.tsx`): OWNER-only CRUD for store members with cross-store account search/import; backend `GET/POST /api/members`, `PATCH/DELETE /api/members/:memberId`, `GET /api/members/search?q=xxx`
- Store switcher: now restricted to `OWNER` role only (`StoreSwitcher.tsx:27`)
- Sidebar: "Peran Anggota" link in main store sidebar (not account settings panel)
- Express `app.set("trust proxy", 1)` for rate limiter behind nginx reverse proxy
- New files: `server/src/services/member.service.ts`, `server/src/controllers/member.controller.ts`, `server/src/routes/member.routes.ts`, `src/services/memberService.ts`, `src/types/member.ts`, `src/pages/role-management/RoleManagementPage.tsx`

**Pending (VPS):**
- Master DB migration skipped but `accounts.tokenVersion` column missing — run `sudo docker compose run --rm qpos-server npx prisma db push --config prisma.master.config.ts` to force sync
- Then restart server: `sudo docker compose up -d --build`
- Vercel: ensure `VITE_API_URL=https://api.qpos.shop/api` is set and redeploy

**2026-07-28 (continued) — Security hardening, Offline support, Store/User pages, Settings expansion**

**Security hardening:**
- Helmet CSP (`server/src/app.ts`): production-only with strict `default-src 'self'`, allowed Google domains for OAuth, `upgrade-insecure-requests`
- CORS via `CORS_ORIGIN` env var (defaults to `http://localhost:5173`)
- Rate limiting (`server/src/middleware/rate-limiter.middleware.ts`): `authLimiter` 10 req/min, `transactionLimiter` 30 req/min, `globalLimiter` 200 req/min
- XSS defense (`server/src/utils/escape.ts`): `escapeHtml`, `stripHtml`, `trimAndStrip` — applied to receipt footer input
- JSON body limit: `1mb`

**Token refresh + logout invalidation:**
- Access token: 15-min expiry with `{sub, storeId, role, tokenVersion}`
- Refresh token: 7-day expiry with `{sub, storeId, type: "refresh", tokenVersion}`
- `POST /auth/refresh` — validates `tokenVersion` from DB, issues new pair
- `POST /auth/logout` — increments `accounts.tokenVersion`, invalidates all existing tokens
- `verifyToken` middleware validates `tokenVersion` match on every request
- Axios interceptor: auto-refresh on 401, queues concurrent requests during refresh, falls back to cached data if refresh fails offline

**Offline support (IndexedDB via Dexie):**
- `src/services/storage/db.ts`: `QPOSOffline` DB with `cache` and `pendingMutations` tables
- `cache.service.ts`: generic `get<T>(url)`/`set(url, data, ttl=5min)` with auto-expiry
- `product-cache.service.ts`: product-specific cache with barcode/name/category search
- `sync.service.ts`: mutation queue with replay (up to 5 retries), `pruneOldEntries(7d)`
- `network.service.ts`: `navigator.onLine` + `online`/`offline` event subscription
- `NetworkContext.tsx`: provides `{isOnline, pendingCount}`, prunes cache every 30 min, auto-processes queue on reconnect, polls every 60s
- `axiosInstance.ts`: cache GET on success, serve cached on GET failure when offline, enqueue mutations when offline (POST/PUT/DELETE), clear cache on logout
- `ConnectionStatus.tsx`: green Wifi icon (Terhubung), yellow spinning RefreshCw (Menyinkronkan... {n}), red WifiOff (Anda sedang offline)

**New pages:**
- `StoreManagementPage` (`/store-management`): lists all member stores, switch active store with toast, currently-active badge
- `UserSettingsPage` (`/user-settings`): account info display, Google account binding via `POST /auth/bind-google`
- `AcceptOwnershipPage` (`/accept-ownership?token=xxx`): 4-state flow (idle/loading/success/error); if unauthenticated, triggers Google OAuth then auto-accepts; if authenticated, shows accept button

**Owner invitation flow:**
- `StoreInvitation` model in master DB: `{id, storeId, email, token (unique), status (PENDING/ACCEPTED/EXPIRED), expiresAt (48h)}`
- `InvitationStatus` enum: `PENDING | ACCEPTED | EXPIRED`
- `POST /settings/invite-owner` (OWNER) — creates invitation, returns invite link
- `POST /auth/accept-ownership` — validates token, email match, expiry; demotes current OWNER to MANAGER; promotes invitee to OWNER; increments invitee's tokenVersion

**Settings page expansion (`SettingPage.tsx`):**
- Receipt footer: textarea with live preview, max 250 chars / 5 lines, save via `PUT /settings/receipt-footer`
- Dataset import/export: export button, .xlsx file picker with preview (total/new/duplicates), import with results summary
- Danger Zone (OWNER only):
  - Reset product dataset (deletes all products, categories, suppliers, stock history) with "HAPUS SEMUA" confirmation
  - Change store owner (invitation-based) with multi-step confirmation (type store name + "Saya mengerti dan ingin melanjutkan" + new owner email); shows invite link + "Kirim via Gmail"
  - Delete company (irreversible) with same multi-step confirmation; redirects to `/login`

**Sidebar restructuring:**
- Account settings panel (separate `<nav>` from main navigation): contains `UserSettings` and `StoreManagement` links
- CSS transition animation between main nav and account settings panel
- "Back to Store" button (`ArrowLeft`) returns to `/dashboard`
- "Peran Anggota" link added to main navigation (`Users` icon, OWNER only)

**Navbar changes:**
- User avatar/name button navigates to `/user-settings`
- `<ConnectionStatus />` between LanguageSwitcher and NotificationBell

**New files:**
- Frontend: `src/pages/store-management/StoreManagementPage.tsx`, `src/pages/user-settings/UserSettingsPage.tsx`, `src/pages/accept-ownership/AcceptOwnershipPage.tsx`, `src/components/navbar/ConnectionStatus.tsx`, `src/contexts/NetworkContext.tsx`, `src/services/storage/{db,cache,product-cache,sync,network}.service.ts`, `src/types/member.ts`
- Backend: `server/src/utils/escape.ts`, `server/src/middleware/rate-limiter.middleware.ts`
- Backend migration: `server/prisma/master/migrations/20260728000000_add_store_invitations/`

**Git commits (after 42e604d):**
- `0bb799b` — `feat: security hardening (CSP, CORS, rate limiting) + XSS defense + token refresh + logout invalidation`
- `9492190` — `feat: add connection status icon with hover tooltip in navbar`
- `466ad44` — `feat: offline support with IndexedDB, cache service, sync queue, and network-aware UI`
- `1c7914f` — `fix: connection icon green when online, red WifiOff when offline`
- `2df2687` — `fix: use string literal instead of UserRole.OWNER (type-only import)`
- `fb2c8a0` — `fix: enable Express trust proxy for rate limiter behind nginx reverse proxy`
- `e7508cf` — `docs: update AGENTS.md with 2026-07-28 session history`

**Pending (VPS):**
- Run master DB migration: `sudo docker compose run --rm qpos-server npx prisma migrate deploy --config prisma.master.config.ts`
- Then restart server: `sudo docker compose up -d --build`
- Vercel: ensure `VITE_API_URL=https://api.qpos.shop/api` is set and redeploy
- Vercel: set `VITE_GOOGLE_CLIENT_ID` and redeploy

