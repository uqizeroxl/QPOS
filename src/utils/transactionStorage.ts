import { STORAGE_KEYS } from "../constants/app";
import type { SalesTransaction } from "../types/cashier";

export function getStoredTransactions(
  fallbackTransactions: SalesTransaction[] = [],
) {
  const storedTransactions = localStorage.getItem(STORAGE_KEYS.transactions);

  if (!storedTransactions) {
    return fallbackTransactions;
  }

  try {
    return JSON.parse(storedTransactions) as SalesTransaction[];
  } catch {
    localStorage.removeItem(STORAGE_KEYS.transactions);
    return fallbackTransactions;
  }
}

export function storeTransactions(transactions: SalesTransaction[]) {
  localStorage.setItem(
    STORAGE_KEYS.transactions,
    JSON.stringify(transactions),
  );
}
