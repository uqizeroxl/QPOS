import { createContext } from "react";
import type {
  Supplier,
  SupplierFormValues,
} from "../pages/supplier/SupplierTypes";

export type SupplierResult =
  | { ok: true; supplier: Supplier }
  | { ok: false; message: string };

export type SupplierContextValue = {
  suppliers: Supplier[];
  isLoading: boolean;
  fetchSuppliers: () => Promise<void>;
  addSupplier: (values: SupplierFormValues) => Promise<SupplierResult>;
  updateSupplier: (
    supplierId: number,
    values: SupplierFormValues,
  ) => Promise<SupplierResult>;
  deleteSupplier: (supplierId: number) => Promise<SupplierResult>;
};

export const SupplierContext = createContext<SupplierContextValue | undefined>(
  undefined,
);
