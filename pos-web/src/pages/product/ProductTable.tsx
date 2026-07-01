import { ChevronLeft, ChevronRight } from "lucide-react";
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
import ProductRow from "./ProductRow";
import type { Product } from "./ProductTypes";

type ProductTableProps = {
  products: Product[];
  currentPage: number;
  rowsPerPage: number;
  totalProducts: number;
  onPageChange: (page: number) => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: number) => void;
};

export default function ProductTable({
  products,
  currentPage,
  rowsPerPage,
  totalProducts,
  onPageChange,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalProducts / rowsPerPage));
  const startItem = totalProducts === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalProducts);

  return (
    <Card as="section" className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow className="hover:bg-transparent">
              <TableHeadCell>Barcode</TableHeadCell>
              <TableHeadCell>Nama Produk</TableHeadCell>
              <TableHeadCell>Kategori</TableHeadCell>
              <TableHeadCell>Harga Beli</TableHeadCell>
              <TableHeadCell>Harga Jual</TableHeadCell>
              <TableHeadCell>Stok</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell className="text-right">Aksi</TableHeadCell>
            </TableRow>
          </TableHead>

          <TableBody className="bg-white">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="py-12 text-center">
                  <p className="font-semibold text-gray-700">
                    Belum ada data.
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Tambahkan produk untuk mulai mengelola data barang.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          Menampilkan {startItem}-{endItem} dari {totalProducts} produk
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="compactSecondary"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>

          <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
            {currentPage} / {totalPages}
          </span>

          <Button
            variant="compactSecondary"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
