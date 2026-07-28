import axios from "axios";

import { apiService } from "./api/apiService";
import type { ProductDatasetResetResult, ReceiptFooterSettings } from "../types/report";

export type { ProductDatasetResetResult, ReceiptFooterSettings };

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
  inviteOwner: async (email: string) => {
    try {
      const response = await apiService.post<{
        inviteLink: string;
        email: string;
        expiresAt: string;
      }>("/settings/invite-owner", { email });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        throw new SettingsApiError(
          error.response?.data?.message ?? "Gagal membuat undangan.",
        );
      }
      throw error;
    }
  },
  changeStoreOwner: async (username: string, password: string) => {
    try {
      const response = await apiService.post<{ newOwnerName: string }>(
        "/settings/change-owner",
        { username, password },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        throw new SettingsApiError(
          error.response?.data?.message ?? "Gagal mengubah kepemilikan toko.",
        );
      }
      throw error;
    }
  },
  deleteCompany: async (confirmation: string) => {
    try {
      await apiService.post("/settings/delete-company", { confirmation });
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        throw new SettingsApiError(
          error.response?.data?.message ?? "Gagal menghapus perusahaan.",
        );
      }
      throw error;
    }
  },
};
