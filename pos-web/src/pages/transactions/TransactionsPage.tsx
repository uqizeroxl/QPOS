import {
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import DatePicker from "../../components/ui/DatePicker";
import { Input, Select } from "../../components/ui/Input";
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
  TransactionApiError,
  transactionService,
  type TransactionListItem,
  type TransactionPagination,
} from "../../services/transactionService";
import { formatRupiah } from "../../utils/currency";

const rowsPerPage = 10;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateParam(value: Date) {
  const year = value.getFullYear();
  const month = (value.getMonth() + 1).toString().padStart(2, "0");
  const day = value.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getFirstDayOfCurrentMonth() {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), 1);
}

function getToday() {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [pagination, setPagination] = useState<TransactionPagination>({
    page: 1,
    limit: rowsPerPage,
    total: 0,
    totalPages: 1,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth);
  const [endDate, setEndDate] = useState(getToday);
  const [sort, setSort] = useState<"latest" | "oldest">("latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await transactionService.getTransactions({
        page: currentPage,
        limit: rowsPerPage,
        search: searchTerm.trim() || undefined,
        startDate: formatDateParam(startDate),
        endDate: formatDateParam(endDate),
        sort,
      });

      setTransactions(response.data);
      setPagination(response.pagination);
    } catch (error) {
      setErrorMessage(
        error instanceof TransactionApiError
          ? error.message
          : "Terjadi kesalahan pada server.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, endDate, searchTerm, sort, startDate]);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  const resetToFirstPage = () => {
    setCurrentPage(1);
  };

  const startItem =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

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
              Cari invoice, filter tanggal, dan buka detail transaksi.
            </p>
          </div>

          <Button onClick={fetchTransactions} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </Card>

        <Card className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_160px] lg:items-end">
          <label className="space-y-2">
            <span className="block text-sm font-medium text-gray-700">
              Search
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  resetToFirstPage();
                }}
                placeholder="Invoice atau customer"
                className="pl-10"
              />
            </div>
          </label>

          <DatePicker
            label="Tanggal Awal"
            value={startDate}
            onChange={(value) => {
              setStartDate(value);
              resetToFirstPage();
            }}
          />

          <DatePicker
            label="Tanggal Akhir"
            value={endDate}
            onChange={(value) => {
              setEndDate(value);
              resetToFirstPage();
            }}
          />

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Urutan</span>
            <Select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as "latest" | "oldest");
                resetToFirstPage();
              }}
            >
              <option value="latest">Terbaru</option>
              <option value="oldest">Terlama</option>
            </Select>
          </label>
        </Card>

        {errorMessage ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <Card as="section" className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow className="hover:bg-transparent">
                  <TableHeadCell>Invoice</TableHeadCell>
                  <TableHeadCell>Tanggal</TableHeadCell>
                  <TableHeadCell>Customer</TableHeadCell>
                  <TableHeadCell>Kasir</TableHeadCell>
                  <TableHeadCell>Metode</TableHeadCell>
                  <TableHeadCell>Total</TableHeadCell>
                  <TableHeadCell className="text-right">Action</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="bg-white">
                {isLoading ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-12 text-center">
                      <p className="font-semibold text-gray-700">Memuat...</p>
                    </TableCell>
                  </TableRow>
                ) : transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="whitespace-nowrap font-semibold text-gray-900">
                        {transaction.invoiceNumber}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-600">
                        {formatDateTime(transaction.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-600">
                        {transaction.customerName ?? "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-600">
                        {transaction.cashierName ?? "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-600">
                        {transaction.paymentMethod}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatRupiah(transaction.total, { prefix: true })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <Button
                          variant="compactSecondary"
                          onClick={() => navigate(`/transactions/${transaction.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          Detail
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
              Menampilkan {startItem}-{endItem} dari {pagination.total} transaksi
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="compactSecondary"
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>

              <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                {pagination.page} / {pagination.totalPages}
              </span>

              <Button
                variant="compactSecondary"
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(page + 1, pagination.totalPages),
                  )
                }
                disabled={pagination.page === pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
