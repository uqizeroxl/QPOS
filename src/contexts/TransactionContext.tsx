import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiService } from "../services/api/apiService";
import type { SalesTransaction } from "../pages/cashier/CashierTypes";
import { TransactionContext } from "./transactionContextValue";
import type { AddTransactionPayload } from "./transactionContextValue";

type TransactionProviderProps = {
  children: ReactNode;
};

type ApiTransactionResponse = {
  id: string;
  transactionNumber: string;
  items: SalesTransaction["items"];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  grandTotal: number;
  paidAmount: number;
  change: number;
  cashierName: string;
  createdAt?: string;
};

export function TransactionProvider({ children }: TransactionProviderProps) {
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await apiService.get<{ items: ApiTransactionResponse[]; total: number }>(
        "/transactions",
        { params: { limit: 1000, page: 1, sort: "createdAt", order: "desc" } },
      );
      setTransactions(
        response.data.items.map((t) => ({
          id: t.id,
          transactionNumber: t.transactionNumber,
          items: t.items,
          subtotal: t.subtotal,
          discountPercent: t.discountPercent,
          discountAmount: t.discountAmount,
          grandTotal: t.grandTotal,
          paidAmount: t.paidAmount,
          change: t.change,
          cashierName: t.cashierName,
          createdAt: t.createdAt ?? new Date().toISOString(),
        })),
      );
    } catch {
      // keep previous state on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void apiService.get<{ items: ApiTransactionResponse[]; total: number }>(
      "/transactions",
      { params: { limit: 1000, page: 1, sort: "createdAt", order: "desc" } },
    ).then((response) => {
      if (!cancelled) {
        setTransactions(
          response.data.items.map((t) => ({
            id: t.id,
            transactionNumber: t.transactionNumber,
            items: t.items,
            subtotal: t.subtotal,
            discountPercent: t.discountPercent,
            discountAmount: t.discountAmount,
            grandTotal: t.grandTotal,
            paidAmount: t.paidAmount,
            change: t.change,
            cashierName: t.cashierName,
            createdAt: t.createdAt ?? new Date().toISOString(),
          })),
        );
      }
    }).catch(() => {}).finally(() => {
      if (!cancelled) {
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const addTransaction = useCallback(
    async (payload: AddTransactionPayload) => {
      try {
        const response = await apiService.post<ApiTransactionResponse>("/transactions", payload);
        const serverData = response.data;
        const transaction: SalesTransaction = {
          id: serverData.id,
          transactionNumber: serverData.transactionNumber,
          items: payload.items,
          subtotal: payload.subtotal,
          discountPercent: payload.discountPercent,
          discountAmount: payload.discountAmount,
          grandTotal: payload.grandTotal,
          paidAmount: payload.paidAmount,
          change: payload.change,
          cashierName: payload.cashierName,
          createdAt: serverData.createdAt ?? new Date().toISOString(),
        };
        setTransactions((current) => [transaction, ...current]);
        return { ok: true as const, transaction };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal membuat transaksi";
        return { ok: false as const, error: message };
      }
    },
    [],
  );

  const value = useMemo(
    () => ({ transactions, isLoading, fetchTransactions, addTransaction }),
    [transactions, isLoading, fetchTransactions, addTransaction],
  );

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}
