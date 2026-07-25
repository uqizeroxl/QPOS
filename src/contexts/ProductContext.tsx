import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { STORAGE_KEYS } from "../constants/app";
import { apiService } from "../services/api/apiService";
import { ProductContext } from "./productContextValue";
import type { Product, ProductFormValues } from "../pages/product/ProductTypes";

type ProductProviderProps = {
  children: ReactNode;
};

type ApiProduct = Product & { createdAt?: string; updatedAt?: string };

export function ProductProvider({ children }: ProductProviderProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem(STORAGE_KEYS.authToken)));

  const fetchProducts = useCallback(async () => {
    try {
      const response = await apiService.get<ApiProduct[]>("/products", {
        params: { page: 1, limit: 100 },
      });
      setProducts(response.data);
    } catch {
      // keep previous state on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      void apiService.get<ApiProduct[]>("/products", {
        params: { page: 1, limit: 100 },
      }).then((response) => {
        if (!cancelled) {
          setProducts(response.data);
        }
      }).catch(() => {}).finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    };

    if (localStorage.getItem(STORAGE_KEYS.authToken)) load();

    const onLogin = () => { setIsLoading(true); load(); };
    window.addEventListener("auth:login", onLogin);

    return () => { cancelled = true; window.removeEventListener("auth:login", onLogin); };
  }, []);

  const addProduct = useCallback(
    async (values: ProductFormValues) => {
      try {
        const response = await apiService.post<Product>("/products", values);
        setProducts((current) => [response.data, ...current]);
        return { ok: true as const, product: response.data };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal menambahkan produk";
        return { ok: false as const, error: message };
      }
    },
    [],
  );

  const updateProduct = useCallback(
    async (productId: number, values: ProductFormValues) => {
      try {
        const response = await apiService.put<Product>(`/products/${productId}`, values);
        setProducts((current) =>
          current.map((p) => (p.id === productId ? response.data : p)),
        );
        return { ok: true as const, product: response.data };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal memperbarui produk";
        return { ok: false as const, error: message };
      }
    },
    [],
  );

  const deleteProduct = useCallback(
    async (productId: number) => {
      try {
        await apiService.delete(`/products/${productId}`);
        setProducts((current) => current.filter((p) => p.id !== productId));
        return { ok: true as const };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal menghapus produk";
        return { ok: false as const, error: message };
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      products,
      isLoading,
      fetchProducts,
      addProduct,
      updateProduct,
      deleteProduct,
    }),
    [products, isLoading, fetchProducts, addProduct, updateProduct, deleteProduct],
  );

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
}
