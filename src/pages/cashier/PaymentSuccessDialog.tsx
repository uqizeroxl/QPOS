import { Printer } from "lucide-react";
import { useEffect, useRef } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";

type PaymentSuccessDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
};

export default function PaymentSuccessDialog({
  isOpen,
  onClose,
  onPrint,
}: PaymentSuccessDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const printButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    printButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (
        event.key === "Enter" &&
        document.activeElement !== closeButtonRef.current &&
        document.activeElement !== printButtonRef.current
      ) {
        event.preventDefault();
        onPrint();
        return;
      }

      if (
        event.key === "Tab" &&
        !event.shiftKey &&
        document.activeElement === printButtonRef.current
      ) {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, onPrint]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <Card className="w-full max-w-sm border-0 p-5 text-center shadow-xl">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Printer className="h-5 w-5" />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          Cetak struk?
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Transaksi berhasil.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button ref={closeButtonRef} variant="secondary" onClick={onClose}>
            Tidak
          </Button>
          <Button ref={printButtonRef} onClick={onPrint}>
            <Printer className="h-4 w-4" />
            Ya
          </Button>
        </div>
      </Card>
    </div>
  );
}
