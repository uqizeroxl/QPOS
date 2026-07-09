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
  fetchSuppliers: (search?: string) => Promise<void>;
  addSupplier: (values: SupplierFormValues) => Promise<SupplierResult>;
  updateSupplier: (
    supplierId: string,
    values: SupplierFormValues,
  ) => Promise<SupplierResult>;
  deleteSupplier: (supplierId: string) => Promise<SupplierResult>;
};

export const SupplierContext = createContext<SupplierContextValue | undefined>(
  undefined,
);
