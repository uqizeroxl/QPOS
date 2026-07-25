# QPOS — Project Analysis

## Overview

**QPOS** is a web-based Point of Sale (POS) / Retail Management System built with **React 19**, **TypeScript**, **Vite 8**, and **Tailwind CSS 4**. It targets small-to-medium retail businesses (minimarkets, convenience stores). The app is fully client-side with localStorage persistence and an optional API backend.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript 6 (strict mode) |
| Build | Vite 8 + @vitejs/plugin-react (SWC) |
| Styling | Tailwind CSS 4 + @tailwindcss/vite |
| Routing | react-router-dom 7 |
| HTTP | Axios 1.18 |
| Icons | lucide-react |
| Barcode | react-barcode |
| Linting | ESLint 10 + typescript-eslint |

## Key Architecture Decisions

- **State management**: React Context API (10 context providers composed in `AppProviders.tsx`)
- **Data persistence**: localStorage for all entities (products, categories, suppliers, transactions, settings, auth)
- **API layer**: Axios instance configured at `src/services/api/axiosInstance.ts` with Bearer token interceptor; generic CRUD wrapper at `apiService.ts` — but currently runs in demo mode (no real backend)
- **No external UI library**: All components are custom-built with Tailwind utility classes
- **No test files**: Zero tests found anywhere in the project
- **Language**: Indonesian throughout (UI labels, Rupiah currency via `Intl.NumberFormat('id-ID')`)

## Routing (`AppRoutes.tsx`)

- `/` — Login (unauthenticated)
- `/dashboard`, `/product`, `/category`, `/supplier`, `/cashier`, `/transaction-history`, `/report`, `/setting`, `/help`, `/notifications` — all protected by `<ProtectedRoute />`
- `*` — NotFoundPage

## Auth

- Hardcoded demo credentials: username=`manager`, password=`demo`
- Three roles: `admin`, `manager`, `cashier`
- Auth state persisted in localStorage with Bearer token

## Data Models

| Entity | Storage Key | Key Fields |
|--------|-------------|-----------|
| Product | `qpos_products` | barcode, name, category, purchasePrice, sellingPrice, stock, status |
| Category | `qpos_categories` | name, description, status, productCount |
| Supplier | `qpos_suppliers` | name, phone, address, notes |
| Transaction | `qpos_transactions` | transactionNumber, items[], subtotal, discount, grandTotal, paidAmount, change |
| Settings | `qpos_app_settings` | storeName, phone, address |
| Auth | `qpos_auth_user` | id, name, role |

## Domain Modules

- **Cashier** — Barcode scanning, cart management, discount, payment, receipt printing (58mm thermal)
- **Product** — CRUD, barcode generation, barcode printing (small/medium/large labels), low stock alerts (threshold: 5)
- **Category** — CRUD with status toggle; deletion blocked if products exist; rename propagates to products
- **Supplier** — CRUD with duplicate name validation
- **Transaction History** — Search and detail expansion
- **Reports** — Date range filtering, raw PDF export (no library, manual PDF stream in `reportPdf.ts`)
- **Dashboard** — Overview stats, recent activity, stock alerts
- **Settings** — Store info, theme (light/dark/system), backup placeholder

## Development Commands

```bash
npm run dev         # Start frontend dev server (Vite HMR)
npm run build       # Type-check + production build
npm run lint        # ESLint on all source files
npm run preview     # Preview production build
npm run dev:server  # Start backend dev server (Express + tsx watch)
npm run seed        # Seed database with sample data
npm run db:push     # Sync Drizzle schema to PostgreSQL
npm run docker:up   # Start backend via Docker Compose
npm run docker:down # Stop Docker Compose
```

## Conventions

- All sources in `src/`
- Pages in `src/pages/` organized per-module folders
- Contexts in `src/contexts/` paired with a `*ContextValue.ts` file for default state
- Hooks in `src/hooks/` mirror contexts (one hook per domain)
- Components in `src/components/ui/` (reusable) and `src/components/layouts/`
- Services in `src/services/api/`
- Constants in `src/constants/`
- Utilities in `src/utils/`

