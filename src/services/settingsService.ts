import axios from "axios";

import { apiService } from "./api/apiService";
import type { ProductDatasetResetResult, ReceiptFooterSettings } from "../types/report";
import {
  isThermalPaperProfileId,
  migrateLegacyPaperWidth,
} from "../types/settings";

export type { ProductDatasetResetResult, ReceiptFooterSettings };

export class SettingsApiError extends Error {}

type ReceiptSettingsApiResponse = Partial<ReceiptFooterSettings> & {
  receiptFooter: string;
  thermalPaperWidth?: unknown;
};

const normalizeReceiptSettings = (
  settings: ReceiptSettingsApiResponse,
): ReceiptFooterSettings => ({
  receiptFooter: settings.receiptFooter,
  thermalPaperProfile: isThermalPaperProfileId(settings.thermalPaperProfile)
    ? settings.thermalPaperProfile
    : migrateLegacyPaperWidth(settings.thermalPaperWidth),
  receiptAutoCut: settings.receiptAutoCut ?? true,
});

export const settingsService = {
  getReceiptFooter: async () => {
    try {
      const response = await apiService.get<ReceiptSettingsApiResponse>(
        "/settings/receipt-footer",
      );
      return normalizeReceiptSettings(response.data);
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        throw new SettingsApiError(
          error.response?.data?.message ?? "Footer struk gagal dimuat.",
        );
      }
      throw error;
    }
  },
  updateReceiptFooter: async (settings: ReceiptFooterSettings) => {
    try {
      const response = await apiService.put<
        ReceiptSettingsApiResponse,
        ReceiptFooterSettings
      >("/settings/receipt-footer", settings);
      return normalizeReceiptSettings(response.data);
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
