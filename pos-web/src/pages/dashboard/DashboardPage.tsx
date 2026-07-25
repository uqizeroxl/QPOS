import {
  AlertTriangle,
  Boxes,
  DollarSign,
  Package,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "../../components/ui/Table";
import MainLayout from "../../layouts/MainLayout";
import {
  DashboardApiError,
  dashboardService,
  type DashboardData,
} from "../../services/dashboardService";
import { formatRupiah } from "../../utils/currency";
import { useTranslation } from "react-i18next";

const formatDateTime = (value: string, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const emptyDashboard: DashboardData = {
  todaySales: 0,
  todayRevenue: 0,
  todayTransactions: 0,
  totalProducts: 0,
  lowStockThreshold: 10,
  lowStockProducts: [],
  topProducts: [],
  recentTransactions: [],
};

export default function DashboardPage() {
  const { i18n, t } = useTranslation();
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const nextDashboard = await dashboardService.getDashboard();
      setDashboard(nextDashboard);
    } catch (error) {
      setErrorMessage(
        error instanceof DashboardApiError
          ? error.message
          : t("common.serverError"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const stats = [
    {
      title: t("dashboard.stats.todaySales.title"),
      value: dashboard.todaySales.toString(),
      description: t("dashboard.stats.todaySales.description"),
      icon: ShoppingBag,
      tone: "green" as const,
    },
    {
      title: t("dashboard.stats.todayRevenue.title"),
      value: formatRupiah(dashboard.todayRevenue, { prefix: true }),
      description: t("dashboard.stats.todayRevenue.description"),
      icon: DollarSign,
      tone: "blue" as const,
    },
    {
      title: t("dashboard.stats.todayTransactions.title"),
      value: dashboard.todayTransactions.toString(),
      description: t("dashboard.stats.todayTransactions.description"),
      icon: ReceiptText,
      tone: "amber" as const,
    },
    {
      title: t("dashboard.stats.totalProducts.title"),
      value: dashboard.totalProducts.toString(),
      description: t("dashboard.stats.totalProducts.description"),
      icon: Package,
      tone: "blue" as const,
    },
    {
      title: t("dashboard.stats.lowStock.title"),
      value: dashboard.lowStockProducts.length.toString(),
      description: t("dashboard.stats.lowStock.description", {
        threshold: dashboard.lowStockThreshold,
      }),
      icon: AlertTriangle,
      tone: "red" as const,
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              {t("dashboard.eyebrow")}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              {t("dashboard.title")}
            </h1>
            <p className="mt-1 text-gray-500">
              {t("dashboard.description")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-blue-700">
              <Boxes className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">{t("dashboard.backendData")}</p>
                <p className="text-xs">{t("dashboard.backendDescription")}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={fetchDashboard}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4" />
              {t("dashboard.refresh")}
            </Button>
          </div>
        </Card>

        {errorMessage ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              tone={stat.tone}
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card as="section" className="flex max-h-[420px] flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 dark:bg-slate-800">
              <h2 className="text-lg font-semibold text-gray-900">
                {t("dashboard.lowStock.title")}
              </h2>
              <span className="shrink-0 rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
                {t("dashboard.lowStock.count", { count: dashboard.lowStockProducts.length })}
              </span>
            </div>
            <div className="app-scrollbar min-h-0 overflow-auto scroll-smooth">
              <Table>
                <TableHead className="sticky top-0 z-[1]">
                  <TableRow className="hover:bg-transparent">
                    <TableHeadCell>{t("common.product")}</TableHeadCell>
                    <TableHeadCell>{t("common.category")}</TableHeadCell>
                    <TableHeadCell className="text-right">{t("common.stock")}</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody className="bg-white">
                  {dashboard.lowStockProducts.length > 0 ? (
                    dashboard.lowStockProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <p className="font-semibold text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {product.barcode}
                          </p>
                        </TableCell>
                        <TableCell>{product.categoryName}</TableCell>
                        <TableCell className="text-right font-semibold text-red-700">
                          {product.stock}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={3} className="py-10 text-center">
                        <p className="font-semibold text-gray-700">
                          {t("dashboard.lowStock.empty")}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card as="section" className="overflow-hidden">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {t("dashboard.topProducts.title")}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow className="hover:bg-transparent">
                    <TableHeadCell>{t("common.product")}</TableHeadCell>
                    <TableHeadCell className="text-right">{t("dashboard.topProducts.quantity")}</TableHeadCell>
                    <TableHeadCell className="text-right">{t("common.total")}</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody className="bg-white">
                  {dashboard.topProducts.length > 0 ? (
                    dashboard.topProducts.map((product) => (
                      <TableRow key={`${product.productId}-${product.barcode}`}>
                        <TableCell>
                          <p className="font-semibold text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {product.barcode}
                          </p>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {product.quantitySold}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatRupiah(product.totalSales, { prefix: true })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={3} className="py-10 text-center">
                        <p className="font-semibold text-gray-700">
                          {t("dashboard.topProducts.empty")}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <Card as="section" className="overflow-hidden">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("dashboard.recentTransactions.title")}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow className="hover:bg-transparent">
                  <TableHeadCell>{t("dashboard.recentTransactions.invoice")}</TableHeadCell>
                  <TableHeadCell>{t("dashboard.recentTransactions.date")}</TableHeadCell>
                  <TableHeadCell>{t("dashboard.recentTransactions.cashier")}</TableHeadCell>
                  <TableHeadCell className="text-right">{t("common.total")}</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="bg-white">
                {dashboard.recentTransactions.length > 0 ? (
                  dashboard.recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-semibold text-gray-900">
                        {transaction.invoiceNumber}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(
                          transaction.createdAt,
                          i18n.resolvedLanguage === "en" ? "en-US" : "id-ID",
                        )}
                      </TableCell>
                      <TableCell>{transaction.cashierName ?? "-"}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatRupiah(transaction.total, { prefix: true })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="py-10 text-center">
                      <p className="font-semibold text-gray-700">
                        {t("dashboard.recentTransactions.empty")}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
