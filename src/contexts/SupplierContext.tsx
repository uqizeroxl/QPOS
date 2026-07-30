import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  SupplierApiError,
  supplierService,
} from "../services/supplierService";
import { SupplierContext } from "./supplierContextValue";
import type { Supplier, SupplierFormValues } from "../types/supplier";
import type { SupplierResult } from "./supplierContextValue";

type SupplierProviderProps = {
  children: ReactNode;
};

export function SupplierProvider({ children }: SupplierProviderProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchSuppliers = useCallback(async (search?: string) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const nextSuppliers = await supplierService.getSuppliers(search);
      setSuppliers(nextSuppliers);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      window.dispatchEvent(
        new CustomEvent("app:toast", {
          detail: {
            message: "Gagal memuat supplier. Data mungkin tidak tersedia.",
            type: "warning",
          },
        }),
      );
      setErrorMessage(error instanceof Error ? error.message : "Supplier gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
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
            error instanceof Error ? error.message : "Supplier gagal dihapus.",
          productCount:
            error instanceof SupplierApiError
              ? error.productCount
              : undefined,
        };
      }
    },
    [fetchSuppliers],
  );

  const setSupplierActive = useCallback(
    async (
      supplier: Supplier,
      isActive: boolean,
    ): Promise<SupplierResult> => {
      try {
        const updatedSupplier = await supplierService.setSupplierActive(
          supplier.id,
          {
            name: supplier.name,
            phone: supplier.phone,
            email: supplier.email,
            address: supplier.address,
            notes: supplier.notes,
          },
          isActive,
        );
        await fetchSuppliers();

        return { ok: true, supplier: updatedSupplier };
      } catch (error) {
        return {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : `Supplier gagal ${isActive ? "diaktifkan" : "dinonaktifkan"}.`,
        };
      }
    },
    [fetchSuppliers],
  );

  const value = useMemo(
    () => ({
      suppliers,
      isLoading,
      errorMessage,
      fetchSuppliers,
      addSupplier,
      updateSupplier,
      setSupplierActive,
      deleteSupplier,
    }),
    [
      addSupplier,
      setSupplierActive,
      deleteSupplier,
      fetchSuppliers,
      suppliers,
      isLoading,
      errorMessage,
      updateSupplier,
    ],
  );

  return (
    <SupplierContext.Provider value={value}>
      {children}
    </SupplierContext.Provider>
  );
}
