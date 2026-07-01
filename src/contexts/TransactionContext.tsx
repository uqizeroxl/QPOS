import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { SalesTransaction } from "../pages/cashier/CashierTypes";
import {
  getStoredTransactions,
  storeTransactions,
} from "../utils/transactionStorage";
import { TransactionContext } from "./transactionContextValue";
import type { AddTransactionPayload } from "./transactionContextValue";

type TransactionProviderProps = {
  children: ReactNode;
};

export function TransactionProvider({ children }: TransactionProviderProps) {
  const [transactions, setTransactions] = useState<SalesTransaction[]>(() =>
    getStoredTransactions(),
  );

  const addTransaction = useCallback((payload: AddTransactionPayload) => {
    const transaction: SalesTransaction = {
      ...payload,
      id: crypto.randomUUID(),
    };

    setTransactions((currentTransactions) => {
      const nextTransactions = [transaction, ...currentTransactions];
      storeTransactions(nextTransactions);
      return nextTransactions;
    });

    return transaction;
  }, []);

  const value = useMemo(
    () => ({ transactions, addTransaction }),
    [addTransaction, transactions],
  );

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}
