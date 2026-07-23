import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useProducts } from "../hooks/useProducts";
import {
  CategoryApiError,
  categoryService,
} from "../services/categoryService";
import { CategoryContext } from "./categoryContextValue";
import type { Category, CategoryFormValues } from "../pages/category/CategoryTypes";
import type { CategoryResult } from "./categoryContextValue";

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
  const { products } = useProducts();
  const [baseCategories, setBaseCategories] = useState<Category[]>([]);

  const fetchCategories = useCallback(async () => {
    const nextCategories = await categoryService.getCategories();
    setBaseCategories(nextCategories);
  }, []);

  useEffect(() => {
    void fetchCategories().catch((error) => {
      console.error("Failed to fetch categories:", error);
    });
  }, [fetchCategories]);

  const productCountByCategory = useMemo(
    () =>
      products.reduce<Record<string, number>>((counts, product) => {
        if (!product.categoryId) {
          return counts;
        }

        counts[product.categoryId] = (counts[product.categoryId] ?? 0) + 1;
        return counts;
      }, {}),
    [products],
  );

  const categories = useMemo(
    () =>
      baseCategories.map((category) => ({
        ...category,
        productCount: productCountByCategory[category.id] ?? 0,
      })),
    [baseCategories, productCountByCategory],
  );

  const addCategory = useCallback(
    async (values: CategoryFormValues): Promise<CategoryResult> => {
      const message = validateCategoryName(baseCategories, values);

      if (message) {
        return { ok: false, message };
      }

      try {
        const category = await categoryService.createCategory({
          ...values,
          name: values.name.trim(),
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
    [baseCategories, fetchCategories],
  );

  const updateCategory = useCallback(
    async (
      categoryId: string,
      values: CategoryFormValues,
    ): Promise<CategoryResult> => {
      const message = validateCategoryName(baseCategories, values, categoryId);

      if (message) {
        return { ok: false, message };
      }

      const currentCategory = baseCategories.find(
        (category) => category.id === categoryId,
      );

      if (!currentCategory) {
        return { ok: false, message: "Kategori tidak ditemukan." };
      }

      try {
        const category = await categoryService.updateCategory(categoryId, {
          ...values,
          name: values.name.trim(),
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
    [baseCategories, fetchCategories],
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