## Backend (`server/`)

A **Express.js + PostgreSQL** REST API (port 8000) matching the frontend data models, using **Drizzle ORM** for type-safe database access.

### Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 + TypeScript |
| Framework | Express.js 4 |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM (schema-first, auto-migrations via drizzle-kit) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | Zod schemas |
| Dev runner | tsx (watch mode) |

### Structure

```
server/
  src/
    index.ts            # Entry point (loads dotenv, starts listening)
    app.ts              # Express app (middleware + route mounting)
    db/
      index.ts          # Drizzle client (postgres-js driver)
      schema.ts         # All table schemas (pgTable, pgEnum)
    types.ts            # Shared type definitions
    seed.ts             # Sample data seeder (uses Drizzle)
    middleware/
      auth.ts           # JWT authenticate + role-based authorize
      errorHandler.ts   # Global AppError → JSON error response
      validate.ts       # Zod request body/query/params validation
    routes/
      auth.ts           # POST /login, GET /me, POST /logout
      products.ts       # Full CRUD + /barcode/:barcode lookup + low-stock
      categories.ts     # Full CRUD + rename cascades to products
      suppliers.ts      # Full CRUD + duplicate name check
      transactions.ts   # Create transaction (deducts stock in txn) + list/detail
      settings.ts       # GET/PUT store info (upsert pattern)
      dashboard.ts      # GET /stats (aggregated counts + recent activity)
  drizzle/
    (auto-generated migration files from drizzle-kit)
```

### API Response Format

All endpoints return:
```json
{ "status": "success"|"error", "data": ..., "message": "..." }
```

List endpoints support pagination via query params: `?page=1&limit=10&sort=name&order=asc&search=keyword`

### Running

```bash
# Option 1: Docker (PostgreSQL + server together)
cp server/.env.example server/.env
docker compose up -d          # starts both postgres + server
docker compose exec qpos-server sh -c "npx drizzle-kit push && tsx src/seed.ts"

# Option 2: Direct dev (requires local PostgreSQL)
cp server/.env.example server/.env
# Edit server/.env with your PostgreSQL connection string
cd server && npm install
npm run db:push               # sync schema to database
npm run seed                  # populate demo data
npm run dev                   # start hot-reload server
```

### Auth (Demo Credentials — see seed.ts)

| Username | Password | Role |
|----------|----------|------|
| admin    | demo     | admin |
| manager  | demo     | manager |
| cashier  | demo     | cashier |

### Notes

- `server/.env.example` documents available env vars; copy to `server/.env` for dev
- PostgreSQL runs in Docker (`qpos-db` service, port 5432, user `qpos`, database `qpos`)
- Drizzle schema lives at `src/db/schema.ts` — change it, then run `npm run db:push` to sync
- All list endpoints are paginated; there is also an `/all` variant returning all records (no pagination)
- Transactions use Drizzle's `db.transaction()` to atomically insert the order and deduct stock
- Role-based auth: `admin` and `manager` can CUD; `cashier` is read-only + create transactions
- `express-async-errors` is imported in `app.ts` so async route handlers throw safely into the error middleware

## Frontend ↔ Backend Wiring

The frontend Axios client (`src/services/api/`) already points at `http://localhost:8000/api`. To switch from localStorage to API mode, each context provider would call the corresponding API endpoints instead of reading/writing localStorage.

## Gotchas & Notes

- `tsconfig.json` uses project references — `tsc -b` bundles both `tsconfig.app.json` and `tsconfig.node.json`
- `vite.config.ts` uses ESM (`import` syntax) via `tsconfig.node.json`
- ESLint config is the new flat config format (`eslint.config.js`)
- PDF export is a custom implementation in `reportPdf.ts` — no pdfmake/jsPDF dependency
- Activity log and notifications are in-memory only (not persisted across reloads)
- No routing-based code-splitting (all pages bundled together)
- Barcode printing renders via `react-barcode` inside a print-specific hidden area
- The Tailwind config is implicit (v4 convention — no `tailwind.config.js`)