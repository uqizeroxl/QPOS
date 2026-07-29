import axios from "axios";
import axiosInstance from "./api/axiosInstance";
import { apiService } from "./api/apiService";
import { productCacheService } from "./storage/product-cache.service";
import { cacheService } from "./storage/cache.service";
import type {
  Product,
  ProductFormValues,
  ProductApiItem,
  ProductListParams,
  CreateProductPayload,
  UpdateProductPayload,
} from "../types/product";
import type {
  StockAdjustmentType,
  StockAdjustmentPayload,
  StockHistoryItem,
  StockReferenceType,
  StockHistoryListItem,
  StockHistoryListParams,
  StockHistoryPagination,
  RestockProductPayload,
  RestockProductResult,
  StockAdjustmentApiResponse,
  ProductDatasetPreview,
  ProductDatasetImportResult,
  BulkDeleteProductsResult,
  BulkUpdateProductsResult,
} from "../types/stock";
import type { BulkProductDraft } from "../types/product";

type ProductListApiResponse = {
  data: ProductApiItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type { StockAdjustmentType, StockAdjustmentPayload, StockHistoryItem, StockReferenceType, StockHistoryListItem, StockHistoryListParams, StockHistoryPagination, RestockProductPayload, RestockProductResult, ProductDatasetPreview, ProductDatasetImportResult, BulkDeleteProductsResult, BulkUpdateProductsResult, ProductListParams };

export type BulkProductUpdate = BulkProductDraft;

function buildProductPayload(values: ProductFormValues): CreateProductPayload {
  return {
    barcode: values.barcode,
    name: values.name,
    categoryId: values.categoryId ?? "",
    purchasePrice: values.purchasePrice,
    sellingPrice: values.sellingPrice,
    stock: values.stock,
    minimumStock: values.minimumStock,
    status: values.status === "Aktif" ? "ACTIVE" : "INACTIVE",
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
    barcode: product.barcode ?? "",
    name: product.name,
    categoryId: product.category?.id ?? product.categoryId,
    category: (product.category?.name ?? product.categoryId).toUpperCase(),
    purchasePrice:
      product.purchasePrice === null ? null : Number(product.purchasePrice),
    sellingPrice: Number(product.sellingPrice),
    stock: product.stock,
    minimumStock: product.minimumStock,
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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function notifyProductsChanged() {
  window.dispatchEvent(new Event("qpos:products-changed"));
}

export const productService = {
  getProducts: async ({
    page = 1,
    limit = 100,
    search,
    category,
  }: Partial<ProductListParams> = {}) => {
    try {
      const response = await axiosInstance.get<ProductListApiResponse>(
        "/products",
        {
          params: { page, limit, search, category },
        },
      );

      const products = response.data.data.map(mapProduct);

      if (!search && !category) {
        const cachedProducts = products.map((p) => ({
          id: p.id,
          barcode: p.barcode,
          name: p.name,
          category: p.category,
          price: p.sellingPrice,
          stock: p.stock,
        }));
        void productCacheService.setAll(cachedProducts);
      }

      return {
        products,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
        totalPages: response.data.totalPages,
      };
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
      await cacheService.clear();
      notifyProductsChanged();
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
      await cacheService.clear();
      notifyProductsChanged();
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
      notifyProductsChanged();
      return mapProduct(response.data);
    } catch (error) {
      handleProductError(error);
    }
  },
  bulkDeleteProducts: async (productIds: string[]) => {
    try {
      const response = await apiService.post<
        BulkDeleteProductsResult,
        { productIds: string[] }
      >("/products/bulk-delete", { productIds });
      notifyProductsChanged();
      return response.data;
    } catch (error) {
      handleProductError(error);
    }
  },
  bulkUpdateProducts: async (products: BulkProductUpdate[]) => {
    try {
      const response = await apiService.put<
        BulkUpdateProductsResult,
        { products: BulkProductUpdate[] }
      >("/products/bulk-update", { products });
      return {
        updatedCount: response.data.updatedCount,
        products: response.data.products.map(mapProduct),
      };
    } catch (error) {
      handleProductError(error);
    }
  },
  generateBarcode: async (productId: string) => {
    try {
      const response = await apiService.post<ProductApiItem>(
        `/products/${productId}/barcode`,
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
  getStockHistories: async (params: StockHistoryListParams) => {
    try {
      return await apiService.get<StockHistoryListItem[]>(
        "/products/stock-history",
        { params },
      ) as {
        data: StockHistoryListItem[];
        pagination: StockHistoryPagination;
      };
    } catch (error) {
      handleProductError(error);
    }
  },
  restockProducts: async (payload: RestockProductPayload) => {
    try {
      const response = await apiService.post<
        RestockProductResult,
        RestockProductPayload
      >("/products/restocks", payload);

      return {
        products: response.data.products.map(mapProduct),
        histories: response.data.histories,
      };
    } catch (error) {
      handleProductError(error);
    }
  },
  searchRestockProducts: async (keyword: string) => {
    try {
      const response = await apiService.get<ProductApiItem[]>(
        "/products/restocks/search",
        { params: { keyword } },
      );

      return response.data.map(mapProduct);
    } catch (error) {
      handleProductError(error);
    }
  },
  searchCashierProducts: async (keyword: string) => {
    try {
      const response = await apiService.get<ProductApiItem[]>(
        "/products/cashier/search",
        { params: { keyword } },
      );

      return response.data.map(mapProduct);
    } catch (error) {
      if (axios.isAxiosError(error) && !error.response) {
        const cached = await productCacheService.search(keyword);
        return cached.map((p) => ({
          id: p.id,
          barcode: p.barcode,
          name: p.name,
          category: p.category,
          sellingPrice: p.price,
          stock: p.stock,
          purchasePrice: null,
          categoryId: "",
          status: "Aktif" as const,
          createdAt: "",
          updatedAt: "",
        }));
      }
      handleProductError(error);
    }
  },
  exportDataset: async () => {
    try {
      const response = await axiosInstance.get<Blob>("/products/dataset/export", {
        responseType: "blob",
      });
      const today = new Date().toISOString().slice(0, 10);

      downloadBlob(response.data, `dataset_produk_${today}.xlsx`);
    } catch (error) {
      handleProductError(error);
    }
  },
  previewDatasetImport: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiService.post<ProductDatasetPreview, FormData>(
        "/products/dataset/preview",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      return response.data;
    } catch (error) {
      handleProductError(error);
    }
  },
  importDataset: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiService.post<ProductDatasetImportResult, FormData>(
        "/products/dataset/import",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      await cacheService.clear();
      notifyProductsChanged();
      return response.data;
    } catch (error) {
      handleProductError(error);
    }
  },
};
