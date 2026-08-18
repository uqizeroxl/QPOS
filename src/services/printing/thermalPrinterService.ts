import axios from "axios";

import { apiService } from "../api/apiService";
import type { SalesTransaction } from "../../types/cashier";

export class ThermalPrinterApiError extends Error {}

export class ThermalPrinterConnectionError extends Error {}

type PrintReceiptPayload = SalesTransaction;

export const thermalPrinterService = {
  printReceipt: async (transaction: PrintReceiptPayload) => {
    try {
      const response = await apiService.post<{ printer: string }>(
        "/printer/receipt",
        transaction,
      );
      return response;
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        throw new ThermalPrinterApiError(
          error.response?.data?.message ?? "Gagal mencetak melalui printer thermal.",
        );
      }
      throw error;
    }
  },
  testConnection: async () => {
    try {
      const response = await apiService.post<{ printer: string }>(
        "/printer/test-connection",
      );
      return response;
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        throw new ThermalPrinterConnectionError(
          error.response?.data?.message ?? "Gagal menghubungkan printer thermal.",
        );
      }
      throw error;
    }
  },
  scanPrinters: async () => {
    try {
      const response = await apiService.get<{
        defaultPrinter: string;
        printers: Array<{ name: string; isDefault: boolean; status: string }>;
      }>("/printer/scan-printers");
      return response.data;
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        throw new ThermalPrinterConnectionError(
          error.response?.data?.message ?? "Gagal memindai printer sistem.",
        );
      }
      throw error;
    }
  },
};
