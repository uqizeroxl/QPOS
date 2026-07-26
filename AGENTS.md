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
| `auth.ts` | `AuthUser`, `AuthPayload`, `LoginPayload` |
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
