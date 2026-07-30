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
./deploy.sh              # Pull + rebuild + restart (VPS)
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
| `qpos-server` | Custom (multi-stage `server/Dockerfile`) | `8000:8000` | Express.js API server with auto-migration upon startup (`server/docker-entrypoint.sh`)|

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

**Migrations run automatically** via `server/docker-entrypoint.sh` on every container start. Just rebuild and restart:

**Re-deploy after code changes:**
```bash
cd ~/QPOS
git pull
sudo docker compose up -d --build
```

**Full setup (new deployment) — same command:**
```bash
cd ~/QPOS
sudo docker compose up -d --build
```

**Reset tenant DB (WARNING: deletes all business data):**
```bash
sudo docker compose stop qpos-server
sudo docker compose exec -T qpos-db psql -U qpos -d postgres -c "DROP DATABASE qpos;"
sudo docker compose exec -T qpos-db psql -U qpos -d postgres -c "CREATE DATABASE qpos;"
sudo docker compose up -d
```

**Bootstrap default store + users** (runs automatically on container start, can also run manually):
```bash
sudo docker compose exec qpos-server node dist/scripts/bootstrap-master-default-store.js
```
Creates a default OWNER user (`owner` / `owner123`) and registers the "Multazam" store in the master DB.

#### Dockerfile Details (`server/Dockerfile`)

Multi-stage build:
1. **Build stage** (`node:22-alpine`): `npm ci` → `prisma generate` (tenant + master) → `tsc`
2. **Runtime stage** (`node:22-alpine`): Python 3 + reportlab (for PDF generation) + compiled `dist/` + Prisma client + prisma schemas + `docker-entrypoint.sh` (auto-migration + bootstrap on start)

#### Reverse Proxy

- nginx serves the SPA frontend with `try_files $uri $uri/ /index.html`
- API proxy to backend is configured at infrastructure level (domain routing)
- Frontend `VITE_API_URL` points directly to `https://api.qpos.shop/api`

### CI/CD — GitHub Actions + SSH Deploy

**Push-to-deploy via GitHub Actions** — triggered on push to `main`. Build runs entirely on the VPS, not on GitHub runners.

**Workflow file:** `.github/workflows/deploy.yml`

**Required GitHub Secrets:**
| Secret | Description |
|--------|-------------|
| `SERVER_HOST` | VPS IP or hostname (`api.qpos.shop`) |
| `SERVER_USER` | SSH username (e.g. `ubuntu`, `deploy`) |
| `SERVER_SSH_KEY` | Private SSH key for passwordless login |

**What happens on push to `main`:**
1. GitHub Action SSHes into the VPS
2. Runs `git pull` in `~/QPOS`
3. Runs `sudo docker compose up -d --build`
4. The container's `docker-entrypoint.sh` runs migrations + bootstrap automatically

**Manual deploy (from VPS):**
```bash
./deploy.sh
```

**Set up SSH key for GitHub Actions:**
1. On the VPS: `ssh-keygen -t ed25519 -f ~/.ssh/deploy-key -N ""`
2. Add public key to `~/.ssh/authorized_keys`: `cat ~/.ssh/deploy-key.pub >> ~/.ssh/authorized_keys`
3. Copy private key content: `cat ~/.ssh/deploy-key`
4. Add as `SERVER_SSH_KEY` secret on GitHub repo → Settings → Secrets and variables → Actions

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
- Vercel: ensure `VITE_API_URL=https://api.qpos.shop/api` is set and redeploy
- Vercel: set `VITE_GOOGLE_CLIENT_ID` and redeploy

## 2026-07-29 — Sinkronisasi kategori setelah login pertama

**Tujuan:**
- Memastikan data kategori baru diminta setelah autentikasi siap dan langsung tersedia pada halaman Kategori serta dropdown kategori di halaman Produk.

**Root cause:**
- `CategoryProvider` selalu meminta `/categories` satu kali saat mount, termasuk ketika belum ada token pada kunjungan pertama. Request tanpa autentikasi tersebut gagal dan provider tidak bergantung pada perubahan status auth, sehingga tidak melakukan refetch setelah login. Login berikutnya tampak normal karena token tersimpan sebelum provider di-mount ulang.

**File diubah:**
- `src/contexts/CategoryContext.tsx`
- `AGENTS.md`

**Perubahan:**
- Menghubungkan lifecycle kategori ke `isAuthenticated`, status loading auth, dan token aktif dari `AuthProvider`.
- Menjalankan fetch otomatis hanya setelah auth siap serta mengulang fetch ketika token berubah (login dan switch store).
- Menggabungkan request kategori yang sedang berjalan untuk token yang sama agar tidak terjadi duplicate request.
- Mengabaikan respons dari token lama dan menyembunyikan state kategori sesi/store lama saat logout atau token berganti.
- Mempertahankan halaman Produk sebagai consumer `activeCategories` dari `CategoryContext`, sehingga dropdown ikut tersinkron tanpa fetch tambahan.

