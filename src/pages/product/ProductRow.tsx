import { History, Pencil, SlidersHorizontal } from "lucide-react";
import Button from "../../components/ui/Button";
import { TableCell, TableRow } from "../../components/ui/Table";
import { formatRupiah, parseRupiah } from "../../utils/currency";
import { Input } from "../../components/ui/Input";
import type { BulkProductDraft, Product } from "../../types";
import StockStatusBadge from "../../components/ui/StockStatusBadge";

type FormattedPriceInputProps = {
  value: number | null;
  isChanged: boolean;
  label: string;
  onChange: (value: number | null) => void;
};

function FormattedPriceInput({
  value,
  isChanged,
  label,
  onChange,
}: FormattedPriceInputProps) {
  return (
    <Input
      inputSize="compact"
      type="text"
      inputMode="numeric"
      aria-label={label}
      value={value !== null && Number.isFinite(value) ? formatRupiah(value) : ""}
      onChange={(event) => {
        const input = event.currentTarget;
        const caret = input.selectionStart ?? input.value.length;
        const digitsBeforeCaret = input.value.slice(0, caret).replace(/\D/g, "").length;
        const digits = input.value.replace(/\D/g, "");

        onChange(digits ? parseRupiah(digits) : null);

        window.requestAnimationFrame(() => {
          const formattedValue = input.value;
          let digitCount = 0;
          let nextCaret = formattedValue.length;

          if (digitsBeforeCaret === 0) {
            nextCaret = 0;
          } else {
            for (let index = 0; index < formattedValue.length; index += 1) {
              if (/\d/.test(formattedValue[index])) digitCount += 1;
              if (digitCount === digitsBeforeCaret) {
                nextCaret = index + 1;
                break;
              }
            }
          }

          input.setSelectionRange(nextCaret, nextCaret);
        });
      }}
      className={isChanged ? "border-amber-400 bg-amber-50" : ""}
    />
  );
}

type ProductRowProps = {
  product: Product;
  isSelected: boolean;
  isDeleteMode: boolean;
  onSelectionChange: (product: Product, selected: boolean) => void;
  onEdit: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onShowStockHistory: (product: Product) => void;
  editDraft?: BulkProductDraft;
  onDraftChange: (productId: string, changes: Partial<BulkProductDraft>) => void;
};

export default function ProductRow({
  product,
  isSelected,
  isDeleteMode,
  onSelectionChange,
  onEdit,
  onAdjustStock,
  onShowStockHistory,
  editDraft,
  onDraftChange,
}: ProductRowProps) {
  return (
    <TableRow className="border-b border-gray-100 last:border-0">
      {isDeleteMode ? (
        <TableCell className="w-12">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(event) => onSelectionChange(product, event.target.checked)}
            aria-label={`Pilih ${product.name}`}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </TableCell>
      ) : null}
      <TableCell className="whitespace-nowrap text-sm font-medium text-gray-700">
        {editDraft ? (
          <Input
            inputSize="compact"
            value={editDraft.barcode}
            onChange={(event) => onDraftChange(product.id, { barcode: event.target.value })}
            className={editDraft.barcode !== product.barcode ? "border-amber-400 bg-amber-50" : ""}
          />
        ) : product.barcode || "-"}
      </TableCell>
      <TableCell className="min-w-56">
        {editDraft ? (
          <Input
            inputSize="compact"
            value={editDraft.name}
            onChange={(event) => onDraftChange(product.id, { name: event.target.value })}
            className={editDraft.name !== product.name ? "border-amber-400 bg-amber-50" : ""}
          />
        ) : <p className="font-semibold text-gray-900">{product.name}</p>}
        <p className="text-sm text-gray-500">{product.status}</p>
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm text-gray-600">
        {product.category}
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm text-gray-600">
        {editDraft ? (
          <FormattedPriceInput
            label={`Harga beli ${product.name}`}
            value={editDraft.purchasePrice}
            onChange={(purchasePrice) => onDraftChange(product.id, { purchasePrice })}
            isChanged={editDraft.purchasePrice !== product.purchasePrice}
          />
        ) : product.purchasePrice === null
          ? "-"
          : formatRupiah(product.purchasePrice, { prefix: true })}
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm font-semibold text-gray-900">
        {editDraft ? (
          <FormattedPriceInput
            label={`Harga jual ${product.name}`}
            value={Number.isFinite(editDraft.sellingPrice) ? editDraft.sellingPrice : null}
            onChange={(sellingPrice) => onDraftChange(product.id, { sellingPrice: sellingPrice ?? Number.NaN })}
            isChanged={editDraft.sellingPrice !== product.sellingPrice}
          />
        ) : formatRupiah(product.sellingPrice, { prefix: true })}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center align-middle text-sm font-semibold text-gray-900">
        {product.stock}
      </TableCell>
      <TableCell className="min-w-32 whitespace-nowrap text-center align-middle text-sm font-semibold text-gray-700">
        {product.minimumStock}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center align-middle">
        <span className="inline-flex items-center justify-center">
          <StockStatusBadge
            stock={product.stock}
            minimumStock={product.minimumStock}
          />
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
        </div>
      </TableCell>
    </TableRow>
  );
}
