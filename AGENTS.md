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

A lightweight **Express.js + SQLite** REST API (port 8000) matching the frontend data models.

### Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 + TypeScript |
| Framework | Express.js 4 |
| Database | SQLite via better-sqlite3 |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | Zod schemas |
| Dev runner | tsx (watch mode) |

### Structure

```
server/
  src/
    index.ts          # Entry point (loads dotenv, starts listening)
    app.ts            # Express app (middleware + route mounting)
    db.ts             # SQLite connection + auto-migration on startup
    types.ts          # Shared type definitions
    seed.ts           # Sample data seeder
    middleware/
      auth.ts         # JWT authenticate + role-based authorize
      errorHandler.ts # Global AppError → JSON error response
      validate.ts     # Zod request body/query/params validation
    routes/
      auth.ts         # POST /login, GET /me, POST /logout
      products.ts     # Full CRUD + /barcode/:barcode lookup + low-stock
      categories.ts   # Full CRUD + rename cascades to products
      suppliers.ts    # Full CRUD + duplicate name check
      transactions.ts # Create transaction (deducts stock in txn) + list/detail
      settings.ts     # GET/PUT store info (upsert pattern)
      dashboard.ts    # GET /stats (aggregated counts + recent activity)
```

### API Response Format

All endpoints return:
```json
{ "status": "success"|"error", "data": ..., "message": "..." }
```

List endpoints support pagination via query params: `?page=1&limit=10&sort=name&order=asc&search=keyword`

### Running

```bash
# Direct (dev mode with hot-reload)
cd server && npm install && npm run seed && npm run dev

# Or via Docker from project root
docker compose up -d
```

### Auth (Demo Credentials — see seed.ts)

| Username | Password | Role |
|----------|----------|------|
| admin    | demo     | admin |
| manager  | demo     | manager |
| cashier  | demo     | cashier |

### Notes

- `server/.env.example` documents available env vars; copy to `server/.env` for dev
- Database file lives at `server/data/qpos.db` (auto-created)
- All list endpoints are paginated; there is also an `/all` variant returning all records (no pagination)
- Transactions use `db.transaction()` (SQLite txn) to atomically insert the order and deduct stock
- Role-based auth: `admin` and `manager` can CUD; `cashier` is read-only + create transactions
- Zod schemas at route level ensure type safety and meaningful 400 error messages

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