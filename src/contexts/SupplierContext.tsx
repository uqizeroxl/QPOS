import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { STORAGE_KEYS } from "../constants/app";
import { apiService } from "../services/api/apiService";
import type { Supplier, SupplierFormValues } from "../pages/supplier/SupplierTypes";
import { SupplierContext } from "./supplierContextValue";
import type { SupplierResult } from "./supplierContextValue";

type SupplierProviderProps = {
  children: ReactNode;
};

export function SupplierProvider({ children }: SupplierProviderProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem(STORAGE_KEYS.authToken)));

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await apiService.get<Supplier[]>("/suppliers/all");
      setSuppliers(response.data);
    } catch {
      // keep previous state on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEYS.authToken)) {
      return;
    }

    let cancelled = false;

    const load = () => {
      void apiService.get<Supplier[]>("/suppliers/all").then((response) => {
        if (!cancelled) {
          setSuppliers(response.data);
        }
      }).catch(() => {}).finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    };

    load();

    const onLogin = () => { setIsLoading(true); load(); };
    window.addEventListener("auth:login", onLogin);

    return () => { cancelled = true; window.removeEventListener("auth:login", onLogin); };
  }, []);

  const addSupplier = useCallback(
    async (values: SupplierFormValues): Promise<SupplierResult> => {
      try {
        const response = await apiService.post<Supplier>("/suppliers", values);
        setSuppliers((current) => [response.data, ...current]);
        return { ok: true, supplier: response.data };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal menambahkan supplier";
        return { ok: false, message };
      }
    },
    [],
  );

  const updateSupplier = useCallback(
    async (supplierId: number, values: SupplierFormValues): Promise<SupplierResult> => {
      try {
        const response = await apiService.put<Supplier>(`/suppliers/${supplierId}`, values);
        setSuppliers((current) =>
          current.map((s) => (s.id === supplierId ? response.data : s)),
        );
        return { ok: true, supplier: response.data };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal memperbarui supplier";
        return { ok: false, message };
      }
    },
    [],
  );

  const deleteSupplier = useCallback(
    async (supplierId: number): Promise<SupplierResult> => {
      try {
        const current = suppliers.find((s) => s.id === supplierId);
        await apiService.delete(`/suppliers/${supplierId}`);
        setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
        return { ok: true, supplier: current! };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal menghapus supplier";
        return { ok: false, message };
      }
    },
    [suppliers],
  );

  const value = useMemo(
    () => ({
      suppliers,
      isLoading,
      fetchSuppliers,
      addSupplier,
      updateSupplier,
      deleteSupplier,
    }),
    [suppliers, isLoading, fetchSuppliers, addSupplier, updateSupplier, deleteSupplier],
  );

  return (
    <SupplierContext.Provider value={value}>
      {children}
    </SupplierContext.Provider>
  );
}
