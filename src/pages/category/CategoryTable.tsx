import { ChevronLeft, ChevronRight, Pencil, Tags, Trash2 } from "lucide-react";
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
import type { Category } from "../../types/category";

type CategoryTableProps = {
  categories: Category[];
  currentPage: number;
  rowsPerPage: number;
  totalCategories: number;
  onPageChange: (page: number) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function CategoryTable({
  categories,
  currentPage,
  rowsPerPage,
  totalCategories,
  onPageChange,
  onEdit,
  onDelete,
}: CategoryTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalCategories / rowsPerPage));
  const startItem =
    totalCategories === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalCategories);

  return (
    <Card as="section" className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Tags className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Tabel Kategori
          </h2>
          <p className="text-sm text-gray-500">
            Data kategori produk.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow className="hover:bg-transparent">
              <TableHeadCell>Nama Kategori</TableHeadCell>
              <TableHeadCell>Deskripsi</TableHeadCell>
              <TableHeadCell>Jumlah Produk</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Dibuat</TableHeadCell>
              <TableHeadCell>Diubah</TableHeadCell>
              <TableHeadCell className="text-right">Aksi</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody className="bg-white">
            {categories.length > 0 ? (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="whitespace-nowrap font-semibold text-gray-900">
                    {category.name}
                  </TableCell>
                  <TableCell className="min-w-72 text-sm text-gray-600">
                    {category.description || "-"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm font-medium text-gray-700">
                    {category.productCount} produk
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        category.status === "Aktif"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {category.status}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-gray-600">
                    {formatDate(category.createdAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-gray-600">
                    {formatDate(category.updatedAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        variant="icon"
                        onClick={() => onEdit(category)}
                        className="hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        aria-label={`Edit ${category.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="compactSecondary"
                        onClick={() => onDelete(category)}
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        aria-label={`Hapus permanen ${category.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus Permanen
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="py-12 text-center">
                  <p className="font-semibold text-gray-700">
                    Belum ada data.
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Tambahkan kategori untuk mulai mengelola data produk.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          Menampilkan {startItem}-{endItem} dari {totalCategories} kategori
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
