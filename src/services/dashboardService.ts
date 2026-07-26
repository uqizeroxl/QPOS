import axios from "axios";
import { apiService } from "./api/apiService";
import type { DashboardData } from "../types/dashboard";

export type { DashboardData } from "../types/dashboard";

type DashboardApiData = Omit<
  DashboardData,
  "todayRevenue" | "topProducts" | "recentTransactions"
> & {
  todayRevenue: number | string;
  topProducts: Array<
    Omit<DashboardData["topProducts"][number], "totalSales"> & {
      totalSales: number | string;
    }
  >;
  recentTransactions: Array<
    Omit<DashboardData["recentTransactions"][number], "total"> & {
      total: number | string;
    }
  >;
};

export class DashboardApiError extends Error {
  constructor(message: string) {
    super(message);
  }
}

const mapDashboardData = (data: DashboardApiData): DashboardData => ({
  ...data,
  todayRevenue: Number(data.todayRevenue),
  topProducts: data.topProducts.map((product) => ({
    ...product,
    totalSales: Number(product.totalSales),
  })),
  recentTransactions: data.recentTransactions.map((transaction) => ({
    ...transaction,
    total: Number(transaction.total),
  })),
});

function handleDashboardError(error: unknown): never {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (!error.response) {
      throw new DashboardApiError("Backend tidak dapat diakses.");
    }

    throw new DashboardApiError(
      error.response.data?.message ?? "Terjadi kesalahan pada server.",
    );
  }

  throw error;
}

export const dashboardService = {
  getDashboard: async () => {
    try {
      const response = await apiService.get<DashboardApiData>("/dashboard");

      return mapDashboardData(response.data);
    } catch (error) {
      handleDashboardError(error);
    }
  },
};
