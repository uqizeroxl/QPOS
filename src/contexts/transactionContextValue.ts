import { createContext } from "react";
import type { SalesTransaction } from "../pages/cashier/CashierTypes";

export type AddTransactionPayload = {
  items: {
    productId: number;
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

export type TransactionContextValue = {
  transactions: SalesTransaction[];
  isLoading: boolean;
  fetchTransactions: () => Promise<void>;
  addTransaction: (
    payload: AddTransactionPayload,
  ) => Promise<{ ok: boolean; transaction?: SalesTransaction; error?: string }>;
};

export const TransactionContext = createContext<
  TransactionContextValue | undefined
>(undefined);
