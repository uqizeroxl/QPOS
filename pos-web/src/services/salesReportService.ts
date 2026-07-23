import axios from "axios";
import axiosInstance from "./api/axiosInstance";
import { apiService } from "./api/apiService";

export type SalesReportPeriod =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "YEARLY"
  | "CUSTOM";

export type SalesReportFilters = {
  period: SalesReportPeriod;
  startDate?: string;
  endDate?: string;
};

export type SalesReportData = {
  period: SalesReportPeriod;
  startDate: string;
  endDate: string;
  summary: {
    totalSales: number;
    totalCost: number;
    totalProfit: number;
    totalTransactions: number;
    totalItemsSold: number;
    averageTransaction: number;
    revenue: number;
    transactions: number;
    itemsSold: number;
  };
  transactions: {
    id: string;
    invoiceNumber: string;
    cashierName: string | null;
    total: number;
    itemsSold: number;
    createdAt: string;
  }[];
};

type SalesReportApiData = Omit<SalesReportData, "summary" | "transactions"> & {
  summary: {
    totalSales: number | string;
    totalCost: number | string;
    totalProfit: number | string;
    totalTransactions: number;
    totalItemsSold: number;
    averageTransaction: number | string;
    revenue: number | string;
    transactions: number;
    itemsSold: number;
  };
  transactions: Array<
    Omit<SalesReportData["transactions"][number], "total"> & {
      total: number | string;
    }
  >;
};

export class SalesReportApiError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const mapSalesReport = (data: SalesReportApiData): SalesReportData => ({
  ...data,
  summary: {
    ...data.summary,
    totalSales: Number(data.summary.totalSales),
    totalCost: Number(data.summary.totalCost),
    totalProfit: Number(data.summary.totalProfit),
    averageTransaction: Number(data.summary.averageTransaction),
    revenue: Number(data.summary.revenue),
  },
  transactions: data.transactions.map((transaction) => ({
    ...transaction,
    total: Number(transaction.total),
  })),
});

const getParams = (filters: SalesReportFilters) => ({
  period: filters.period,
  ...(filters.period === "CUSTOM"
    ? {
        startDate: filters.startDate,
        endDate: filters.endDate,
      }
    : {}),
});

const handleSalesReportError = (error: unknown): never => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (!error.response) {
      throw new SalesReportApiError("Backend tidak dapat diakses.");
    }

    throw new SalesReportApiError(
      error.response.data?.message ?? "Terjadi kesalahan pada server.",
    );
  }

  throw error;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const salesReportService = {
  getSalesReport: async (filters: SalesReportFilters) => {
    try {
      const response = await apiService.get<SalesReportApiData>(
        "/reports/sales",
        { params: getParams(filters) },
      );

      return mapSalesReport(response.data);
    } catch (error) {
      return handleSalesReportError(error);
    }
  },
  exportExcel: async (filters: SalesReportFilters) => {
    try {
      const response = await axiosInstance.get<Blob>(
        "/reports/sales/export/excel",
        {
          params: getParams(filters),
          responseType: "blob",
        },
      );

      downloadBlob(response.data, "sales-report.xls");
    } catch (error) {
      return handleSalesReportError(error);
    }
  },
  exportPdf: async (filters: SalesReportFilters) => {
    try {
      const response = await axiosInstance.get<Blob>(
        "/reports/sales/export/pdf",
        {
          params: getParams(filters),
          responseType: "blob",
        },
      );

      downloadBlob(response.data, "sales-report.pdf");
    } catch (error) {
      return handleSalesReportError(error);
    }
  },
};
