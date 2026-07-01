import { createContext } from "react";
import type { SalesTransaction } from "../pages/cashier/CashierTypes";

export type AddTransactionPayload = Omit<SalesTransaction, "id">;

export type TransactionContextValue = {
  transactions: SalesTransaction[];
  addTransaction: (transaction: AddTransactionPayload) => SalesTransaction;
};

export const TransactionContext = createContext<
  TransactionContextValue | undefined
>(undefined);
