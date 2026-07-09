import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supplierService } from "../services/supplierService";
import { SupplierContext } from "./supplierContextValue";
import type { Supplier, SupplierFormValues } from "../pages/supplier/SupplierTypes";
import type { SupplierResult } from "./supplierContextValue";

type SupplierProviderProps = {
  children: ReactNode;
};

export function SupplierProvider({ children }: SupplierProviderProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const fetchSuppliers = useCallback(async (search?: string) => {
    const nextSuppliers = await supplierService.getSuppliers(search);
    setSuppliers(nextSuppliers);
  }, []);

  const addSupplier = useCallback(
    async (values: SupplierFormValues): Promise<SupplierResult> => {
      try {
        const supplier = await supplierService.createSupplier(values);
        await fetchSuppliers();

        return { ok: true, supplier };
      } catch (error) {
        return {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Supplier gagal ditambahkan.",
        };
      }
    },
    [fetchSuppliers],
  );

  const updateSupplier = useCallback(
    async (
      supplierId: string,
      values: SupplierFormValues,
    ): Promise<SupplierResult> => {
      try {
        const supplier = await supplierService.updateSupplier(supplierId, values);
        await fetchSuppliers();

        return { ok: true, supplier };
      } catch (error) {
        return {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Supplier gagal diperbarui.",
        };
      }
    },
    [fetchSuppliers],
  );

  const deleteSupplier = useCallback(
    async (supplierId: string): Promise<SupplierResult> => {
      try {
        const supplier = await supplierService.deleteSupplier(supplierId);
        await fetchSuppliers();

        return { ok: true, supplier };
      } catch (error) {
        return {
          ok: false,
          message:
            error instanceof Error ? error.message : "Supplier gagal dinonaktifkan.",
        };
      }
    },
    [fetchSuppliers],
  );

  const value = useMemo(
    () => ({
      suppliers,
      fetchSuppliers,
      addSupplier,
      updateSupplier,
      deleteSupplier,
    }),
    [addSupplier, deleteSupplier, fetchSuppliers, suppliers, updateSupplier],
  );

  return (
    <SupplierContext.Provider value={value}>
      {children}
    </SupplierContext.Provider>
  );
}
