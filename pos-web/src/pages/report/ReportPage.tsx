import {
  Download,
  FileSpreadsheet,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
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
  period: "today",
  startDate: "",
  endDate: "",
  summary: {
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
  const [period, setPeriod] = useState<SalesReportPeriod>("today");
  const [startDate, setStartDate] = useState(todayInputValue);
  const [endDate, setEndDate] = useState(todayInputValue);
  const [report, setReport] = useState<SalesReportData>(emptyReport);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const filters: SalesReportFilters = {
    period,
    ...(period === "customDate" ? { startDate, endDate } : {}),
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
      title: "Revenue",
      value: formatRupiah(report.summary.revenue, { prefix: true }),
      description: "Pendapatan sesuai filter",
      icon: TrendingUp,
      tone: "blue" as const,
    },
    {
      title: "Transaksi",
      value: report.summary.transactions.toString(),
      description: "Jumlah invoice",
      icon: ReceiptText,
      tone: "green" as const,
    },
    {
      title: "Items Sold",
      value: report.summary.itemsSold.toString(),
      description: "Total kuantitas terjual",
      icon: ShoppingBag,
      tone: "amber" as const,
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 xl:flex-row xl:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Analitik Penjualan
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Sales Report
            </h1>
            <p className="mt-1 text-gray-500">
              Semua summary dan daftar transaksi dihitung dari backend.
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
                <option value="today">Today</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="customDate">Custom Date</option>
              </Select>
            </label>

            {period === "customDate" ? (
              <>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">
                    Start Date
                  </span>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">
                    End Date
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
              Export PDF
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
                  <TableHeadCell>Invoice</TableHeadCell>
                  <TableHeadCell>Tanggal</TableHeadCell>
                  <TableHeadCell>Kasir</TableHeadCell>
                  <TableHeadCell className="text-right">Items</TableHeadCell>
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
                        Tidak ada transaksi pada periode ini.
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
