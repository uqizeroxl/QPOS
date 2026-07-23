import { createContext } from "react";
import type { Product, ProductFormValues } from "../pages/product/ProductTypes";
import type {
  ProductListParams,
  StockAdjustmentPayload,
  StockHistoryItem,
} from "../services/productService";

export type ProductStockAdjustment = {
  productId: string;
  quantity: number;
};

export type ProductStockAdjustmentResult =
  | { ok: true }
  | { ok: false; message: string };

export type ProductContextValue = {
  products: Product[];
  totalProducts: number;
  isLoading: boolean;
  errorMessage: string;
  fetchProducts: (params?: Partial<ProductListParams>) => Promise<void>;
  createProduct: (values: ProductFormValues) => Promise<Product>;
  updateProduct: (productId: string, values: ProductFormValues) => Promise<Product>;
  deleteProduct: (productId: string) => Promise<Product>;
  adjustStock: (
    productId: string,
    payload: StockAdjustmentPayload,
  ) => Promise<Product>;
  getStockHistory: (productId: string) => Promise<StockHistoryItem[]>;
  decreaseProductStock: (
    adjustments: ProductStockAdjustment[],
  ) => ProductStockAdjustmentResult;
  renameProductCategory: (oldCategory: string, newCategory: string) => void;
};

export const ProductContext = createContext<ProductContextValue | undefined>(
  undefined,
);
