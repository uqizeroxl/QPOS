import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { STORAGE_KEYS } from "../constants/app";
import { apiService } from "../services/api/apiService";
import { CategoryContext } from "./categoryContextValue";
import type { CategoryResult } from "./categoryContextValue";
import type { Category, CategoryFormValues } from "../pages/category/CategoryTypes";

type CategoryProviderProps = {
  children: ReactNode;
};

type ApiCategory = Category & { productCount?: number };

export function CategoryProvider({ children }: CategoryProviderProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem(STORAGE_KEYS.authToken)));

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiService.get<ApiCategory[]>("/categories");
      setCategories(
        response.data.map((c) => ({
          ...c,
          productCount: c.productCount ?? 0,
        })),
      );
    } catch {
      // keep previous state on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      void apiService.get<ApiCategory[]>("/categories").then((response) => {
        if (!cancelled) {
          setCategories(
            response.data.map((c) => ({
              ...c,
              productCount: c.productCount ?? 0,
            })),
          );
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

  const activeCategoryNames = useMemo(
    () =>
      categories
        .filter((category) => category.status === "Aktif")
        .map((category) => category.name),
    [categories],
  );

  const addCategory = useCallback(
    async (values: CategoryFormValues): Promise<CategoryResult> => {
      try {
        const response = await apiService.post<ApiCategory>("/categories", values);
        const category: Category = {
          ...response.data,
          productCount: response.data.productCount ?? 0,
        };
        setCategories((current) => [category, ...current]);
        return { ok: true, category };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal menambahkan kategori";
        return { ok: false, message };
      }
    },
    [],
  );

  const updateCategory = useCallback(
    async (categoryId: number, values: CategoryFormValues): Promise<CategoryResult> => {
      try {
        const response = await apiService.put<ApiCategory>(`/categories/${categoryId}`, values);
        const category: Category = {
          ...response.data,
          productCount: response.data.productCount ?? 0,
        };
        setCategories((current) =>
          current.map((c) => (c.id === categoryId ? category : c)),
        );
        return { ok: true, category };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal memperbarui kategori";
        return { ok: false, message };
      }
    },
    [],
  );

  const deleteCategory = useCallback(
    async (categoryId: number): Promise<CategoryResult> => {
      try {
        const current = categories.find((c) => c.id === categoryId);
        await apiService.delete(`/categories/${categoryId}`);
        setCategories((prev) => prev.filter((c) => c.id !== categoryId));
        return { ok: true, category: current! };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal menghapus kategori";
        return { ok: false, message };
      }
    },
    [categories],
  );

  const value = useMemo(
    () => ({
      categories,
      activeCategoryNames,
      isLoading,
      fetchCategories,
      addCategory,
      updateCategory,
      deleteCategory,
    }),
    [
      categories,
      activeCategoryNames,
      isLoading,
      fetchCategories,
      addCategory,
      updateCategory,
      deleteCategory,
    ],
  );

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}
