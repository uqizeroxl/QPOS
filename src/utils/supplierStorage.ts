import { STORAGE_KEYS } from "../constants/app";
import type { Supplier } from "../types/supplier";

export function getStoredSuppliers(fallbackSuppliers: Supplier[] = []) {
  const storedSuppliers = localStorage.getItem(STORAGE_KEYS.suppliers);

  if (!storedSuppliers) {
    return fallbackSuppliers;
  }

  try {
    return JSON.parse(storedSuppliers) as Supplier[];
  } catch {
    localStorage.removeItem(STORAGE_KEYS.suppliers);
    return fallbackSuppliers;
  }
}

export function storeSuppliers(suppliers: Supplier[]) {
  localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(suppliers));
}
