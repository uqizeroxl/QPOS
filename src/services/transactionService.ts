import axios from "axios";
import { apiService } from "./api/apiService";
import axiosInstance from "./api/axiosInstance";
import type { SalesTransaction } from "../types/cashier";
import type {
  TransactionListItem,
  TransactionApiResponse,
  TransactionListApiItem,
  GetTransactionsParams,
  CreateTransactionPayload,
  ResetTransactionHistoryResult,
} from "../types/transaction";
import type { PaginationMeta } from "../types/api";

export type { TransactionListItem, GetTransactionsParams, CreateTransactionPayload, ResetTransactionHistoryResult };

export type TransactionPagination = PaginationMeta;

type TransactionListApiResponse = {
  data: TransactionListApiItem[];
  pagination: PaginationMeta;
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
    discountPercent: Number(transaction.discountPercent ?? 0),
    discountAmount: Number(transaction.discountAmount),
    grandTotal: Number(transaction.grandTotal ?? transaction.total),
    paidAmount: Number(transaction.paidAmount),
    change: Number(transaction.change ?? transaction.changeAmount),
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
    transactionNumber: transaction.invoiceNumber,
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
  createTransaction: async (
    payload: CreateTransactionPayload,
    idempotencyKey?: string,
  ) => {
    try {
      const response = await apiService.post<
        TransactionApiResponse,
        CreateTransactionPayload
      >("/transactions", payload, {
        headers: idempotencyKey
          ? { "Idempotency-Key": idempotencyKey }
          : undefined,
      });

      return mapTransaction(response.data);
    } catch (error) {
      handleTransactionError(error);
    }
  },
  resetTransactionHistory: async () => {
    try {
      const response = await apiService.post<
        ResetTransactionHistoryResult,
        { confirmation: string }
      >("/transactions/history/reset", { confirmation: "RESET" });

      return response.data;
    } catch (error) {
      handleTransactionError(error);
    }
  },
};
