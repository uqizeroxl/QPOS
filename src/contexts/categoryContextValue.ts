import { createContext } from "react";
import type {
  Category,
  CategoryFormValues,
} from "../pages/category/CategoryTypes";

export type CategoryResult =
  | { ok: true; category: Category }
  | { ok: false; message: string };

export type CategoryContextValue = {
  categories: Category[];
  activeCategoryNames: string[];
  addCategory: (values: CategoryFormValues) => CategoryResult;
  updateCategory: (
    categoryId: number,
    values: CategoryFormValues,
  ) => CategoryResult;
  deleteCategory: (categoryId: number) => CategoryResult;
};

export const CategoryContext = createContext<CategoryContextValue | undefined>(
  undefined,
);
