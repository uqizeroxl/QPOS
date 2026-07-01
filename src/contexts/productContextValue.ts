import { createContext } from "react";
import type { Product, ProductFormValues } from "../pages/product/ProductTypes";

export type ProductStockAdjustment = {
  productId: number;
  quantity: number;
};

export type ProductStockAdjustmentResult =
  | { ok: true }
  | { ok: false; message: string };

export type ProductContextValue = {
  products: Product[];
  addProduct: (values: ProductFormValues) => Product;
  updateProduct: (productId: number, values: ProductFormValues) => Product | null;
  deleteProduct: (productId: number) => Product | null;
  decreaseProductStock: (
    adjustments: ProductStockAdjustment[],
  ) => ProductStockAdjustmentResult;
  renameProductCategory: (oldCategory: string, newCategory: string) => void;
};

export const ProductContext = createContext<ProductContextValue | undefined>(
  undefined,
);
