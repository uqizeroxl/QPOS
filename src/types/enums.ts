export const RecordStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type RecordStatus = (typeof RecordStatus)[keyof typeof RecordStatus];

export const ActivityType = {
  PRODUCT_CREATE: "product-create",
  PRODUCT_UPDATE: "product-update",
  PRODUCT_DELETE: "product-delete",
  CATEGORY_CREATE: "category-create",
  CATEGORY_UPDATE: "category-update",
  CATEGORY_DELETE: "category-delete",
  SUPPLIER_CREATE: "supplier-create",
  SUPPLIER_UPDATE: "supplier-update",
  SUPPLIER_DELETE: "supplier-delete",
  LOGIN: "login",
  LOGOUT: "logout",
  TRANSACTION_SUCCESS: "transaction-success",
  TRANSACTION_HISTORY_RESET: "transaction-history-reset",
  TRANSACTION_RETENTION: "transaction-retention",
  BARCODE_PRINT: "barcode-print",
  RECEIPT_PRINT: "receipt-print",
  STOCK_RESTOCK: "stock-restock",
  STOCK_MINIMUM: "stock-minimum",
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const StockAdjustmentType = {
  ADD: "ADD",
  REDUCE: "REDUCE",
  SET: "SET",
} as const;
export type StockAdjustmentType =
  (typeof StockAdjustmentType)[keyof typeof StockAdjustmentType];

export const StockReferenceType = {
  SALE: "SALE",
  RESTOCK: "RESTOCK",
  ADJUSTMENT: "ADJUSTMENT",
  PURCHASE_ORDER: "PURCHASE_ORDER",
} as const;
export type StockReferenceType =
  (typeof StockReferenceType)[keyof typeof StockReferenceType];

export const PurchaseOrderStatus = {
  DRAFT: "DRAFT",
  ORDERED: "ORDERED",
  RECEIVED: "RECEIVED",
  CANCELLED: "CANCELLED",
} as const;
export type PurchaseOrderStatus =
  (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];

export const NotificationType = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning",
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationCategory = {
  STOCK: "stock",
  PRODUCT: "product",
  CATEGORY: "category",
  BARCODE: "barcode",
  SUPPLIER: "supplier",
  SALES: "sales",
  ANNOUNCEMENT: "announcement",
} as const;
export type NotificationCategory =
  (typeof NotificationCategory)[keyof typeof NotificationCategory];

export const UserRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  CASHIER: "CASHIER",
  WAREHOUSE: "WAREHOUSE",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