**Testing:**
- `npm run build` berhasil.
- Lint terarah `src/contexts/CategoryContext.tsx` berhasil tanpa error setelah perubahan.
- `npm run lint` masih gagal karena error dan warning pre-existing di file lain; tidak ada error baru dari perbaikan kategori.
- Alur yang dicakup oleh lifecycle: login pertama, refresh dengan token tersimpan, logout/login, dan pergantian token/store.

**Catatan developer berikutnya:**
- Saat menambahkan provider data terproteksi lain, jangan fetch hanya berdasarkan mount. Gate request dengan kesiapan auth dan jadikan token/store aktif sebagai pemicu sinkronisasi.
- Pertahankan deduplikasi request dan pemeriksaan token sebelum menulis hasil async ke state untuk mencegah race condition lintas sesi/store.

## 2026-07-29 — BUG-002 dukungan negative stock di Kasir

**Tujuan:**
- Mengizinkan Kasir menjual produk melampaui stok tersedia dan menyimpan hasil stok negatif tanpa mengubah perhitungan atau business logic transaksi lainnya.

**Root Cause:**
- Qty keranjang di-clamp ke `item.stock` pada penambahan produk, input manual, serta tombol `+/-`; stok 0 bahkan menghasilkan qty 0. Checkout frontend kembali menolak qty di atas stok, sementara backend mensyaratkan `stock >= quantity` sebelum melakukan decrement.

**File diubah:**
- `src/pages/cashier/CashierPage.tsx`
- `src/pages/cashier/CartTable.tsx`
- `src/contexts/ProductContext.tsx`
- `server/src/services/transaction.service.ts`
- `server/src/controllers/transaction.controller.ts`
- `AGENTS.md`

**Perubahan:**
- Menghapus seluruh clamp dan validasi qty terhadap stok pada alur Kasir; minimum qty tetap 1 sesuai perilaku sebelumnya.
- Menghapus atribut maksimum stok dari input qty sehingga tombol `+` dan input manual dapat melebihi stok nol, positif, atau negatif.
- Menghapus guard stok dari helper sinkronisasi produk frontend agar pengurangan lokal konsisten mendukung stok negatif.
- Mengganti conditional backend update dengan atomic `decrement: quantity` tanpa clamp ke 0.
- Menghitung `previousStock` dan `currentStock` riwayat dari hasil atomic update agar pencatatan tetap benar pada transaksi bersamaan.
- Tidak mengubah rumus subtotal, diskon, grand total, pembayaran, kembalian, item transaksi, import/export dataset, atau laporan.

**Testing:**
- `npm run build` frontend berhasil.
- `npm run build --prefix server` berhasil.
- Lint `src/pages/cashier/CartTable.tsx` berhasil.
- Lint gabungan file frontend yang diubah masih melaporkan tiga error pre-existing: satu `set-state-in-effect` di `CashierPage.tsx` dan dua `preserve-manual-memoization` di `ProductContext.tsx`; baris perubahan BUG-002 tidak menambah temuan lint.
- `git diff --check` berhasil.
- Perhitungan jalur backend menghasilkan: `0 - 2 = -2`, `3 - 5 = -2`, dan `-2 - 3 = -5`; qty dan subtotal item tetap disimpan tanpa perubahan.

**Catatan developer berikutnya:**
- Negative stock adalah perilaku Kasir yang disengaja. Jangan menambahkan kembali guard `stock >= quantity`, clamp qty ke stok, atau clamp hasil stok ke 0 pada alur transaksi penjualan.
- Gunakan atomic decrement dan nilai hasil update untuk pencatatan stock history agar aman terhadap transaksi bersamaan.

## 2026-07-29 — BUG-003 audit checkout negative stock

**Tujuan:**
- Memastikan endpoint checkout yang benar-benar dijalankan menerima penjualan saat stok nol atau negatif serta tetap membuat seluruh record transaksi dan riwayatnya.

**Root Cause:**
- Audit source, route, middleware, controller, service, helper, context frontend, dan artefak build tidak menemukan validasi stok tersisa setelah BUG-002. Pesan `Stok <nama produk> tidak mencukupi.` hanya dapat berasal dari implementasi backend lama; qpos.shop masih mengarah ke container production yang belum di-rebuild/redeploy dengan perubahan backend BUG-002.

**File diubah:**
- `server/src/services/transaction.service.ts` (perubahan checkout BUG-002 yang diaudit dan diverifikasi)
- `server/src/controllers/transaction.controller.ts` (handler error stok lama telah dihapus)
- `src/pages/cashier/CashierPage.tsx` (validasi checkout frontend telah dihapus)
- `src/contexts/ProductContext.tsx` (guard stok lokal telah dihapus)
- `AGENTS.md`

