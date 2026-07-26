export type DashboardData = {
  todaySales: number;
  todayRevenue: number;
  todayTransactions: number;
  totalProducts: number;
  lowStockThreshold: number;
  lowStockProducts: {
    id: string;
    barcode: string;
    name: string;
    categoryName: string;
    stock: number;
  }[];
  topProducts: {
    productId: string | null;
    barcode: string;
    name: string;
    quantitySold: number;
    totalSales: number;
  }[];
  recentTransactions: {
    id: string;
    invoiceNumber: string;
    cashierName: string | null;
    total: number;
    createdAt: string;
  }[];
};
