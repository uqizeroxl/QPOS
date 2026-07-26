export type TransactionListItem = {
  id: string;
  transactionNumber: string;
  customerName: string | null;
  cashierName: string | null;
  paymentMethod: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  createdAt: string;
};

export type TransactionApiItem = {
  id: string;
  productId: string | null;
  productBarcode?: string;
  productName?: string;
  unitPrice?: string | number;
  price?: string | number;
  quantity: number;
  subtotal: string | number;
  product?: {
    id: string | null;
    name: string;
    barcode: string;
    categoryName?: string;
    supplierName?: string | null;
  };
};

export type TransactionApiResponse = {
  id: string;
  invoiceNumber: string;
  subtotal: string | number;
  discountPercent?: string | number;
  discountAmount: string | number;
  grandTotal?: string | number;
  total?: string | number;
  paidAmount: string | number;
  change?: string | number;
  changeAmount?: string | number;
  cashierName?: string | null;
  createdAt: string;
  items: TransactionApiItem[];
};

export type TransactionListApiItem = {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  cashierName: string | null;
  paymentMethod: string;
  subtotal: string | number;
  tax: string | number;
  discount: string | number;
  total: string | number;
  createdAt: string;
};

export type CreateTransactionPayload = {
  items: {
    productId: string;
    barcode: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  change: number;
  cashierName?: string;
};

export type GetTransactionsParams = {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  sort?: "latest" | "oldest";
};

export type ResetTransactionHistoryResult = {
  deletedTransactionCount: number;
};