**Perubahan:**
- Memastikan route `POST /api/transactions` melewati auth/role/rate limiter lalu langsung menggunakan controller dan service transaksi yang sudah mendukung negative stock; tidak ada middleware atau validator stok tambahan.
- Memastikan source dan hasil build backend tidak lagi mengandung `InsufficientStockError`, pesan stok tidak mencukupi, maupun kondisi `stock >= quantity`.
- Mempertahankan atomic `decrement: item.quantity`; transaksi, item, stock history, dan activity log tetap dibuat dalam satu database transaction.
- Tidak mengubah laporan, receipt mapping, import/export, kategori, supplier, atau business logic lainnya.

**Testing:**
- Build frontend `npm run build` berhasil.
- Build backend `npm run build --prefix server` berhasil.
- Pencarian ulang source dan `server/dist` tidak menemukan validasi/pesan insufficient stock.
- `git diff --check` berhasil.
- Jalur kalkulasi checkout terverifikasi menghasilkan `0 - 2 = -2`, `3 - 5 = -2`, dan `-2 - 3 = -5`; deployment production belum dilakukan dari workspace ini sehingga pengujian langsung qpos.shop masih menunggu rebuild container VPS.

**Catatan developer berikutnya:**
- Deploy perubahan backend dengan `git pull` lalu `sudo docker compose up -d --build`; restart tanpa build dapat tetap menjalankan JavaScript lama di image/container.
- Setelah deploy, ulangi tiga skenario negative stock di qpos.shop dan periksa Transaction, TransactionItem, StockHistory, ActivityLog, serta receipt sebagai smoke test production.

## 2026-07-29 — BUG-004 audit terfokus penolakan stok checkout

**Tujuan:**
- Membuktikan apakah masih ada source backend yang dapat menolak checkout karena stok tidak mencukupi.

**Root Cause:**
- Tidak ditemukan blocker stok lain pada `server/src/**` maupun `server/dist`. Pesan production hanya dapat berasal dari image/container backend lama yang belum memuat perubahan BUG-002/BUG-003.

**File diubah:**
- `AGENTS.md`

**Perubahan:**
- Mengaudit route, middleware auth/role/rate limiter, controller, service, helper, error class, Prisma transaction, serta hasil kompilasi backend.
- Membuktikan `POST /api/transactions` berakhir di satu implementasi checkout yang memakai atomic `decrement: item.quantity` tanpa kondisi stok.
- Tidak ada business logic aplikasi yang diubah karena tidak ditemukan validasi tambahan.

**Testing:**
- Pencarian `insufficient`, pesan stok tidak mencukupi, dan kondisi `gte: quantity` pada source serta build backend tidak menghasilkan kecocokan checkout.
- Build frontend berhasil.
- Build backend berhasil.
- `git diff --check` berhasil.

**Catatan developer berikutnya:**
- Rebuild dan deploy container production dengan `sudo docker compose up -d --build`; pesan lama tidak mungkin dihasilkan oleh source/build saat ini.

## 2026-07-29 — Offline mutation success + Receipt height + Auto-migration entrypoint

**Offline mutation success (axiosInstance.ts):**
- Saat offline, mutation (POST/PUT/DELETE) enqueue ke IndexedDB via `syncService`
- Tidak lagi `reject` — mengembalikan mock `AxiosResponse` dengan data dummy (produk, kategori, supplier) sesuai URL
- Memicu toast via `CustomEvent("app:toast")` dengan pesan sukses
- Service worker dikonfigurasi dengan `BackgroundSyncPlugin` (`api-mutations` queue) sebagai lapisan retry kedua

**Receipt print height fix:**
- `src/index.css`: hapus `min-height: 100vh` dan `position: absolute; inset: 0` → height mengikuti konten, tidak ada halaman kosong
- Body diberi `height: auto; margin: 0; padding: 0` saat print
- `ReceiptPrintArea.tsx`: tambah `receipt-cut-space` (15mm) + `receipt-cut-line` dengan "--- potong disini ---"
- CSS cut area: dashed line + gray text

**Auto-migration entrypoint (`server/docker-entrypoint.sh`):**
- Baru: entrypoint script yang jalan otomatis sebelum server start
- Step: `migrate deploy` → `db push --accept-data-loss` (master & tenant) → `bootstrap` → server
- Menangani kasus migration tracking tidak sinkron dengan database
- `server/Dockerfile`: ubah `CMD` jadi `ENTRYPOINT`

**GitHub Actions deploy workflow (`.github/workflows/deploy.yml`):**
- Trigger: push ke `main` dengan path filter (`server/**`, `docker-compose.yml`, `deploy.sh`, `init-db.sql`, workflow itself)
- Tidak build di GitHub runner — SSH ke VPS, jalankan `git pull` + `sudo docker compose up -d --build`
- Secrets: `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`
- `deploy.sh`: script manual alternatif dengan step yang sama
## 2026-07-29 — FEATURE-001 minimum stock per produk

