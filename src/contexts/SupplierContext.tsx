import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  Supplier,
  SupplierFormValues,
} from "../pages/supplier/SupplierTypes";
import { getStoredSuppliers, storeSuppliers } from "../utils/supplierStorage";
import { SupplierContext } from "./supplierContextValue";
import type { SupplierResult } from "./supplierContextValue";

type SupplierProviderProps = {
  children: ReactNode;
};

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function validateSupplierName(
  suppliers: Supplier[],
  values: SupplierFormValues,
  editingSupplierId?: number,
) {
  const name = values.name.trim();

  if (!name) {
    return "Nama supplier wajib diisi.";
  }

  const isDuplicate = suppliers.some(
    (supplier) =>
      supplier.id !== editingSupplierId &&
      normalizeName(supplier.name) === normalizeName(name),
  );

  if (isDuplicate) {
    return "Nama supplier tidak boleh duplikat.";
  }

  return "";
}

function sanitizeSupplierValues(values: SupplierFormValues) {
  return {
    name: values.name.trim(),
    phone: values.phone?.trim() || undefined,
    address: values.address?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
  };
}

export function SupplierProvider({ children }: SupplierProviderProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    getStoredSuppliers(),
  );

  const commitSuppliers = useCallback((nextSuppliers: Supplier[]) => {
    setSuppliers(nextSuppliers);
    storeSuppliers(nextSuppliers);
  }, []);

  const addSupplier = useCallback(
    (values: SupplierFormValues): SupplierResult => {
      const message = validateSupplierName(suppliers, values);

      if (message) {
        return { ok: false, message };
      }

      const now = new Date().toISOString();
      const supplier: Supplier = {
        ...sanitizeSupplierValues(values),
        id: Date.now(),
        createdAt: now,
        updatedAt: now,
      };

      commitSuppliers([supplier, ...suppliers]);
      return { ok: true, supplier };
    },
    [commitSuppliers, suppliers],
  );

  const updateSupplier = useCallback(
    (supplierId: number, values: SupplierFormValues): SupplierResult => {
      const message = validateSupplierName(suppliers, values, supplierId);

      if (message) {
        return { ok: false, message };
      }

      const currentSupplier = suppliers.find(
        (supplier) => supplier.id === supplierId,
      );

      if (!currentSupplier) {
        return { ok: false, message: "Supplier tidak ditemukan." };
      }

      const updatedSupplier: Supplier = {
        ...currentSupplier,
        ...sanitizeSupplierValues(values),
        updatedAt: new Date().toISOString(),
      };

      commitSuppliers(
        suppliers.map((supplier) =>
          supplier.id === supplierId ? updatedSupplier : supplier,
        ),
      );

      return { ok: true, supplier: updatedSupplier };
    },
    [commitSuppliers, suppliers],
  );

  const deleteSupplier = useCallback(
    (supplierId: number): SupplierResult => {
      const currentSupplier = suppliers.find(
        (supplier) => supplier.id === supplierId,
      );

      if (!currentSupplier) {
        return { ok: false, message: "Supplier tidak ditemukan." };
      }

      commitSuppliers(
        suppliers.filter((supplier) => supplier.id !== supplierId),
      );

      return { ok: true, supplier: currentSupplier };
    },
    [commitSuppliers, suppliers],
  );

  const value = useMemo(
    () => ({ suppliers, addSupplier, updateSupplier, deleteSupplier }),
    [addSupplier, deleteSupplier, suppliers, updateSupplier],
  );

  return (
    <SupplierContext.Provider value={value}>
      {children}
    </SupplierContext.Provider>
  );
}
