import { X } from "lucide-react";
import { useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input, Select, Textarea } from "../../components/ui/Input";
import type {
  StockAdjustmentPayload,
  StockAdjustmentType,
} from "../../services/productService";
import type { Product } from "../../types";

type StockAdjustmentModalProps = {
  product: Product | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: StockAdjustmentPayload) => Promise<boolean>;
};

export default function StockAdjustmentModal({
  product,
  isSubmitting = false,
  onClose,
  onSubmit,
}: StockAdjustmentModalProps) {
  const [type, setType] = useState<StockAdjustmentType>("ADD");
  const [quantity, setQuantity] = useState("0");
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  if (!product) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextQuantity = Number(quantity);

    if (!Number.isInteger(nextQuantity) || nextQuantity < 0) {
      setErrorMessage("Jumlah harus berupa angka 0 atau lebih.");
      return;
    }

    if (type !== "SET" && nextQuantity <= 0) {
      setErrorMessage("Jumlah harus lebih dari 0.");
      return;
    }

    setErrorMessage("");

    const isSaved = await onSubmit({
      type,
      quantity: nextQuantity,
      note,
    });

    if (isSaved) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/40 p-4">
      <Card className="w-full max-w-lg border-0 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Adjust Stock
            </h2>
            <p className="text-sm text-gray-500">
              {product.name} - stok saat ini {product.stock}
            </p>
          </div>

          <Button variant="icon" onClick={onClose} aria-label="Tutup">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Tipe</span>
            <Select
              value={type}
              onChange={(event) =>
                setType(event.target.value as StockAdjustmentType)
              }
            >
              <option value="ADD">Add</option>
              <option value="REDUCE">Reduce</option>
              <option value="SET">Set</option>
            </Select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Jumlah</span>
            <Input
              min={0}
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Catatan</span>
            <Textarea
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>

          {errorMessage ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