**Tujuan:**
- Memungkinkan owner menetapkan batas minimum stok per produk dan menggunakan batas tersebut untuk indikator Produk serta peringatan Dashboard.

**Schema berubah:**
- Model tenant `Product` mendapat field `minimumStock Int @default(5)`.
- Migration `20260729000000_add_product_minimum_stock` menambahkan kolom `minimumStock` dengan default 5 ke tabel `products`.

**File diubah:**
- `server/prisma/schema.prisma`
- `server/prisma/migrations/20260729000000_add_product_minimum_stock/migration.sql`
- `server/src/controllers/product.controller.ts`
- `server/src/services/product.service.ts`
- `server/src/services/dashboard.service.ts`
- `src/types/product.ts`, `src/types/dashboard.ts`
- `src/services/productService.ts`
- `src/pages/product/ProductForm.tsx`, `ProductTable.tsx`, `ProductRow.tsx`, `ProductPage.tsx`
- `src/pages/dashboard/DashboardPage.tsx`
- `src/i18n/locales/id.json`, `src/i18n/locales/en.json`
- `AGENTS.md`

**Perubahan:**
- Create/update produk menerima dan memvalidasi minimum stock sebagai integer >= 0; default API dan database adalah 5.
- Form tambah/edit serta tabel Produk menampilkan Minimum Stock.
- Status stok Produk dan query Dashboard memakai aturan `stock <= minimumStock` per produk.
- Export dataset mengisi kolom `Minimum Stock` dengan nilai tersimpan.
- Import menerima `Minimum Stock`, alias lama `Minimum Stok`, atau file tanpa kolom tersebut; nilai kosong mempertahankan nilai existing dan memakai default 5 untuk produk baru.
- Daftar Dashboard menampilkan stok aktual dan minimum masing-masing produk.

**Testing:**
- Prisma Client tenant berhasil di-generate.
- `prisma validate` berhasil.
- Migration terdeteksi oleh `prisma migrate status`; belum diterapkan ke database lokal karena ada migration lama lain yang juga masih pending.
- Build backend berhasil.
- Build frontend berhasil setelah memulihkan dependency yang sudah tercatat di lockfile.
- Lint file terkait masih melaporkan tiga error React hooks pre-existing di `DashboardPage.tsx` dan `ProductPage.tsx`; tidak ada temuan pada baris FEATURE-001.
- `git diff --check` berhasil.

**Catatan developer berikutnya:**
- Terapkan tenant migration dengan `npx prisma migrate deploy --config prisma.config.ts` pada setiap database tenant sebelum menjalankan backend baru.
- Pertahankan perbandingan field-to-field `stock <= minimumStock`; jangan mengembalikan threshold global pada Dashboard.

## 2026-07-29 — FEATURE-001.2 indikator visual status stok

**Tujuan:**
- Menyeragamkan indikator stok dengan ikon, label, dan warna agar kondisi persediaan mudah dikenali di seluruh UI inventori.

**File diubah:**
- `src/components/ui/StockStatusBadge.tsx`
- `src/components/ui/StockAlertPanel.tsx`
- `src/pages/product/ProductRow.tsx`
- `src/pages/product/StockAdjustmentModal.tsx`
- `src/pages/dashboard/DashboardPage.tsx`
- `src/pages/restock/RestockPage.tsx`
- `src/pages/restock/RestockProductModal.tsx`
- `AGENTS.md`

**Shared helper baru:**
- `StockStatusBadge` menjadi sumber tunggal rule visual berdasarkan pasangan `stock` dan `minimumStock`, menggunakan ikon Lucide React yang sudah terpasang.
- Rule: Aman/CircleCheckBig/hijau; Hampir Habis/TriangleAlert/oranye; Habis/CircleX/merah; Minus/PackageMinus/merah gelap.

**Perubahan UI:**
- Tabel Produk, Dashboard, panel alert stok, modal penyesuaian stok, serta pencarian/daftar/modal Restock memakai badge yang sama.
- Status Minus mempunyai badge eksplisit “Minus”.
- Angka stok dan minimum stock tetap ditampilkan; tidak ada business logic stok yang diubah.

**Testing:**
- Build frontend berhasil.
- Lint shared component berhasil; lint gabungan halaman masih menemukan tiga error `set-state-in-effect` pre-existing pada Dashboard dan Restock.
- `git diff --check` berhasil.

**Catatan developer berikutnya:**
- Gunakan `StockStatusBadge` untuk tampilan status stok baru; jangan menduplikasi conditional warna/label di halaman.
- Riwayat stok hanya menampilkan angka historis karena record history tidak menyimpan minimum stock pada saat kejadian.

