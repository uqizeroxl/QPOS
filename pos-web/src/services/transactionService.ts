import axios from "axios";
import { apiService } from "./api/apiService";
import axiosInstance from "./api/axiosInstance";
import type { SalesTransaction } from "../pages/cashier/CashierTypes";

export type TransactionListItem = {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  cashierName: string | null;
  paymentMethod: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  createdAt: string;
};

export type TransactionPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type GetTransactionsParams = {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  sort?: "latest" | "oldest";
};

type TransactionApiItem = {
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
  };
};

type TransactionApiResponse = {
  id: string;
  invoiceNumber: string;
  subtotal: string | number;
  discountPercent: string | number;
  discountAmount: string | number;
  grandTotal: string | number;
  paidAmount: string | number;
  change: string | number;
  cashierName?: string | null;
  createdAt: string;
  items: TransactionApiItem[];
};

type TransactionListApiItem = {
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

type TransactionListApiResponse = {
  data: TransactionListApiItem[];
  pagination: TransactionPagination;
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

export class TransactionApiError extends Error {
  public readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

function mapTransaction(transaction: TransactionApiResponse): SalesTransaction {
  return {
    id: transaction.id,
    transactionNumber: transaction.invoiceNumber,
    items: transaction.items.map((item) => ({
      productId: item.product?.id ?? item.productId ?? item.productBarcode ?? "",
      barcode: item.product?.barcode ?? item.productBarcode ?? "",
      name: item.product?.name ?? item.productName ?? "",
      price: Number(item.price ?? item.unitPrice),
      quantity: item.quantity,
      subtotal: Number(item.subtotal),
    })),
    subtotal: Number(transaction.subtotal),
    discountPercent: Number(transaction.discountPercent),
    discountAmount: Number(transaction.discountAmount),
    grandTotal: Number(transaction.grandTotal),
    paidAmount: Number(transaction.paidAmount),
    change: Number(transaction.change),
    cashierName: transaction.cashierName ?? undefined,
    createdAt: transaction.createdAt,
  };
}

function handleTransactionError(error: unknown): never {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (!error.response) {
      throw new TransactionApiError("Backend tidak dapat diakses.");
    }

    throw new TransactionApiError(
      error.response.data?.message ?? "Terjadi kesalahan pada server.",
      error.response.status,
    );
  }

  throw error;
}

function mapTransactionListItem(
  transaction: TransactionListApiItem,
): TransactionListItem {
  return {
    ...transaction,
    subtotal: Number(transaction.subtotal),
    tax: Number(transaction.tax),
    discount: Number(transaction.discount),
    total: Number(transaction.total),
  };
}

function buildQueryString(params: GetTransactionsParams) {
  const query = new URLSearchParams();

  if (params.page) query.set("page", params.page.toString());
  if (params.limit) query.set("limit", params.limit.toString());
  if (params.search) query.set("search", params.search);
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  if (params.sort) query.set("sort", params.sort);

  const queryString = query.toString();

  return queryString ? `?${queryString}` : "";
}

export const transactionService = {
  getTransactions: async (params: GetTransactionsParams = {}) => {
    try {
      const response = await axiosInstance.get<TransactionListApiResponse>(
        `/transactions${buildQueryString(params)}`,
      );

      return {
        data: response.data.data.map(mapTransactionListItem),
        pagination: response.data.pagination,
      };
    } catch (error) {
      handleTransactionError(error);
    }
  },
  getTransactionById: async (transactionId: string) => {
    try {
      const response = await apiService.get<TransactionApiResponse>(
        `/transactions/${transactionId}`,
      );

      return mapTransaction(response.data);
    } catch (error) {
      handleTransactionError(error);
    }
  },
  createTransaction: async (payload: CreateTransactionPayload) => {
    try {
      const response = await apiService.post<
        TransactionApiResponse,
        CreateTransactionPayload
      >("/transactions", payload);

      return mapTransaction(response.data);
    } catch (error) {
      handleTransactionError(error);
    }
  },
};
