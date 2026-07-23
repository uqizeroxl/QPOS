import {
  Calculator,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Input";
import StatCard from "../../components/ui/StatCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "../../components/ui/Table";
import {
  SalesReportApiError,
  salesReportService,
  type SalesReportData,
  type SalesReportFilters,
  type SalesReportPeriod,
} from "../../services/salesReportService";
import { formatRupiah } from "../../utils/currency";

const emptyReport: SalesReportData = {
  period: "DAILY",
  startDate: "",
  endDate: "",
  summary: {
    totalSales: 0,
    totalCost: 0,
    totalProfit: 0,
    totalTransactions: 0,
    totalItemsSold: 0,
    averageTransaction: 0,
    revenue: 0,
    transactions: 0,
    itemsSold: 0,
  },
  transactions: [],
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const todayInputValue = () => new Date().toISOString().slice(0, 10);

export default function ReportPage() {
  const [period, setPeriod] = useState<SalesReportPeriod>("DAILY");
  const [startDate, setStartDate] = useState(todayInputValue);
  const [endDate, setEndDate] = useState(todayInputValue);
  const [report, setReport] = useState<SalesReportData>(emptyReport);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const filters: SalesReportFilters = {
    period,
    ...(period === "CUSTOM" ? { startDate, endDate } : {}),
  };

  const fetchReport = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const nextReport = await salesReportService.getSalesReport(filters);
      setReport(nextReport);
    } catch (error) {
      setErrorMessage(
        error instanceof SalesReportApiError
          ? error.message
          : "Terjadi kesalahan pada server.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchReport();
    // Fetch otomatis hanya saat preset periode berubah; tanggal custom diterapkan via tombol.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const handleApplyCustomDate = () => {
    void fetchReport();
  };

  const handleExport = async (type: "excel" | "pdf") => {
    setIsExporting(true);
    setErrorMessage("");

    try {
      if (type === "excel") {
        await salesReportService.exportExcel(filters);
      } else {
        await salesReportService.exportPdf(filters);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof SalesReportApiError
          ? error.message
          : "Terjadi kesalahan pada server.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const stats = [
    {
      title: "Total Penjualan",
      value: formatRupiah(report.summary.totalSales, { prefix: true }),
      description: "Pendapatan sesuai filter",
      icon: TrendingUp,
      tone: "blue" as const,
    },
    {
      title: "Total Keuntungan",
      value: formatRupiah(report.summary.totalProfit, { prefix: true }),
      description: "Harga jual dikurangi harga beli",
      icon: CircleDollarSign,
      tone: "green" as const,
    },
    {
      title: "Total Modal",
      value: formatRupiah(report.summary.totalCost, { prefix: true }),
      description: "Total biaya barang terjual",
      icon: WalletCards,
      tone: "red" as const,
    },
    {
      title: "Jumlah Transaksi",
      value: report.summary.totalTransactions.toString(),
      description: "Jumlah invoice",
      icon: ReceiptText,
      tone: "blue" as const,
    },
    {
      title: "Barang Terjual",
      value: report.summary.totalItemsSold.toString(),
      description: "Total kuantitas terjual",
      icon: PackageCheck,
      tone: "amber" as const,
    },
    {
      title: "Rata-rata Transaksi",
      value: formatRupiah(report.summary.averageTransaction, { prefix: true }),
      description: "Rata-rata nilai per transaksi",
      icon: Calculator,
      tone: "amber" as const,
    },
  ];

  const chartData = useMemo(() => {
    const dailySales = new Map<string, number>();

    report.transactions.forEach((transaction) => {
      const date = transaction.createdAt.slice(0, 10);
      dailySales.set(date, (dailySales.get(date) ?? 0) + transaction.total);
    });

    return [...dailySales.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, sales]) => ({ date, sales }));
  }, [report.transactions]);
  const maxChartSales = Math.max(...chartData.map((item) => item.sales), 1);

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 xl:flex-row xl:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Analitik Penjualan
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Laporan Penjualan
            </h1>
            <p className="mt-1 text-gray-500">
              Ringkasan dan daftar transaksi dihitung berdasarkan periode terpilih.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Periode</span>
              <Select
                value={period}
                onChange={(event) =>
                  setPeriod(event.target.value as SalesReportPeriod)
                }
              >
                <option value="DAILY">Harian</option>
                <option value="WEEKLY">Mingguan</option>
                <option value="MONTHLY">Bulanan</option>
                <option value="YEARLY">Tahunan</option>
                <option value="CUSTOM">Rentang Tanggal</option>
              </Select>
            </label>

            {period === "CUSTOM" ? (
              <>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">
                    Tanggal Mulai
                  </span>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">
                    Tanggal Akhir
                  </span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                  />
                </label>
                <Button onClick={handleApplyCustomDate} disabled={isLoading}>
                  Terapkan
                </Button>
              </>
            ) : null}

            <Button
              variant="secondary"
              onClick={() => handleExport("excel")}
              disabled={isExporting}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
            <Button
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
            >
              <Download className="h-4 w-4" />
              Cetak PDF
            </Button>
          </div>
        </Card>

        {errorMessage ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Grafik Penjualan
            </h2>
          </div>
          {chartData.length > 0 ? (
            <div className="mt-6 flex h-64 min-w-full items-end gap-3 overflow-x-auto border-b border-gray-200 pb-2">
              {chartData.map((item) => (
                <div
                  key={item.date}
                  className="flex min-w-16 flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-xs font-medium text-gray-500">
                    {formatRupiah(item.sales)}
                  </span>
                  <div
                    className="w-full max-w-16 rounded-t bg-blue-500"
                    style={{
                      height: `${Math.max((item.sales / maxChartSales) * 180, 4)}px`,
                    }}
                    title={`${item.date}: ${formatRupiah(item.sales, { prefix: true })}`}
                  />
                  <span className="whitespace-nowrap text-xs text-gray-500">
                    {new Intl.DateTimeFormat("id-ID", {
                      day: "2-digit",
                      month: "short",
                    }).format(new Date(`${item.date}T00:00:00`))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 py-12 text-center text-sm text-gray-500">
              Tidak Ada Data
            </p>
          )}
        </Card>

        <Card as="section" className="overflow-hidden">
          <div className="flex flex-col justify-between gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Daftar Transaksi
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {report.startDate && report.endDate
                  ? `${formatDateTime(report.startDate)} - ${formatDateTime(report.endDate)}`
                  : "Memuat rentang laporan..."}
              </p>
            </div>
            {isLoading ? (
              <span className="text-sm font-semibold text-blue-600">
                Memuat...
              </span>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow className="hover:bg-transparent">
                  <TableHeadCell>Nomor Invoice</TableHeadCell>
                  <TableHeadCell>Tanggal</TableHeadCell>
                  <TableHeadCell>Kasir</TableHeadCell>
                  <TableHeadCell className="text-right">Jumlah Item</TableHeadCell>
                  <TableHeadCell className="text-right">Total</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="bg-white">
                {report.transactions.length > 0 ? (
                  report.transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-semibold text-gray-900">
                        {transaction.invoiceNumber}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(transaction.createdAt)}
                      </TableCell>
                      <TableCell>{transaction.cashierName ?? "-"}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {transaction.itemsSold}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatRupiah(transaction.total, { prefix: true })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="py-12 text-center">
                      <p className="font-semibold text-gray-700">
                        Tidak Ada Data
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