## 2026-07-29 — FEATURE-001.3 minimum stock dan tooltip icon-only

**Tujuan:**
- Memastikan Minimum Stock selalu terlihat pada tabel Produk dan mengecilkan indikator status menjadi ikon dengan tooltip informatif.

**Root Cause:**
- Mapper frontend mengasumsikan `minimumStock` selalu tersedia sehingga respons backend lama menghasilkan nilai kosong/undefined. Kolom juga belum memiliki lebar minimum. Badge sebelumnya merender ikon, teks, padding, border, dan background sehingga terlalu dominan di tabel.

**File diubah:**
- `src/components/ui/StockStatusBadge.tsx`
- `src/pages/product/ProductTable.tsx`, `ProductRow.tsx`, `ProductForm.tsx`
- `src/services/productService.ts`, `dashboardService.ts`
- `src/types/product.ts`
- `AGENTS.md`

**Perubahan:**
- `ProductApiItem.minimumStock` dibuat opsional untuk kompatibilitas respons lama dan dinormalisasi ke default 5 pada mapper API.
- Kolom Minimum Stock diberi lebar minimum dan selalu merender nilai hasil normalisasi.
- `StockStatusBadge` sekarang icon-only berukuran `h-4 w-4`, tanpa teks visual, background, atau padding badge.
- Tooltip hover/focus menampilkan Status, Stok Saat Ini, Minimum Stock, serta pesan kondisi; native `title` disediakan sebagai fallback saat tooltip CSS terpotong container.
- Dashboard, Produk, Restock, panel stok, dan modal tetap menggunakan shared component yang sama.

**Testing:**
- Build frontend berhasil.
- Lint file inti yang diubah berhasil.
- `git diff --check` berhasil.

**Catatan developer berikutnya:**
- Pertahankan fallback minimum stock hanya pada boundary mapper API; domain `Product` tetap memiliki `minimumStock` wajib.
- Jangan menambahkan label teks langsung pada status stok; detail status tersedia melalui tooltip dan aria-label.

## 2026-07-29 — UI-001 alignment tabel Produk

**Tujuan:**
- Menyeragamkan alignment kolom Stok, Minimum Stock, dan Status pada tabel Produk.

**File diubah:**
- `src/pages/product/ProductTable.tsx`
- `src/pages/product/ProductRow.tsx`
- `AGENTS.md`

**Perubahan:**
- Header Stok, Minimum Stock, dan Status dibuat rata tengah horizontal dan vertikal.
- Angka stok dan minimum stock dibuat tepat di tengah sel.
- Ikon `StockStatusBadge` dipusatkan dengan wrapper inline-flex tanpa mengubah padding atau tinggi baris.
- Alignment kolom lain tidak diubah.

**Testing:**
- Build frontend berhasil.
- `git diff --check` berhasil.

**Catatan developer berikutnya:**
- Pertahankan `text-center align-middle` pada ketiga header/sel inventori dan gunakan shared `StockStatusBadge` untuk kolom Status.

## 2026-07-29 — BUG-005 input dan persistensi Minimum Stock

**Root Cause:**
- Input Minimum Stock mengikat `value` langsung ke number dan menjalankan `Number(value || 0)` pada setiap `onChange`; string kosong langsung dipaksa kembali menjadi 0 sehingga tidak dapat diedit secara natural.
- Tabel menerapkan fallback 5 lagi pada layer render. Walaupun nullish fallback tidak menimpa angka 0, fallback ganda menyamarkan respons API yang belum membawa field dan membuat alur nilai tersimpan sulit diverifikasi.

**File diubah:**
- `src/pages/product/ProductForm.tsx`
- `src/pages/product/ProductRow.tsx`
- `AGENTS.md`

**Perubahan:**
- Input Minimum Stock memakai state string terpisah sehingga boleh kosong sementara selama editing.
- Fokus memilih seluruh isi agar mengetik angka baru langsung menggantikan nilai sebelumnya.
- Blur kosong mengembalikan default 5; save kosong juga dinormalisasi ke 5.
- Validasi `min=0` dan validasi backend integer >= 0 tetap dipertahankan.
- Tabel merender nilai domain `product.minimumStock` secara langsung; fallback 5 hanya dilakukan di mapper API ketika respons benar-benar null/undefined.
- Audit memastikan payload create/update mengirim field, controller meneruskan field, Prisma menyimpan dan mengembalikannya, serta mapper mempertahankan 0 maupun nilai positif.

**Validasi:**
- Nilai 10 melewati form, payload, backend, response, mapper, dan tabel tanpa diganti.
- Nilai 0 dipertahankan karena mapper memakai nullish fallback (`??`), bukan truthy fallback.
- Input dapat dikosongkan sementara dan dapat mengganti 0 langsung menjadi 15 melalui select-on-focus.
- Build frontend dan backend berhasil.
- `git diff --check` berhasil.

