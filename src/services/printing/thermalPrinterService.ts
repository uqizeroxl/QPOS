import axios from "axios";

import { apiService } from "../api/apiService";
import type { SalesTransaction } from "../../types/cashier";

export class ThermalPrinterApiError extends Error {}

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
};
