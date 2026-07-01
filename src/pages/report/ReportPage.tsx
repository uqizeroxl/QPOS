import {
  Download,
  FileSpreadsheet,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { useMemo, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import { useTransactions } from "../../hooks/useTransactions";
import { formatRupiah } from "../../utils/currency";
import ReportExportModal from "./ReportExportModal";

const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function ReportPage() {
  const { transactions } = useTransactions();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const reportData = useMemo(() => {
    const totalSales = transactions.reduce(
      (currentTotal, transaction) => currentTotal + transaction.grandTotal,
      0,
    );
    const soldProductCount = transactions.reduce(
      (currentTotal, transaction) =>
        currentTotal +
        transaction.items.reduce(
          (itemTotal, item) => itemTotal + item.quantity,
          0,
        ),
      0,
    );
    const averageTransaction =
      transactions.length > 0 ? Math.round(totalSales / transactions.length) : 0;
    const salesByDay = transactions.reduce<Record<string, number>>(
      (currentSales, transaction) => {
        const day = dayLabels[new Date(transaction.createdAt).getDay()];
        currentSales[day] = (currentSales[day] ?? 0) + transaction.grandTotal;
        return currentSales;
      },
      {},
    );
    const maxDailySales = Math.max(...Object.values(salesByDay), 0);
    const chartData = dayLabels.map((day) => ({
      day,
      value: salesByDay[day] ?? 0,
      height:
        maxDailySales > 0
          ? Math.max(((salesByDay[day] ?? 0) / maxDailySales) * 100, 8)
          : 0,
    }));

    return {
      totalSales,
      soldProductCount,
      averageTransaction,
      chartData,
    };
  }, [transactions]);

  const stats = [
    {
      title: "Total Penjualan",
      value: formatRupiah(reportData.totalSales, { prefix: true }),
      description: "Akumulasi transaksi tersimpan",
      icon: TrendingUp,
      tone: "blue" as const,
    },
    {
      title: "Transaksi",
      value: transactions.length.toString(),
      description: "Riwayat transaksi kasir",
      icon: ReceiptText,
      tone: "green" as const,
    },
    {
      title: "Produk Terjual",
      value: reportData.soldProductCount.toString(),
      description: "Total kuantitas item terjual",
      icon: ShoppingBag,
      tone: "amber" as const,
    },
    {
      title: "Rata-rata Transaksi",
      value: formatRupiah(reportData.averageTransaction, { prefix: true }),
      description: "Berdasarkan grand total",
      icon: WalletCards,
      tone: "blue" as const,
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Analitik Penjualan
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Laporan
            </h1>
            <p className="mt-1 text-gray-500">
              Pantau performa penjualan dan ringkasan operasional toko.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => setIsExportModalOpen(true)}>
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="secondary">
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

        <Card as="section" className="p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Grafik Penjualan
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Ringkasan transaksi berdasarkan hari.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              Transaksi
            </span>
          </div>

          {transactions.length > 0 ? (
            <div className="mt-8 flex h-72 items-end gap-3 rounded-lg bg-gray-50 p-4 sm:gap-5">
              {reportData.chartData.map((item) => (
                <div
                  key={item.day}
                  className="flex h-full flex-1 flex-col justify-end gap-3"
                >
                  <div className="flex flex-1 items-end">
                    <div
                      className="w-full rounded-t-lg bg-blue-600"
                      style={{ height: `${item.height}%` }}
                      title={`${item.day}: ${formatRupiah(item.value, {
                        prefix: true,
                      })}`}
                    />
                  </div>
                  <div className="text-center text-xs font-semibold text-gray-500">
                    {item.day}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-lg bg-gray-50 px-4 py-12 text-center text-sm font-medium text-gray-500">
              Belum ada data.
            </p>
          )}
        </Card>

        {isExportModalOpen ? (
          <ReportExportModal
            isOpen={isExportModalOpen}
            transactions={transactions}
            onClose={() => setIsExportModalOpen(false)}
          />
        ) : null}
      </div>
    </MainLayout>
  );
}
