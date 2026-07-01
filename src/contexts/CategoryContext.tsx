import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useProducts } from "../hooks/useProducts";
import { getStoredCategories, storeCategories } from "../utils/categoryStorage";
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
  editingCategoryId?: number,
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
  const { products, renameProductCategory } = useProducts();
  const [baseCategories, setBaseCategories] = useState<Category[]>(() =>
    getStoredCategories(),
  );

  const productCountByCategory = useMemo(
    () =>
      products.reduce<Record<string, number>>((counts, product) => {
        counts[product.category] = (counts[product.category] ?? 0) + 1;
        return counts;
      }, {}),
    [products],
  );

  const categories = useMemo(
    () =>
      baseCategories.map((category) => ({
        ...category,
        productCount: productCountByCategory[category.name] ?? 0,
      })),
    [baseCategories, productCountByCategory],
  );

  const commitCategories = useCallback((nextCategories: Category[]) => {
    setBaseCategories(nextCategories);
    storeCategories(nextCategories);
  }, []);

  const addCategory = useCallback(
    (values: CategoryFormValues): CategoryResult => {
      const message = validateCategoryName(baseCategories, values);

      if (message) {
        return { ok: false, message };
      }

      const now = new Date().toISOString();
      const category: Category = {
        ...values,
        name: values.name.trim(),
        description: values.description.trim(),
        id: Date.now(),
        productCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      const nextCategories = [category, ...baseCategories];

      commitCategories(nextCategories);
      return { ok: true, category };
    },
    [baseCategories, commitCategories],
  );

  const updateCategory = useCallback(
    (categoryId: number, values: CategoryFormValues): CategoryResult => {
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

      const updatedCategory: Category = {
        ...currentCategory,
        ...values,
        name: values.name.trim(),
        description: values.description.trim(),
        updatedAt: new Date().toISOString(),
      };

      commitCategories(
        baseCategories.map((category) =>
          category.id === categoryId ? updatedCategory : category,
        ),
      );
      renameProductCategory(currentCategory.name, updatedCategory.name);

      return { ok: true, category: updatedCategory };
    },
    [baseCategories, commitCategories, renameProductCategory],
  );

  const deleteCategory = useCallback(
    (categoryId: number): CategoryResult => {
      const currentCategory = categories.find(
        (category) => category.id === categoryId,
      );

      if (!currentCategory) {
        return { ok: false, message: "Kategori tidak ditemukan." };
      }

      if (currentCategory.productCount > 0) {
        return {
          ok: false,
          message: "Kategori tidak dapat dihapus karena masih digunakan oleh produk.",
        };
      }

      commitCategories(
        baseCategories.filter((category) => category.id !== categoryId),
      );

      return { ok: true, category: currentCategory };
    },
    [baseCategories, categories, commitCategories],
  );

  const activeCategoryNames = useMemo(
    () =>
      categories
        .filter((category) => category.status === "Aktif")
        .map((category) => category.name),
    [categories],
  );

  const value = useMemo(
    () => ({
      categories,
      activeCategoryNames,
      addCategory,
      updateCategory,
      deleteCategory,
    }),
    [
      activeCategoryNames,
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
