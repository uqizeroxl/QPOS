import { Camera, LoaderCircle, ScanLine, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  barcodeScannerService,
  type ScannerStatus,
} from "../../services/barcode/BarcodeScannerService";
import Button from "../ui/Button";

type BarcodeScannerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
};

const statusLabels: Record<ScannerStatus, string> = {
  opening: "Membuka kamera...",
  focusing: "Memfokuskan kamera...",
  scanning: "Arahkan barcode ke dalam kotak.",
  detected: "Barcode terdeteksi.",
};

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onDetected,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<ScannerStatus>("opening");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !videoRef.current) {
      return;
    }

    const videoElement = videoRef.current;
    let isMounted = true;
    setStatus("opening");
    setError("");

    void barcodeScannerService.start(videoElement, {
      onStatusChange: (nextStatus) => {
        if (isMounted) setStatus(nextStatus);
      },
      onError: (message) => {
        if (isMounted) setError(message);
      },
      onDetected: (barcode) => {
        if (!isMounted) return;
        void barcodeScannerService.playSuccessFeedback();
        barcodeScannerService.stop();
        window.setTimeout(() => {
          onClose();
          onDetected(barcode);
        }, 250);
      },
    });

    return () => {
      isMounted = false;
      barcodeScannerService.stop();
      videoElement.srcObject = null;
    };
  }, [isOpen, onClose, onDetected]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Scanner barcode"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-lg bg-gray-950 shadow-2xl">
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4 text-white">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <h2 className="text-base font-semibold">Scan Barcode</h2>
          </div>
          <Button
            variant="unstyled"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-300 hover:bg-white/10 hover:text-white"
            aria-label="Tutup scanner"
            title="Tutup scanner"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted
            playsInline
          />
          {!error ? (
            <div className="pointer-events-none absolute inset-[31%_9%] border-2 border-white shadow-[0_0_0_999px_rgba(0,0,0,0.38)]">
              <span className="absolute -left-0.5 -top-0.5 h-7 w-7 border-l-4 border-t-4 border-blue-400" />
              <span className="absolute -right-0.5 -top-0.5 h-7 w-7 border-r-4 border-t-4 border-blue-400" />
              <span className="absolute -bottom-0.5 -left-0.5 h-7 w-7 border-b-4 border-l-4 border-blue-400" />
              <span className="absolute -bottom-0.5 -right-0.5 h-7 w-7 border-b-4 border-r-4 border-blue-400" />
              {status === "scanning" ? (
                <span className="absolute left-3 right-3 top-1/2 h-0.5 bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)]" />
              ) : null}
            </div>
          ) : null}

          {status === "opening" && !error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950/70">
              <LoaderCircle className="h-8 w-8 animate-spin text-white" />
            </div>
          ) : null}

          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-white">
              <Camera className="h-9 w-9 text-red-400" />
              <p className="text-sm leading-6 text-gray-200">{error}</p>
            </div>
          ) : null}
        </div>

        <div className="flex min-h-16 items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-200">
          {!error && status !== "opening" ? <ScanLine className="h-5 w-5 text-blue-400" /> : null}
          <span>{error || statusLabels[status]}</span>
        </div>
      </div>
    </div>
  );
}
