import { useEffect } from "react";
import Button from "../../components/ui/Button";

type Props = {
  changedCount: number;
  unchangedCount: number;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function BulkUpdateConfirmationDialog({
  changedCount,
  unchangedCount,
  isSubmitting,
  onClose,
  onConfirm,
}: Props) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="bulk-update-title" className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <h2 id="bulk-update-title" className="text-lg font-semibold text-gray-900">Konfirmasi Perubahan Massal</h2>
        <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
          <p>Produk berubah: <strong>{changedCount}</strong></p>
          <p>Produk tidak berubah: <strong>{unchangedCount}</strong></p>
        </div>
        <p className="mt-4 text-sm text-gray-700">Anda akan memperbarui <strong>{changedCount} produk</strong>.</p>
        <div className="mt-5 flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button onClick={onConfirm} disabled={changedCount === 0 || isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Lanjutkan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
