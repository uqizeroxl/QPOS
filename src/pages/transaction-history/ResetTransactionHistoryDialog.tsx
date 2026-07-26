import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";

type ResetTransactionHistoryDialogProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ResetTransactionHistoryDialog({
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: ResetTransactionHistoryDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setConfirmation("");
    window.setTimeout(() => inputRef.current?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-transaction-history-title"
    >
      <Card className="w-full max-w-md border-0 shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 id="reset-transaction-history-title" className="font-semibold text-gray-900">
                Reset Seluruh Riwayat
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Seluruh transaksi dan detail item akan dihapus permanen. Stok produk tidak akan berubah.
              </p>
            </div>
          </div>
          <Button variant="icon" onClick={onClose} disabled={isSubmitting} aria-label="Tutup">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4 p-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Ketik <strong>RESET</strong> untuk melanjutkan
            </span>
            <Input
              ref={inputRef}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={isSubmitting}
              autoComplete="off"
            />
          </label>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              onClick={onConfirm}
              disabled={confirmation !== "RESET" || isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Menghapus..." : "Hapus Seluruh Riwayat"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
