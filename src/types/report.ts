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

export type ProductDatasetResetResult = {
  stockHistories: number;
  products: number;
  categories: number;
  suppliers: number;
};

export type ReceiptFooterSettings = {
  receiptFooter: string;
  thermalPaperProfile: import("./settings").ThermalPaperProfileId;
  receiptAutoCut: boolean;
};