**Catatan:**
- Jangan mem-parsing controlled number input pada setiap keystroke jika field perlu mendukung keadaan kosong sementara.
- Fallback kompatibilitas API harus tetap berada di mapper, bukan di komponen tabel.

## 2026-07-29 — Sinkronisasi Minimum Stock dengan dataset

**Root Cause:**
- Nilai minimum stock dinormalisasi berulang di form, controller, mapper, import, dan tabel. Fallback 5 pada beberapa layer menyembunyikan field API yang hilang dan berisiko mengubah nilai valid 0.
- Komponen lama `StockAlertPanel` memakai alias `minStock`, sehingga kontrak field frontend tidak seragam.
- Cache GET produk tidak dibersihkan setelah create, update, atau import dataset.

**File diubah:**
- `server/src/controllers/product.controller.ts`
- `server/src/services/product.service.ts`
- `src/pages/product/ProductForm.tsx`
- `src/services/productService.ts`, `dashboardService.ts`
- `src/services/api/axiosInstance.ts`
- `src/components/ui/StockAlertPanel.tsx`
- `src/types/product.ts`
- `AGENTS.md`

**Perubahan:**
- Menetapkan `minimumStock` sebagai satu-satunya nama field dari database sampai seluruh UI.
- Menghapus fallback nilai pada controller, mapper, tabel, dan dashboard; Prisma default hanya berlaku saat create benar-benar tidak menyertakan field.
- Input kosong boleh selama editing tetapi ditolak saat save; nilai harus integer >= 0.
- Dataset membaca integer Minimum Stock persis, mempertahankan 0, mempertahankan nilai existing jika sel kosong, dan memakai default schema untuk produk baru tanpa nilai.
- Export membaca `product.minimumStock` terbaru langsung dari query database.
- Cache frontend dibersihkan setelah create, update, dan import agar refresh halaman tidak memakai dataset lama.
- Mock response offline produk ikut membawa `minimumStock` dari payload.

**Testing:**
- Nilai 0 dan 10 tidak melewati truthy/nullish fallback.
- Edit 25 diteruskan pada payload create/update dan response mapper tanpa transformasi.
- Build frontend dan backend berhasil.
- Lint file yang diubah berhasil.
- `git diff --check` berhasil.

**Catatan:**
- Jangan menambah alias `stockMinimum` atau `minStock`; kontrak canonical adalah `minimumStock`.
- Migration tenant wajib diterapkan sebelum backend baru dijalankan.

## 2026-07-30 — BUG-006 logout gagal karena 401 token kadaluwarsa

**Tujuan:**
- Logout tetap berjalan meskipun access token sudah kadaluwarsa.
- Mengirim access token (jika masih ada) dan refresh token ke server untuk blacklist.
- Jika server mengembalikan 401, frontend mengabaikannya, membersihkan kredensial lokal, redirect ke login, dan menampilkan toast.

**Root Cause:**
- Route `/auth/logout` diproteksi oleh middleware `authenticate` yang diverifikasi dengan `verifyToken`. Jika access token sudah expired, middleware mengembalikan 401 sebelum controller logout dijalankan.
- Axios response interceptor mencoba refresh token saat 401, tetapi terkadang gagal dan memanggil `clearAuthAndRedirect()` yang menginterupsi alur logout normal.

**File diubah:**
- `server/src/routes/auth.routes.ts`
- `server/src/controllers/auth.controller.ts`
- `server/src/services/auth.service.ts`
- `src/services/authService.ts`
- `src/services/api/axiosInstance.ts`
- `src/contexts/AuthContext.tsx`
- `AGENTS.md`

**Perubahan Backend:**

*`server/src/routes/auth.routes.ts`:*
- Menghapus middleware `authenticate` dari route `POST /logout`.

*`server/src/controllers/auth.controller.ts` (`logout`):*
- Tidak lagi menggunakan `AuthenticatedRequest`.
- Jika `req.user` tersedia (akses via authenticate middleware untuk kompatibilitas), gunakan `authService.logout(userId)`.
- Jika tidak, baca `refreshToken` dari body → panggil `authService.logoutByRefreshToken()`.
- Selalu return 200.

*`server/src/services/auth.service.ts`:*
- Menambahkan `logoutByRefreshToken(refreshTokenValue)`:
  - Decode refresh token JWT.
  - Increment `Account.tokenVersion` jika payload valid.
  - Catch semua error (token invalid/expired → diabaikan, frontend bersihkan lokal).

**Perubahan Frontend:**

*`src/services/authService.ts` (`logout`):*
- Tidak lagi menggunakan `apiService` (axiosInstance dengan interceptors).
- Menggunakan `axios.post()` langsung dengan base URL, mengirim access token (jika ada) di header dan refresh token di body.
- Catch semua error secara diam-diam.

