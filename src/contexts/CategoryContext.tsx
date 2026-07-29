import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  CategoryApiError,
  categoryService,
} from "../services/categoryService";
import { CategoryContext } from "./categoryContextValue";
import type { Category, CategoryFormValues } from "../types/category";
import type { CategoryResult } from "./categoryContextValue";
import { useAuth } from "../hooks/useAuth";

type CategoryProviderProps = {
  children: ReactNode;
};

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function validateCategoryName(
  categories: Category[],
  values: CategoryFormValues,
  editingCategoryId?: string,
) {
  const name = values.name.trim();

  if (!name) {
    return "Nama kategori wajib diisi.";
  }

  if (name.length > 50) {
    return "Nama kategori maksimal 50 karakter.";
  }

  const isDuplicate = categories.some(
    (category) =>
      category.id !== editingCategoryId &&
      normalizeName(category.name) === normalizeName(name),
  );

  if (isDuplicate) {
    return "Nama kategori tidak boleh duplikat.";
  }

  return "";
}

export function CategoryProvider({ children }: CategoryProviderProps) {
  const { isAuthenticated, isLoading: isAuthLoading, token } = useAuth();
  const [categoryState, setCategoryState] = useState<{
    token: string | null;
    categories: Category[];
  }>({ token: null, categories: [] });
  const authStateRef = useRef({ isAuthenticated, isAuthLoading, token });
  const inFlightRequestRef = useRef<{
    token: string;
    promise: Promise<void>;
  } | null>(null);

  useEffect(() => {
    authStateRef.current = { isAuthenticated, isAuthLoading, token };
  }, [isAuthenticated, isAuthLoading, token]);

  const fetchCategories = useCallback(async () => {
    const authState = authStateRef.current;

    if (
      !authState.isAuthenticated ||
      authState.isAuthLoading ||
      !authState.token
    ) {
      return;
    }

    if (inFlightRequestRef.current?.token === authState.token) {
      return inFlightRequestRef.current.promise;
    }

    const requestToken = authState.token;
    const request = categoryService.getCategories().then((nextCategories) => {
      if (authStateRef.current.token === requestToken) {
        setCategoryState({ token: requestToken, categories: nextCategories });
      }
    });

    inFlightRequestRef.current = { token: requestToken, promise: request };

    try {
      await request;
    } finally {
      if (inFlightRequestRef.current?.promise === request) {
        inFlightRequestRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || isAuthLoading || !token) {
      return;
    }

    void fetchCategories().catch((error) => {
      console.error("Failed to fetch categories:", error);
    });
  }, [fetchCategories, isAuthenticated, isAuthLoading, token]);

  useEffect(() => {
    const refreshCounts = () => {
      void fetchCategories().catch((error) => {
        console.error("Failed to refresh category product counts:", error);
      });
    };
    window.addEventListener("qpos:products-changed", refreshCounts);
    return () => window.removeEventListener("qpos:products-changed", refreshCounts);
  }, [fetchCategories]);

  const categories = useMemo(
    () =>
      isAuthenticated && token === categoryState.token
        ? categoryState.categories
        : [],
    [categoryState, isAuthenticated, token],
  );

  const addCategory = useCallback(
    async (values: CategoryFormValues): Promise<CategoryResult> => {
      const message = validateCategoryName(categories, values);

      if (message) {
        return { ok: false, message };
      }

      try {
        const category = await categoryService.createCategory({
          ...values,
          name: values.name.trim().toUpperCase(),
          description: values.description.trim(),
        });

        await fetchCategories();

        return { ok: true, category };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Kategori gagal ditambahkan.";

        return { ok: false, message };
      }
    },
    [categories, fetchCategories],
  );

  const updateCategory = useCallback(
    async (
      categoryId: string,
      values: CategoryFormValues,
    ): Promise<CategoryResult> => {
      const message = validateCategoryName(categories, values, categoryId);

      if (message) {
        return { ok: false, message };
      }

      const currentCategory = categories.find(
        (category) => category.id === categoryId,
      );

      if (!currentCategory) {
        return { ok: false, message: "Kategori tidak ditemukan." };
      }

      try {
        const category = await categoryService.updateCategory(categoryId, {
          ...values,
          name: values.name.trim().toUpperCase(),
          description: values.description.trim(),
        });

        await fetchCategories();

        return { ok: true, category };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Kategori gagal diperbarui.";

        return { ok: false, message };
      }
    },
    [categories, fetchCategories],
  );

  const deleteCategory = useCallback(
    async (categoryId: string): Promise<CategoryResult> => {
      const currentCategory = categories.find(
        (category) => category.id === categoryId,
      );

      if (!currentCategory) {
        return { ok: false, message: "Kategori tidak ditemukan." };
      }

      try {
        const category = await categoryService.deleteCategory(categoryId);

        await fetchCategories();

        return { ok: true, category };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Kategori gagal dihapus.";

        return {
          ok: false,
          message,
          productCount:
            error instanceof CategoryApiError
              ? error.productCount
              : undefined,
        };
      }
    },
    [categories, fetchCategories],
  );

  const activeCategoryNames = useMemo(
    () =>
      categories
        .filter((category) => category.status === "Aktif")
        .map((category) => category.name),
    [categories],
  );

  const activeCategories = useMemo(
    () => categories.filter((category) => category.status === "Aktif"),
    [categories],
  );

  const value = useMemo(
    () => ({
      categories,
      activeCategoryNames,
      activeCategories,
      fetchCategories,
      addCategory,
      updateCategory,
      deleteCategory,
    }),
    [
      activeCategoryNames,
      activeCategories,
      fetchCategories,
      addCategory,
      categories,
      deleteCategory,
      updateCategory,
    ],
  );

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}
