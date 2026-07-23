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
npm run dev      # Start dev server (HMR)
npm run build    # Type-check + production build
npm run lint     # ESLint on all source files
npm run preview  # Preview production build
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

## Gotchas & Notes

- `tsconfig.json` uses project references — `tsc -b` bundles both `tsconfig.app.json` and `tsconfig.node.json`
- `vite.config.ts` uses ESM (`import` syntax) via `tsconfig.node.json`
- ESLint config is the new flat config format (`eslint.config.js`)
- PDF export is a custom implementation in `reportPdf.ts` — no pdfmake/jsPDF dependency
- Activity log and notifications are in-memory only (not persisted across reloads)
- No routing-based code-splitting (all pages bundled together)
- Barcode printing renders via `react-barcode` inside a print-specific hidden area
- The Tailwind config is implicit (v4 convention — no `tailwind.config.js`)