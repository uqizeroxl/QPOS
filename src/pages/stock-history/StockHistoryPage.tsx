import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import LoadError from "../../components/ui/LoadError";
import { Input, Select } from "../../components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "../../components/ui/Table";
import { useProducts } from "../../hooks/useProducts";
import MainLayout from "../../layouts/MainLayout";
import { DEFAULT_PAGE_SIZE } from "../../constants/pagination";
import {
  productService,
  type StockHistoryListItem,
  type StockHistoryPagination,
  type StockReferenceType,
} from "../../services/productService";

const referenceLabels: Record<StockReferenceType, string> = {
  SALE: "Penjualan",
  RESTOCK: "Restok",
  ADJUSTMENT: "Penyesuaian",
  PURCHASE_ORDER: "Purchase Order",
};

const initialPagination: StockHistoryPagination = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 1,
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function StockHistoryPage() {
  const { products, fetchProducts } = useProducts();
  const [histories, setHistories] = useState<StockHistoryListItem[]>([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [page, setPage] = useState(1);
  const [productId, setProductId] = useState("");
  const [type, setType] = useState<StockReferenceType | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchHistories = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await productService.getStockHistories({
        page,
        limit: DEFAULT_PAGE_SIZE,
        productId: productId || undefined,
        type: type || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setHistories(response.data);
      setPagination(response.pagination);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Riwayat stok gagal dimuat.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [endDate, page, productId, startDate, type]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    void fetchHistories();
  }, [fetchHistories]);

  const changeFilter = (change: () => void) => {
    change();
    setPage(1);
  };
  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * 10 + 1;
  const endItem = Math.min(pagination.page * 10, pagination.total);

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">Persediaan</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Riwayat Stok
            </h1>
            <p className="mt-1 text-gray-500">
              Lacak perubahan stok beserta pengguna dan referensinya.
            </p>
          </div>
          <Button onClick={fetchHistories} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </Card>

        <Card className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Produk</span>
            <Select
              value={productId}
              onChange={(event) => changeFilter(() => setProductId(event.target.value))}
            >
              <option value="">Semua Produk</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Tipe</span>
            <Select
              value={type}
              onChange={(event) =>
                changeFilter(() => setType(event.target.value as StockReferenceType | ""))
              }
            >
              <option value="">Semua Tipe</option>
              {Object.entries(referenceLabels)
                .filter(([value]) => value !== "PURCHASE_ORDER")
                .map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
                ))}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Tanggal Awal</span>
            <Input type="date" value={startDate} onChange={(event) => changeFilter(() => setStartDate(event.target.value))} />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Tanggal Akhir</span>
            <Input type="date" value={endDate} onChange={(event) => changeFilter(() => setEndDate(event.target.value))} />
          </label>
        </Card>

        {errorMessage ? <LoadError message={errorMessage} onRetry={fetchHistories} isRetrying={isLoading} /> : null}

        <Card as="section" className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHead><TableRow className="hover:bg-transparent">
                <TableHeadCell>Date</TableHeadCell><TableHeadCell>Product</TableHeadCell>
                <TableHeadCell>Type</TableHeadCell><TableHeadCell>Qty</TableHeadCell>
                <TableHeadCell>User</TableHeadCell><TableHeadCell>Reference</TableHeadCell>
                <TableHeadCell>Note</TableHeadCell>
              </TableRow></TableHead>
              <TableBody className="bg-white">
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="py-12 text-center">Memuat...</TableCell></TableRow>
                ) : histories.length ? histories.map((history) => (
                  <TableRow key={history.id}>
                    <TableCell className="whitespace-nowrap text-sm">{formatDateTime(history.createdAt)}</TableCell>
                    <TableCell><p className="font-semibold text-gray-900">{history.product.name}</p><p className="text-xs text-gray-500">{history.product.barcode || "-"}</p></TableCell>
                    <TableCell>{history.referenceType ? referenceLabels[history.referenceType] : "-"}</TableCell>
                    <TableCell className="font-semibold">{history.type === "REDUCE" ? "-" : "+"}{history.quantity}</TableCell>
                    <TableCell>{history.userName || "-"}</TableCell>
                    <TableCell>{history.referenceId || "-"}</TableCell>
                    <TableCell className="min-w-48">{history.note || "-"}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={7} className="py-12 text-center">Belum ada riwayat stok.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">Menampilkan {startItem}-{endItem} dari {pagination.total} riwayat</p>
            <div className="flex items-center gap-2">
              <Button variant="compactSecondary" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /> Prev</Button>
              <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">{pagination.page} / {pagination.totalPages}</span>
              <Button variant="compactSecondary" onClick={() => setPage((value) => Math.min(pagination.totalPages, value + 1))} disabled={page >= pagination.totalPages}>Next <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
