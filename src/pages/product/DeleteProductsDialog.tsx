import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { Product } from "../../types";

type DeleteProductsDialogProps = {
  products: Product[];
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteProductsDialog({
  products,
  isSubmitting,
  onClose,
  onConfirm,
}: DeleteProductsDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConfirmation("");
    window.setTimeout(() => inputRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  const visibleProducts = products.slice(0, 10);
  const remainingCount = products.length - visibleProducts.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-products-title"
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <h2 id="delete-products-title" className="font-semibold text-gray-900">
                Hapus Produk
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Riwayat transaksi tetap aman dan tidak akan ikut dihapus.
              </p>
            </div>
          </div>
          <Button variant="icon" onClick={onClose} disabled={isSubmitting} aria-label="Tutup">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ul className="mt-4 max-h-48 list-disc space-y-1 overflow-auto pl-5 text-sm text-gray-700">
          {visibleProducts.map((product) => <li key={product.id}>{product.name}</li>)}
          {remainingCount > 0 ? <li className="font-semibold">+{remainingCount} lainnya</li> : null}
        </ul>
        <p className="mt-3 text-sm font-semibold text-gray-800">
          {products.length} produk akan dihapus.
        </p>

        <label className="mt-5 block space-y-2">
          <span className="text-sm font-medium text-gray-700">
            Ketik <strong>HAPUS</strong> untuk melanjutkan
          </span>
          <Input
            ref={inputRef}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            disabled={isSubmitting}
            autoComplete="off"
          />
        </label>

        <div className="mt-5 flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmation !== "HAPUS" || isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}
