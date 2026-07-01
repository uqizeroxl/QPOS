import { Plus, Search } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Input";

type ProductToolbarProps = {
  searchTerm: string;
  selectedCategory: string;
  categories: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onAddProduct: () => void;
};

export default function ProductToolbar({
  searchTerm,
  selectedCategory,
  categories,
  onSearchChange,
  onCategoryChange,
  onAddProduct,
}: ProductToolbarProps) {
  return (
    <Card className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
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

        <label>
          <span className="sr-only">Filter kategori</span>
          <Select
            value={selectedCategory}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="font-medium text-gray-700 sm:w-48"
          >
            <option value="Semua">Semua Kategori</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <Button onClick={onAddProduct}>
        <Plus className="h-4 w-4" />
        Tambah Produk
      </Button>
    </Card>
  );
}
