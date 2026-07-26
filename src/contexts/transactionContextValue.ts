import { createContext } from "react";
import type { SalesTransaction } from "../types/cashier";

export type AddTransactionPayload = Omit<SalesTransaction, "id">;

export type TransactionContextValue = {
  transactions: SalesTransaction[];
  addTransaction: (transaction: AddTransactionPayload) => SalesTransaction;
  clearTransactions: () => void;
};

export const TransactionContext = createContext<
  TransactionContextValue | undefined
>(undefined);
