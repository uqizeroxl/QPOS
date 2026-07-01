import { STORAGE_KEYS } from "../constants/app";
import type { Category } from "../pages/category/CategoryTypes";

export function getStoredCategories(fallbackCategories: Category[] = []) {
  const storedCategories = localStorage.getItem(STORAGE_KEYS.categories);

  if (!storedCategories) {
    return fallbackCategories;
  }

  try {
    return JSON.parse(storedCategories) as Category[];
  } catch {
    localStorage.removeItem(STORAGE_KEYS.categories);
    return fallbackCategories;
  }
}

export function storeCategories(categories: Category[]) {
  localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
}