*`src/services/api/axiosInstance.ts`:*
- Menambahkan `"/auth/logout"` ke `AUTH_PREFIXES` agar interceptor tidak mencoba refresh/cache/offline-queue untuk request logout.

*`src/contexts/AuthContext.tsx`:*
- `logout()`: Menghapus conditional `if (token exists)` — selalu coba panggil server. Di `finally`, setelah `clearAuth()`, dispatch toast `"Anda telah berhasil logout."`.
- `verifyProfile()` catch handler: Memanggil `clearAuth()` + toast error "Sesi Anda telah berakhir. Silakan login kembali." jika verifikasi sesi gagal (sebelumnya hanya menampilkan warning tanpa membersihkan state auth).

**Testing:**
- `npm run build` frontend berhasil.
- `npm run build --prefix server` backend berhasil.
- Tidak ada error baru pada file yang diubah.

**Catatan developer berikutnya:**
- Logout sekarang menggunakan direct axios call (bukan axiosInstance), sehingga tidak terpengaruh oleh interceptor 401/refresh.
- Jika suatu endpoint perlu dipanggil tanpa interceptor (misalnya untuk alur auth), gunakan pola yang sama: `axios.post(url, payload, { headers, timeout })`.
- Backend handler `logout` harus selalu return 200 dalam kondisi apapun; frontend bertanggung jawab membersihkan state lokal.

## 2026-07-30 — Stability & Reliability

**Root cause:**
- Request 401 paralel berbagi antrean refresh, tetapi request antrean belum ditandai sudah pernah dicoba sebelum replay. Endpoint refresh juga memakai instance Axios ber-interceptor yang sama, sehingga kegagalan auth dapat masuk kembali ke flow refresh.
- Beberapa provider menelan error tanpa mengekspos status gagal. Request produk yang tumpang tindih juga dapat menulis respons lama setelah filter berubah.

**Perbaikan auth flow:**
- Refresh memakai client Axios terpisah dengan timeout 15 detik dan tidak melewati interceptor aplikasi.
- Setiap request hanya direplay satu kali; request 401 paralel memakai satu refresh aktif. Refresh token kedaluwarsa, refresh gagal, atau replay tetap 401 membersihkan token, user, state auth, cache, dan antrean mutasi lalu redirect ke Login.
- Bootstrap auth selalu mengakhiri loading melalui `finally`; event pembersihan auth menyinkronkan React state dengan localStorage. Hook OAuth kini selalu dipanggil dalam urutan stabil.

**Standarisasi loading/error handling:**
- Menambahkan komponen `LoadError` dengan tombol **Muat Ulang**.
- Dashboard, Produk, Kategori, Supplier, Laporan, Transaksi, Riwayat Stok, dan Manajemen Peran memakai error state yang dapat dicoba ulang. Provider Kategori/Supplier mengekspor `isLoading` dan `errorMessage` serta selalu menghentikan loading di `finally`.
- Timeout global API tetap 15 detik agar backend mati tidak mempertahankan skeleton tanpa batas.

**Pencegahan infinite loading/retry:**
- Flag `_retry` dipasang sebelum antrean/replay; endpoint auth publik tidak memicu refresh; tidak ada recursive refresh.
- Hanya request produk terbaru yang boleh mengubah data, error, dan loading.
- Logout/session expiry membersihkan cache IndexedDB dan pending mutation sesi lama.

**Hasil testing:**
- `npm run build` berhasil.
- `npm run lint` berhasil tanpa error/warning.
- `git diff --check` berhasil.
- Audit jalur kode memverifikasi token valid, satu refresh untuk access token expired, logout otomatis saat refresh token gagal, timeout menjadi error state, dan tidak ada refresh berulang.

## 2026-07-30 — Placeholder Pengaturan Sistem

- Menambahkan tab baru **Sistem** di sebelah tab **Keamanan** pada halaman Pengaturan tanpa mengubah urutan tab yang sudah ada.
- Tab Sistem belum memiliki fitur dan hanya menampilkan placeholder kosong.
- Placeholder dipisahkan ke komponen `SystemSettingsTab` agar siap dikembangkan pada sprint berikutnya.
- Tidak mengubah fitur, UI, atau behavior Informasi Toko, Dataset Produk, dan Keamanan.

## 2026-07-30 — Penataan Pengaturan Struk

- Pengaturan Struk dipindahkan dari tab Informasi Toko ke tab Sistem sebagai section/card pertama.
- Tidak ada perubahan fungsi, endpoint, validasi, preview, penyimpanan, maupun data Pengaturan Struk.
- Refactor hanya memindahkan UI ke `SystemSettingsTab` untuk penataan struktur tanpa mengubah fitur Pengaturan lainnya.

## 2026-07-30 — Cetak Struk Thermal 80mm

