import type { StockAdjustmentType, StockReferenceType } from "./enums";

export type StockAdjustmentPayload = {
  type: StockAdjustmentType;
  quantity: number;
  note: string;
};

export type StockHistoryItem = {
  id: string;
  productId: string;
  type: StockAdjustmentType;
  quantity: number;
  previousStock: number;
  currentStock: number;
  note: string;
  referenceType?: StockReferenceType | null;
  referenceId?: string | null;
  userName?: string | null;
  createdAt: string;
};

export type StockHistoryListItem = StockHistoryItem & {
  referenceType: StockReferenceType | null;
  referenceId: string | null;
  userName: string | null;
  product: {
    id: string;
    name: string;
    barcode: string | null;
  };
};

export type StockHistoryListParams = {
  page: number;
  limit: number;
  productId?: string;
  type?: StockReferenceType;
  startDate?: string;
  endDate?: string;
};

export type StockHistoryPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type RestockProductPayload = {
  items: Array<{
    productId: string;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
  }>;
};

export type RestockProductResult = {
  products: import("./product").ProductApiItem[];
  histories: StockHistoryItem[];
};

export type StockAdjustmentApiResponse = {
  product: import("./product").ProductApiItem;
  history: StockHistoryItem;
};

export type ProductDatasetPreview = {
  totalData: number;
  newProducts: number;
  duplicateBarcodes: number;
};

export type ProductDatasetImportResult = {
  inserted: number;
  updated: number;
  skippedDuplicateRows: number;
  failed: number;
};

export type BulkDeleteProductsResult = {
  deletedCount: number;
  products: Array<{ id: string; name: string }>;
};

export type BulkUpdateProductsResult = {
  updatedCount: number;
  products: import("./product").ProductApiItem[];
};
