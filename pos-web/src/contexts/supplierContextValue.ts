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
  addSupplier: (values: SupplierFormValues) => SupplierResult;
  updateSupplier: (
    supplierId: number,
    values: SupplierFormValues,
  ) => SupplierResult;
  deleteSupplier: (supplierId: number) => SupplierResult;
};

export const SupplierContext = createContext<SupplierContextValue | undefined>(
  undefined,
);
