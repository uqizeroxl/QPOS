import { History, Pencil, SlidersHorizontal, Trash2 } from "lucide-react";
import Button from "../../components/ui/Button";
import { TableCell, TableRow } from "../../components/ui/Table";
import { formatRupiah } from "../../utils/currency";
import type { Product } from "./ProductTypes";

type ProductRowProps = {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onAdjustStock: (product: Product) => void;
  onShowStockHistory: (product: Product) => void;
};

export default function ProductRow({
  product,
  onEdit,
  onDelete,
  onAdjustStock,
  onShowStockHistory,
}: ProductRowProps) {
  const isLowStock = product.stock < 5;

  return (
    <TableRow className="border-b border-gray-100 last:border-0">
      <TableCell className="whitespace-nowrap text-sm font-medium text-gray-700">
        {product.barcode || "-"}
      </TableCell>
      <TableCell className="min-w-56">
        <p className="font-semibold text-gray-900">{product.name}</p>
        <p className="text-sm text-gray-500">{product.status}</p>
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm text-gray-600">
        {product.category}
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm text-gray-600">
        {product.purchasePrice === null
          ? "-"
          : formatRupiah(product.purchasePrice, { prefix: true })}
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm font-semibold text-gray-900">
        {formatRupiah(product.sellingPrice, { prefix: true })}
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm font-semibold text-gray-900">
        {product.stock}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            isLowStock
              ? "bg-red-50 text-red-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {isLowStock ? "Stok Menipis" : "Stok Aman"}
        </span>
      </TableCell>
      <TableCell className="whitespace-nowrap text-right">
        <div className="inline-flex items-center gap-2">
          <Button
            variant="icon"
            onClick={() => onAdjustStock(product)}
            className="hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            aria-label={`Adjust stock ${product.name}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant="icon"
            onClick={() => onShowStockHistory(product)}
            className="hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            aria-label={`Stock history ${product.name}`}
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="icon"
            onClick={() => onEdit(product)}
            className="hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            aria-label={`Edit ${product.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="dangerIcon"
            onClick={() => onDelete(product.id)}
            aria-label={`Hapus ${product.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
