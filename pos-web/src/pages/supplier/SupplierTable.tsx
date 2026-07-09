import { ChevronLeft, ChevronRight, Pencil, Trash2, Truck } from "lucide-react";
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
import type { Supplier } from "./SupplierTypes";

type SupplierTableProps = {
  suppliers: Supplier[];
  currentPage: number;
  rowsPerPage: number;
  totalSuppliers: number;
  onPageChange: (page: number) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplierId: string) => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function SupplierTable({
  suppliers,
  currentPage,
  rowsPerPage,
  totalSuppliers,
  onPageChange,
  onEdit,
  onDelete,
}: SupplierTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalSuppliers / rowsPerPage));
  const startItem =
    totalSuppliers === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(currentPage * rowsPerPage, totalSuppliers);

  return (
    <Card as="section" className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Truck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Tabel Supplier
          </h2>
          <p className="text-sm text-gray-500">Data supplier.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow className="hover:bg-transparent">
              <TableHeadCell>Nama Supplier</TableHeadCell>
              <TableHeadCell>Telepon</TableHeadCell>
              <TableHeadCell>Email</TableHeadCell>
              <TableHeadCell>Alamat</TableHeadCell>
              <TableHeadCell>Catatan</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Dibuat</TableHeadCell>
              <TableHeadCell>Diubah</TableHeadCell>
              <TableHeadCell className="text-right">Aksi</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody className="bg-white">
            {suppliers.length > 0 ? (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="whitespace-nowrap font-semibold text-gray-900">
                    {supplier.name}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-gray-600">
                    {supplier.phone || "-"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-gray-600">
                    {supplier.email || "-"}
                  </TableCell>
                  <TableCell className="min-w-80 text-sm text-gray-600">
                    {supplier.address || "-"}
                  </TableCell>
                  <TableCell className="min-w-64 text-sm text-gray-600">
                    {supplier.notes || "-"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        supplier.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {supplier.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-gray-600">
                    {formatDate(supplier.createdAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-gray-600">
                    {formatDate(supplier.updatedAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        variant="icon"
                        onClick={() => onEdit(supplier)}
                        className="hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        aria-label={`Edit ${supplier.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="dangerIcon"
                        onClick={() => onDelete(supplier.id)}
                        aria-label={`Nonaktifkan ${supplier.name}`}
                        disabled={!supplier.isActive}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={9} className="py-12 text-center">
                  <p className="font-semibold text-gray-700">
                    Belum ada data.
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Tambahkan supplier untuk mulai mengelola data pemasok.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          Menampilkan {startItem}-{endItem} dari {totalSuppliers} supplier
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
