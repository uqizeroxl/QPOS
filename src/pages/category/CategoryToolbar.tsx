import { Plus, Search } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Input";
import type { CategorySortKey, SortDirection } from "../../types/category";

type CategoryToolbarProps = {
  searchTerm: string;
  sortKey: CategorySortKey;
  sortDirection: SortDirection;
  onSearchChange: (value: string) => void;
  onSortKeyChange: (value: CategorySortKey) => void;
  onSortDirectionChange: (value: SortDirection) => void;
  onAddCategory: () => void;
};

export default function CategoryToolbar({
  searchTerm,
  sortKey,
  sortDirection,
  onSearchChange,
  onSortKeyChange,
  onSortDirectionChange,
  onAddCategory,
}: CategoryToolbarProps) {
  return (
    <Card className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Cari kategori</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari nama atau deskripsi kategori"
            className="bg-white pl-10 pr-3 text-gray-700"
          />
        </label>

        <label>
          <span className="sr-only">Urutkan kategori</span>
          <Select
            value={sortKey}
            onChange={(event) =>
              onSortKeyChange(event.target.value as CategorySortKey)
            }
            className="font-medium text-gray-700 sm:w-48"
          >
            <option value="name">Nama</option>
            <option value="productCount">Jumlah Produk</option>
            <option value="status">Status</option>
            <option value="createdAt">Tanggal Dibuat</option>
            <option value="updatedAt">Terakhir Diubah</option>
          </Select>
        </label>

        <label>
          <span className="sr-only">Arah sorting</span>
          <Select
            value={sortDirection}
            onChange={(event) =>
              onSortDirectionChange(event.target.value as SortDirection)
            }
            className="font-medium text-gray-700 sm:w-36"
          >
            <option value="asc">A-Z</option>
            <option value="desc">Z-A</option>
          </Select>
        </label>
      </div>

      <Button onClick={onAddCategory}>
        <Plus className="h-4 w-4" />
        Tambah Kategori
      </Button>
    </Card>
  );
}
