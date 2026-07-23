import axios from "axios";
import { apiService } from "./api/apiService";
import type { Category, CategoryStatus } from "../pages/category/CategoryTypes";

type CategoryApiItem = {
  id: string;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE" | "Aktif" | "Nonaktif";
  createdAt: string;
  updatedAt: string;
};

type CreateCategoryPayload = {
  name: string;
  description: string;
  status: CategoryStatus;
};

type UpdateCategoryPayload = CreateCategoryPayload;

export class CategoryApiError extends Error {
  public readonly status?: number;
  public readonly productCount?: number;

  constructor(message: string, status?: number, productCount?: number) {
    super(message);
    this.status = status;
    this.productCount = productCount;
  }
}

function normalizeStatus(status: CategoryApiItem["status"]): CategoryStatus {
  return status === "ACTIVE" ? "Aktif" : status === "INACTIVE" ? "Nonaktif" : status;
}

function mapCategory(category: CategoryApiItem): Category {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    status: normalizeStatus(category.status),
    productCount: 0,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

function handleCategoryError(error: unknown): never {
  if (axios.isAxiosError<{ message?: string; productCount?: number }>(error)) {
    if (!error.response) {
      throw new CategoryApiError("Backend tidak dapat diakses.");
    }

    throw new CategoryApiError(
      error.response.data?.message ?? "Terjadi kesalahan pada server.",
      error.response.status,
      error.response.data?.productCount,
    );
  }

  throw error;
}

export const categoryService = {
  getCategories: async () => {
    try {
      const response = await apiService.get<CategoryApiItem[]>("/categories");
      return response.data.map(mapCategory);
    } catch (error) {
      handleCategoryError(error);
    }
  },
  createCategory: async (payload: CreateCategoryPayload) => {
    try {
      const response = await apiService.post<CategoryApiItem, CreateCategoryPayload>(
        "/categories",
        payload,
      );

      return mapCategory(response.data);
    } catch (error) {
      handleCategoryError(error);
    }
  },
  updateCategory: async (categoryId: string, payload: UpdateCategoryPayload) => {
    try {
      const response = await apiService.put<CategoryApiItem, UpdateCategoryPayload>(
        `/categories/${categoryId}`,
        payload,
      );

      return mapCategory(response.data);
    } catch (error) {
      handleCategoryError(error);
    }
  },
  deleteCategory: async (categoryId: string) => {
    try {
      const response = await apiService.delete<CategoryApiItem>(
        `/categories/${categoryId}`,
      );

      return mapCategory(response.data);
    } catch (error) {
      handleCategoryError(error);
    }
  },
};
