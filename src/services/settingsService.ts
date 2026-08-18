import axios from "axios";

import { apiService } from "./api/apiService";
import { cacheService } from "./storage/cache.service";
import type { ProductDatasetResetResult, ReceiptFooterSettings } from "../types/report";
import type { AppSettings } from "../types/settings";
import {
  isThermalPaperProfileId,
  isPrinterBackend,
  isThermalPrinterType,
  migrateLegacyPaperWidth,
} from "../types/settings";

export type { ProductDatasetResetResult, ReceiptFooterSettings };

export class SettingsApiError extends Error {}

type ReceiptSettingsApiResponse = Partial<ReceiptFooterSettings> & {
  storeName: string;
  phone: string;
  address: string;
  receiptFooter: string;
  thermalPaperWidth?: unknown;
  thermalPrinterType?: unknown;
};

const SETTINGS_CACHE_KEY = "/settings";

const normalizeReceiptSettings = (
  settings: ReceiptSettingsApiResponse,
): AppSettings => ({
  storeName: settings.storeName,
  phone: settings.phone ?? "",
  address: settings.address ?? "",
  receiptFooter: settings.receiptFooter,
  thermalPaperProfile: isThermalPaperProfileId(settings.thermalPaperProfile)
    ? settings.thermalPaperProfile
    : migrateLegacyPaperWidth(settings.thermalPaperWidth),
  receiptAutoCut: settings.receiptAutoCut ?? true,
  printerBackend: isPrinterBackend(settings.printerBackend)
    ? settings.printerBackend
    : "NODE_THERMAL_PRINTER",
  selectedPrinterName: typeof settings.selectedPrinterName === "string"
    ? settings.selectedPrinterName
    : "",
  thermalPrinterType: isThermalPrinterType(settings.thermalPrinterType)
    ? settings.thermalPrinterType
    : "epson",
});

export const settingsService = {
  getSettings: async () => {
    try {
      const response = await apiService.get<ReceiptSettingsApiResponse>(
        SETTINGS_CACHE_KEY,
      );
      const settings = normalizeReceiptSettings(response.data);
      await cacheService.set(SETTINGS_CACHE_KEY, settings);
      return settings;
    } catch (error) {
      const cached = await cacheService.get<AppSettings>(SETTINGS_CACHE_KEY);
      if (cached) return cached;
      if (axios.isAxiosError<{ message?: string }>(error)) {
        throw new SettingsApiError(
          error.response?.data?.message ?? "Pengaturan gagal dimuat.",
        );
      }
      throw error;
    }
  },
  updateSettings: async (settings: AppSettings) => {
    try {
      const response = await apiService.put<
        ReceiptSettingsApiResponse,
        AppSettings
      >(SETTINGS_CACHE_KEY, settings);
      const normalized = normalizeReceiptSettings(response.data);
      await cacheService.set(SETTINGS_CACHE_KEY, normalized);
      return normalized;
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        throw new SettingsApiError(
          error.response?.data?.message ?? "Pengaturan gagal disimpan.",
        );
      }
      throw error;
    }
  },
  getReceiptFooter: async () => {
    try {
      const settings = await settingsService.getSettings();
      return {
        receiptFooter: settings.receiptFooter,
        thermalPaperProfile: settings.thermalPaperProfile,
        receiptAutoCut: settings.receiptAutoCut,
        printerBackend: settings.printerBackend,
        selectedPrinterName: settings.selectedPrinterName,
        thermalPrinterType: settings.thermalPrinterType,
      };
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
      const current = await settingsService.getSettings();
      const updated = await settingsService.updateSettings({
        ...current,
        ...settings,
      });
      return {
        receiptFooter: updated.receiptFooter,
        thermalPaperProfile: updated.thermalPaperProfile,
        receiptAutoCut: updated.receiptAutoCut,
        printerBackend: updated.printerBackend,
        selectedPrinterName: updated.selectedPrinterName,
        thermalPrinterType: updated.thermalPrinterType,
      };
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
