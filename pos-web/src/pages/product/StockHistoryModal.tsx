import { X } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "../../components/ui/Table";
import type { StockHistoryItem } from "../../services/productService";
import type { Product } from "./ProductTypes";

type StockHistoryModalProps = {
  product: Product | null;
  history: StockHistoryItem[];
  isLoading?: boolean;
  onClose: () => void;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatType(type: StockHistoryItem["type"]) {
  if (type === "ADD") return "Add";
  if (type === "REDUCE") return "Reduce";
  return "Set";
}

export default function StockHistoryModal({
  product,
  history,
  isLoading = false,
  onClose,
}: StockHistoryModalProps) {
  if (!product) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/40 p-4">
      <Card className="max-h-[90vh] w-full max-w-4xl overflow-y-auto border-0 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Stock History
            </h2>
            <p className="text-sm text-gray-500">{product.name}</p>
          </div>

          <Button variant="icon" onClick={onClose} aria-label="Tutup">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow className="hover:bg-transparent">
                <TableHeadCell>Tanggal</TableHeadCell>
                <TableHeadCell>Tipe</TableHeadCell>
                <TableHeadCell>Jumlah</TableHeadCell>
                <TableHeadCell>Stok Sebelumnya</TableHeadCell>
                <TableHeadCell>Stok Sekarang</TableHeadCell>
                <TableHeadCell>Catatan</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody className="bg-white">
              {isLoading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-12 text-center">
                    <p className="font-semibold text-gray-700">Memuat...</p>
                  </TableCell>
                </TableRow>
              ) : history.length > 0 ? (
                history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap text-sm text-gray-600">
                      {formatDateTime(item.createdAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatType(item.type)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-600">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-600">
                      {item.previousStock}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm font-semibold text-gray-900">
                      {item.currentStock}
                    </TableCell>
                    <TableCell className="min-w-64 text-sm text-gray-600">
                      {item.note || "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-12 text-center">
                    <p className="font-semibold text-gray-700">
                      Belum ada riwayat stok.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
