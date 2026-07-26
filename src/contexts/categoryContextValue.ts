import { createContext } from "react";
import type {
  Category,
  CategoryFormValues,
} from "../types/category";

export type CategoryResult =
  | { ok: true; category: Category }
  | { ok: false; message: string; productCount?: number };

export type CategoryContextValue = {
  categories: Category[];
  activeCategoryNames: string[];
  activeCategories: Category[];
  fetchCategories: () => Promise<void>;
  addCategory: (values: CategoryFormValues) => Promise<CategoryResult>;
  updateCategory: (
    categoryId: string,
    values: CategoryFormValues,
  ) => Promise<CategoryResult>;
  deleteCategory: (categoryId: string) => Promise<CategoryResult>;
};

export const CategoryContext = createContext<CategoryContextValue | undefined>(
  undefined,
);
