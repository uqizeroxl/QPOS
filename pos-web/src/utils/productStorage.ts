import { STORAGE_KEYS } from "../constants/app";
import type { Product } from "../pages/product/ProductTypes";

export function getStoredProducts(fallbackProducts: Product[] = []) {
  const storedProducts = localStorage.getItem(STORAGE_KEYS.products);

  if (!storedProducts) {
    return fallbackProducts;
  }

  try {
    return JSON.parse(storedProducts) as Product[];
  } catch {
    localStorage.removeItem(STORAGE_KEYS.products);
    return fallbackProducts;
  }
}

export function storeProducts(products: Product[]) {
  localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
}