- Memperbaiki layout cetak struk untuk media thermal 80mm dari Kasir, Detail Transaksi, dan Riwayat Transaksi.
- Tinggi struk kini mengikuti tinggi konten dengan mengeluarkan UI aplikasi lain dari flow print.
- Menghilangkan spacer bawah dan page break yang tidak diperlukan sehingga tidak ada ruang kosong berlebih.
- Output berakhir normal setelah konten/garis potong agar kompatibel dengan fitur auto cut printer atau driver yang mendukungnya.

## 2026-07-30 — Konfigurasi Printer Thermal

- Menambahkan pengaturan ukuran kertas thermal 58mm/80mm dengan default 80mm dan penyimpanan per tenant.
- Menambahkan pengaturan Auto Cut ON/OFF pada Pengaturan > Sistem > Pengaturan Struk.
- Seluruh flow cetak struk membaca konfigurasi pengguna untuk page size, preview, dan akhir print job; tinggi tetap mengikuti konten tanpa halaman kosong.
- Memisahkan adapter print browser dan menyiapkan TODO integrasi ESC/POS `GS V` untuk aplikasi desktop; browser tetap bergantung pada dukungan driver/printer.

## 2026-07-30 — Thermal Paper Profiles

- Menambahkan enam paper profile thermal untuk kombinasi lebar 57/58/80mm dan diameter rol 30/40/50/80mm.
- Konfigurasi kini disimpan sebagai ID profile; preview dan CSS print mengambil lebar dari metadata profile aktif, sedangkan diameter rol disimpan sebagai informasi untuk pengembangan berikutnya.
- Konfigurasi lama 58mm otomatis dipetakan ke `58x30` dan 80mm ke profile default `80x80`, baik pada migrasi database maupun cache localStorage/API lama.
- Registry profile bertipe data terpusat sehingga profile baru dapat ditambahkan tanpa mengubah flow cetak atau komponen dropdown.

## 2026-07-30 — UI-002 padding kartu perangkat

**Tujuan:**
- Menyeragamkan padding kartu perangkat di halaman Manajemen Perangkat agar konsisten dengan Card di halaman lain.

**Root Cause:**
- Card di `DeviceManagementPage.tsx` tidak memiliki class `p-4`/`p-5`, sehingga konten menempel ke tepi border card. Semua Card lain di codebase menggunakan padding eksplisit.

**File diubah:**
- `src/pages/device-management/DeviceManagementPage.tsx`
- `AGENTS.md`

**Perubahan:**
- Menambahkan `className="p-5"` ke tiga Card: loading state, empty state (`Tidak ada perangkat terdaftar.`), dan setiap kartu perangkat dalam daftar.

**Testing:**
- `npm run build` berhasil.

## 2026-07-30 — BUG-007 preemptive token refresh + error boundary toast

**Tujuan:**
- Menghilangkan 401 pada request pertama setelah access token expired dengan melakukan refresh token secara preemptive di request interceptor.
- Memastikan runtime error menampilkan toast + halaman error (bukan white blank page).

**File diubah:**
- `src/services/api/axiosInstance.ts`
- `src/components/ErrorBoundary.tsx`
- `src/App.tsx`
- `src/contexts/AppProviders.tsx`
- `AGENTS.md`

**Perubahan:**

*`src/services/api/axiosInstance.ts`:*
- Request interceptor diubah jadi `async`.
- Jika access token expired tapi refresh token valid:
  - Langsung refresh token sebelum request dikirim.
  - Jika refresh sedang berjalan (`isRefreshing`), antri via `failedQueue`.
  - Token baru dipasang di `Authorization` header.
  - Tidak perlu lagi menunggu 401 di response interceptor.
- Jika refresh token juga expired: `clearAuthAndRedirect()` langsung.
- Response interceptor tetap ada sebagai fallback untuk kasus token expired di perjalanan atau multi-tab race condition.

*`src/App.tsx` + `src/contexts/AppProviders.tsx`:*
- `ToastProvider` + `ToastEventListener` dipindah ke **luar** `ErrorBoundary` (di `App.tsx`).
- Inner providers (Notification, Product, Category, dll) tetap di `AppProviders`.

*`src/components/ErrorBoundary.tsx`:*
- `componentDidCatch` sekarang dispatch `app:toast` dengan `"Terjadi kesalahan pada aplikasi."`.

**Testing:**
- `npm run build` frontend berhasil.
- `npm run build --prefix server` backend berhasil.

**Catatan developer berikutnya:**
- Preemptive refresh di request interceptor menghilangkan satu siklus 401→refresh→retry, sehingga response lebih cepat dan tidak ada 401 yang terlihat di console.
- Stack provider: Toast harus selalu di luar ErrorBoundary agar event `app:toast` tetap diterima saat error boundary aktif.
