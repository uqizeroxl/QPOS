import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { useActivityLog } from "../../hooks/useActivityLog";
import { useSuppliers } from "../../hooks/useSuppliers";
import { useToast } from "../../hooks/useToast";
import MainLayout from "../../layouts/MainLayout";
import SupplierForm from "./SupplierForm";
import SupplierTable from "./SupplierTable";
import type { Supplier, SupplierFormValues } from "./SupplierTypes";

const rowsPerPage = 5;

export default function SupplierPage() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } =
    useSuppliers();
  const { addActivity } = useActivityLog();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formError, setFormError] = useState("");

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();

    return suppliers.filter((supplier) =>
      supplier.name.toLowerCase().includes(normalizedSearch),
    );
  }, [searchTerm, suppliers]);

  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / rowsPerPage));
  const normalizedPage = Math.min(currentPage, totalPages);
  const paginatedSuppliers = filteredSuppliers.slice(
    (normalizedPage - 1) * rowsPerPage,
    normalizedPage * rowsPerPage,
  );

  const openAddForm = () => {
    setEditingSupplier(null);
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditForm = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormError("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSupplier(null);
    setFormError("");
  };

  const handleSubmitSupplier = (values: SupplierFormValues) => {
    const result = editingSupplier
      ? updateSupplier(editingSupplier.id, values)
      : addSupplier(values);

    if (!result.ok) {
      setFormError(result.message);
      return false;
    }

    const activityType = editingSupplier
      ? "supplier-update"
      : "supplier-create";
    const activityTitle = editingSupplier
      ? "Supplier berhasil diperbarui"
      : "Supplier berhasil ditambahkan";

    addActivity({
      type: activityType,
      title: activityTitle,
      description: result.supplier.name,
    });
    showToast(activityTitle);
    closeForm();
    return true;
  };

  const handleDeleteSupplier = (supplierId: number) => {
    const supplier = suppliers.find(
      (currentSupplier) => currentSupplier.id === supplierId,
    );

    if (!supplier) {
      showToast("Supplier tidak ditemukan.", "error");
      return;
    }

    const isConfirmed = window.confirm(
      `Hapus supplier "${supplier.name}"?`,
    );

    if (!isConfirmed) {
      return;
    }

    const result = deleteSupplier(supplierId);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    addActivity({
      type: "supplier-delete",
      title: "Supplier berhasil dihapus",
      description: result.supplier.name,
    });
    showToast("Supplier berhasil dihapus");
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">Master Data</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Supplier
            </h1>
            <p className="mt-1 text-gray-500">
              Kelola pemasok produk dan informasi kontak supplier.
            </p>
          </div>

          <Button onClick={openAddForm}>
            <Plus className="h-4 w-4" />
            Tambah Supplier
          </Button>
        </Card>

        <Card className="p-4">
          <label className="relative block">
            <span className="sr-only">Cari supplier</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Cari nama supplier"
              className="bg-white pl-10 pr-3 text-gray-700"
            />
          </label>
        </Card>

        <SupplierTable
          suppliers={paginatedSuppliers}
          currentPage={normalizedPage}
          rowsPerPage={rowsPerPage}
          totalSuppliers={filteredSuppliers.length}
          onPageChange={setCurrentPage}
          onEdit={openEditForm}
          onDelete={handleDeleteSupplier}
        />

        {isFormOpen ? (
          <SupplierForm
            isOpen={isFormOpen}
            supplier={editingSupplier}
            errorMessage={formError}
            onClose={closeForm}
            onSubmit={handleSubmitSupplier}
          />
        ) : null}
      </div>
    </MainLayout>
  );
}
