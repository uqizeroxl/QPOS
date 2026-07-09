import axios from "axios";
import { apiService } from "./api/apiService";
import type { Product, ProductFormValues } from "../pages/product/ProductTypes";

type ProductApiCategory = {
  id: string;
  name: string;
};

type ProductApiItem = {
  id: string;
  barcode: string;
  name: string;
  categoryId: string;
  category?: ProductApiCategory | null;
  purchasePrice: string | number;
  sellingPrice: string | number;
  stock: number;
  status: "ACTIVE" | "INACTIVE" | "Aktif" | "Nonaktif";
};

type CreateProductPayload = {
  barcode: string;
  name: string;
  categoryId: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  status: "Aktif" | "Nonaktif";
};

type UpdateProductPayload = CreateProductPayload;

export type StockAdjustmentType = "ADD" | "REDUCE" | "SET";

export type StockAdjustmentPayload = {
  type: StockAdjustmentType;
  quantity: number;
  note: string;
};

export type StockHistoryItem = {
  id: string;
  productId: string;
  type: StockAdjustmentType;
  quantity: number;
  previousStock: number;
  currentStock: number;
  note: string;
  createdAt: string;
};

type StockAdjustmentApiResponse = {
  product: ProductApiItem;
  history: StockHistoryItem;
};

function buildProductPayload(values: ProductFormValues): CreateProductPayload {
  return {
    barcode: values.barcode,
    name: values.name,
    categoryId: values.categoryId ?? "",
    purchasePrice: values.purchasePrice,
    sellingPrice: values.sellingPrice,
    stock: values.stock,
    status: values.status,
  };
}

export class ProductApiError extends Error {
  public readonly status?: number;

  constructor(
    message: string,
    status?: number,
  ) {
    super(message);
    this.status = status;
  }
}

function normalizeStatus(status: ProductApiItem["status"]) {
  return status === "ACTIVE" ? "Aktif" : status === "INACTIVE" ? "Nonaktif" : status;
}

function mapProduct(product: ProductApiItem): Product {
  return {
    id: product.id,
    barcode: product.barcode,
    name: product.name,
    categoryId: product.category?.id ?? product.categoryId,
    category: product.category?.name ?? product.categoryId,
    purchasePrice: Number(product.purchasePrice),
    sellingPrice: Number(product.sellingPrice),
    stock: product.stock,
    status: normalizeStatus(product.status),
  };
}

function handleProductError(error: unknown): never {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (!error.response) {
      throw new ProductApiError("Backend tidak dapat diakses.");
    }

    throw new ProductApiError(
      error.response.data?.message ?? "Terjadi kesalahan pada server.",
      error.response.status,
    );
  }

  throw error;
}

export const productService = {
  getProducts: async () => {
    try {
      const response = await apiService.get<ProductApiItem[]>("/products");
      return response.data.map(mapProduct);
    } catch (error) {
      handleProductError(error);
    }
  },

  createProduct: async (values: ProductFormValues) => {
    const payload = buildProductPayload(values);

    try {
      const response = await apiService.post<ProductApiItem, CreateProductPayload>(
        "/products",
        payload,
      );

      return mapProduct(response.data);
    } catch (error) {
      handleProductError(error);
    }
  },
  updateProduct: async (productId: string, values: ProductFormValues) => {
    const payload: UpdateProductPayload = buildProductPayload(values);

    try {
      const response = await apiService.put<ProductApiItem, UpdateProductPayload>(
        `/products/${productId}`,
        payload,
      );

      return mapProduct(response.data);
    } catch (error) {
      handleProductError(error);
    }
  },
  deleteProduct: async (productId: string) => {
    try {
      const response = await apiService.delete<ProductApiItem>(
        `/products/${productId}`,
      );

      return mapProduct(response.data);
    } catch (error) {
      handleProductError(error);
    }
  },
  adjustStock: async (
    productId: string,
    payload: StockAdjustmentPayload,
  ) => {
    try {
      const response = await apiService.post<
        StockAdjustmentApiResponse,
        StockAdjustmentPayload
      >(`/products/${productId}/stock-adjustments`, payload);

      return {
        product: mapProduct(response.data.product),
        history: response.data.history,
      };
    } catch (error) {
      handleProductError(error);
    }
  },
  getStockHistory: async (productId: string) => {
    try {
      const response = await apiService.get<StockHistoryItem[]>(
        `/products/${productId}/stock-history`,
      );

      return response.data;
    } catch (error) {
      handleProductError(error);
    }
  },
};
