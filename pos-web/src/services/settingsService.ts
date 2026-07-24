import axios from "axios";

import { apiService } from "./api/apiService";

export type ProductDatasetResetResult = {
  stockHistories: number;
  products: number;
  categories: number;
  suppliers: number;
};

export type ReceiptFooterSettings = {
  receiptFooter: string;
};

export class SettingsApiError extends Error {}

export const settingsService = {
  getReceiptFooter: async () => {
    try {
      const response = await apiService.get<ReceiptFooterSettings>(
        "/settings/receipt-footer",
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        throw new SettingsApiError(
          error.response?.data?.message ?? "Footer struk gagal dimuat.",
        );
      }
      throw error;
    }
  },
  updateReceiptFooter: async (receiptFooter: string) => {
    try {
      const response = await apiService.put<
        ReceiptFooterSettings,
        ReceiptFooterSettings
      >("/settings/receipt-footer", { receiptFooter });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        throw new SettingsApiError(
          error.response?.data?.message ?? "Footer struk gagal disimpan.",
        );
      }
      throw error;
    }
  },
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
