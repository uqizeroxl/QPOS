import axios from "axios";

import { apiService } from "./api/apiService";

export type ProductDatasetResetResult = {
  stockHistories: number;
  products: number;
  categories: number;
  suppliers: number;
};

export class SettingsApiError extends Error {}

export const settingsService = {
  resetProductDataset: async () => {
    try {
      const response = await apiService.post<ProductDatasetResetResult>(
        "/settings/product-dataset/reset",
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        throw new SettingsApiError(
          error.response?.data?.message ?? "Dataset produk gagal dihapus.",
        );
      }

      throw error;
    }
  },
};
