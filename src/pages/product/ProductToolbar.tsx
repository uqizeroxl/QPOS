import { PencilLine, Plus, ScanBarcode, Search, Trash2 } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import CategoryCombobox from "./CategoryCombobox";
import type { Category } from "../../types/category";

type ProductToolbarProps = {
  searchTerm: string;
  selectedCategory: string;
  categories: Category[];
  onSearchChange: (value: string) => void;
  onScanBarcode: () => void;
  onCategoryChange: (value: string) => void;
  onAddProduct: () => void;
  onBulkEdit: () => void;
  isBulkEditMode: boolean;
  onDeleteMode: () => void;
  isDeleteMode: boolean;
};

export default function ProductToolbar({
  searchTerm,
  selectedCategory,
  categories,
  onSearchChange,
  onScanBarcode,
  onCategoryChange,
  onAddProduct,
  onBulkEdit,
  isBulkEditMode,
  onDeleteMode,
  isDeleteMode,
}: ProductToolbarProps) {
  return (
    <Card className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 gap-2">
          <label className="relative flex-1">
            <span className="sr-only">Cari produk</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Cari barcode atau nama produk"
              className="bg-white pl-10 pr-3 text-gray-700"
            />
          </label>
          <Button
            variant="secondary"
            onClick={onScanBarcode}
            className="shrink-0 px-3"
            aria-label="Scan barcode produk"
            title="Scan barcode"
          >
            <ScanBarcode className="h-5 w-5" />
          </Button>
        </div>

        <label className="sm:w-56">
          <span className="sr-only">Filter kategori</span>
          <CategoryCombobox
            categories={categories}
            selectedCategoryName={selectedCategory === "Semua" ? "Semua Kategori" : selectedCategory}
            onSelect={(category) => onCategoryChange(category.name)}
            allOptionLabel="Semua Kategori"
            onSelectAll={() => onCategoryChange("Semua")}
            onClearSelection={() => undefined}
            emptyMessage="Kategori tidak ditemukan"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={onDeleteMode}
          disabled={isDeleteMode || isBulkEditMode}
          className="text-red-700 hover:border-red-200 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Hapus
        </Button>
        <Button variant="secondary" onClick={onBulkEdit} disabled={isBulkEditMode || isDeleteMode}>
          <PencilLine className="h-4 w-4" />
          Ubah Massal
        </Button>
        <Button onClick={onAddProduct}>
          <Plus className="h-4 w-4" />
          Tambah Produk
        </Button>
      </div>
    </Card>
  );
}
