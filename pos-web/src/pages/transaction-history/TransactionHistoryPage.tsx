import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Printer,
  ReceiptText,
  Search,
  WalletCards,
} from "lucide-react";
import { useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import DatePicker from "../../components/ui/DatePicker";
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
import { useTransactions } from "../../hooks/useTransactions";
import { useSettings } from "../../hooks/useSettings";
import { useReceiptPrinter } from "../../hooks/useReceiptPrinter";
import MainLayout from "../../layouts/MainLayout";
import ReceiptPrintArea from "../cashier/ReceiptPrintArea";
import type { SalesTransaction } from "../cashier/CashierTypes";
import { formatRupiah } from "../../utils/currency";
import { createSalesReportPdf, downloadPdf } from "../../utils/reportPdf";

type TransactionStatusFilter = "Semua" | "Selesai";

const rowsPerPage = 5;

function getFirstDayOfCurrentMonth() {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), 1);
}

function getToday() {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function endOfDay(value: Date) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    23,
    59,
    59,
    999,
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatFileDate(value: Date) {
  const year = value.getFullYear();
  const month = (value.getMonth() + 1).toString().padStart(2, "0");
  const day = value.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getItemCount(transaction: SalesTransaction) {
  return transaction.items.reduce(
    (currentTotal, item) => currentTotal + item.quantity,
    0,
  );
}

function TransactionDetailModal({
  transaction,
  onClose,
  onPrint,
}: {
  transaction: SalesTransaction | null;
  onClose: () => void;
  onPrint: (transaction: SalesTransaction) => void;
}) {
  if (!transaction) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border-0 shadow-xl">
        <div className="flex flex-col justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Detail Transaksi
            </h2>
            <p className="text-sm text-gray-500">
              {transaction.transactionNumber}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Tutup
            </Button>
            <Button onClick={() => onPrint(transaction)}>
              <Printer className="h-4 w-4" />
              Cetak Ulang Struk
            </Button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid gap-3 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-gray-500">Nomor Transaksi</p>
              <p className="mt-1 font-semibold text-gray-900">
                {transaction.transactionNumber}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Tanggal</p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatDateTime(transaction.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Nama Kasir</p>
              <p className="mt-1 font-semibold text-gray-900">
                {transaction.cashierName ?? "-"}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <Table>
              <TableHead>
                <TableRow className="hover:bg-transparent">
                  <TableHeadCell>Produk</TableHeadCell>
                  <TableHeadCell>Qty</TableHeadCell>
                  <TableHeadCell>Harga</TableHeadCell>
                  <TableHeadCell>Subtotal</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transaction.items.map((item) => (
                  <TableRow key={`${transaction.id}-${item.productId}`}>
                    <TableCell>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.barcode}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-600">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-600">
                      {formatRupiah(item.price, { prefix: true })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatRupiah(item.subtotal, { prefix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="ml-auto w-full max-w-sm space-y-3 rounded-lg border border-gray-200 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Diskon</span>
              <span className="font-semibold text-gray-900">
                {transaction.discountPercent}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Potongan</span>
              <span className="font-semibold text-red-600">
                -{formatRupiah(transaction.discountAmount, { prefix: true })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Grand Total</span>
              <span className="font-bold text-gray-900">
                {formatRupiah(transaction.grandTotal, { prefix: true })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Nominal Bayar</span>
              <span className="font-semibold text-gray-900">
                {formatRupiah(transaction.paidAmount, { prefix: true })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Kembalian</span>
              <span className="font-semibold text-gray-900">
                {formatRupiah(transaction.change, { prefix: true })}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function TransactionHistoryPage() {
  const { transactions } = useTransactions();
  const { settings } = useSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth);
  const [endDate, setEndDate] = useState(getToday);
  const [statusFilter, setStatusFilter] =
    useState<TransactionStatusFilter>("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] =
    useState<SalesTransaction | null>(null);
  const { receiptPrintTransaction, printReceipt } = useReceiptPrinter();

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    const startTime = startOfDay(startDate).getTime();
    const endTime = endOfDay(endDate).getTime();

    return transactions
      .filter((transaction) => {
        const transactionTime = new Date(transaction.createdAt).getTime();
        const matchesDate =
          transactionTime >= startTime && transactionTime <= endTime;
        const matchesStatus =
          statusFilter === "Semua" || statusFilter === "Selesai";
        const matchesSearch =
          !normalizedSearch ||
          transaction.transactionNumber
            .toLowerCase()
            .includes(normalizedSearch) ||
          transaction.items.some((item) =>
            item.name.toLowerCase().includes(normalizedSearch),
          );

        return matchesDate && matchesStatus && matchesSearch;
      })
      .sort(
        (firstTransaction, secondTransaction) =>
          new Date(secondTransaction.createdAt).getTime() -
          new Date(firstTransaction.createdAt).getTime(),
      );
  }, [endDate, searchTerm, startDate, statusFilter, transactions]);

  const summary = useMemo(() => {
    const omzet = filteredTransactions.reduce(
      (currentTotal, transaction) => currentTotal + transaction.grandTotal,
      0,
    );

    return {
      transactionCount: filteredTransactions.length,
      omzet,
      averageTransaction:
        filteredTransactions.length > 0
          ? Math.round(omzet / filteredTransactions.length)
          : 0,
    };
  }, [filteredTransactions]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / rowsPerPage),
  );
  const normalizedPage = Math.min(currentPage, totalPages);
  const paginatedTransactions = filteredTransactions.slice(
    (normalizedPage - 1) * rowsPerPage,
    normalizedPage * rowsPerPage,
  );
  const startItem =
    filteredTransactions.length === 0
      ? 0
      : (normalizedPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(
    normalizedPage * rowsPerPage,
    filteredTransactions.length,
  );
  const stats = [
    {
      title: "Total Transaksi",
      value: summary.transactionCount.toString(),
      description: "Transaksi sesuai filter",
      icon: ReceiptText,
      tone: "blue" as const,
    },
    {
      title: "Omzet",
      value: formatRupiah(summary.omzet, { prefix: true }),
      description: "Total grand total transaksi",
      icon: WalletCards,
      tone: "green" as const,
    },
    {
      title: "Rata-rata Nilai Transaksi",
      value: formatRupiah(summary.averageTransaction, { prefix: true }),
      description: "Berdasarkan transaksi terfilter",
      icon: WalletCards,
      tone: "amber" as const,
    },
  ];

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDateChange = (
    setter: (value: Date) => void,
    value: Date,
  ) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleExportPdf = () => {
    const pdfBlob = createSalesReportPdf({
      transactions: filteredTransactions,
      startDate: startOfDay(startDate),
      endDate: endOfDay(endDate),
      storeName: settings.storeName,
    });

    downloadPdf(
      pdfBlob,
      `riwayat-transaksi-${formatFileDate(startDate)}-${formatFileDate(
        endDate,
      )}.pdf`,
    );
  };

  const handlePrintReceipt = (transaction: SalesTransaction) => {
    printReceipt(transaction);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Transaksi Penjualan
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Riwayat Transaksi
            </h1>
            <p className="mt-1 text-gray-500">
              Pantau seluruh transaksi yang sudah diproses di Kasir.
            </p>
          </div>

          <Button onClick={handleExportPdf}>
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
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

        <Card className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_180px] lg:items-end">
          <label className="space-y-2">
            <span className="sr-only">Cari transaksi</span>
            <span className="block text-sm font-medium text-gray-700">
              Search
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Nomor transaksi atau nama produk"
                className="pl-10"
              />
            </div>
          </label>

          <DatePicker
            label="Tanggal Awal"
            value={startDate}
            onChange={(value) => handleDateChange(setStartDate, value)}
          />

          <DatePicker
            label="Tanggal Akhir"
            value={endDate}
            onChange={(value) => handleDateChange(setEndDate, value)}
          />

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <Select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as TransactionStatusFilter);
                setCurrentPage(1);
              }}
            >
              <option value="Semua">Semua</option>
              <option value="Selesai">Selesai</option>
            </Select>
          </label>
        </Card>

        <Card as="section" className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow className="hover:bg-transparent">
                  <TableHeadCell>Nomor Transaksi</TableHeadCell>
                  <TableHeadCell>Tanggal & Jam</TableHeadCell>
                  <TableHeadCell>Jumlah Item</TableHeadCell>
                  <TableHeadCell>Grand Total</TableHeadCell>
                  <TableHeadCell>Nama Kasir</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell className="text-right">Aksi</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="bg-white">
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="whitespace-nowrap font-semibold text-gray-900">
                        {transaction.transactionNumber}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-600">
                        {formatDateTime(transaction.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm font-medium text-gray-700">
                        {getItemCount(transaction)} item
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatRupiah(transaction.grandTotal, { prefix: true })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-600">
                        {transaction.cashierName ?? "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Selesai
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <Button
                          variant="compactSecondary"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <Eye className="h-4 w-4" />
                          Lihat Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-12 text-center">
                      <p className="font-semibold text-gray-700">
                        Belum ada transaksi.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Menampilkan {startItem}-{endItem} dari{" "}
              {filteredTransactions.length} transaksi
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="compactSecondary"
                onClick={() => setCurrentPage(normalizedPage - 1)}
                disabled={normalizedPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>

              <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                {normalizedPage} / {totalPages}
              </span>

              <Button
                variant="compactSecondary"
                onClick={() => setCurrentPage(normalizedPage + 1)}
                disabled={normalizedPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onPrint={handlePrintReceipt}
        />
        <ReceiptPrintArea transaction={receiptPrintTransaction} />
      </div>
    </MainLayout>
  );
}
