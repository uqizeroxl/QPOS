import { createContext } from "react";
import type { Product, ProductFormValues } from "../pages/product/ProductTypes";

export type ProductContextValue = {
  products: Product[];
  isLoading: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (values: ProductFormValues) => Promise<{ ok: boolean; product?: Product; error?: string }>;
  updateProduct: (productId: number, values: ProductFormValues) => Promise<{ ok: boolean; product?: Product; error?: string }>;
  deleteProduct: (productId: number) => Promise<{ ok: boolean; error?: string }>;
};

export const ProductContext = createContext<ProductContextValue | undefined>(
  undefined,
);
