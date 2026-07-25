import {
  BarcodeFormat,
  BrowserMultiFormatReader,
} from "@zxing/browser";
import { Loader2, Play, RefreshCw, Square, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Button from "./ui/Button";
import Card from "./ui/Card";

type BarcodeScannerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
};

type ScannerStatus = "idle" | "opening" | "ready" | "stopped" | "detected";

const supportedFormats = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
];

const statusMessages: Record<ScannerStatus, string> = {
  idle: "Scanner siap dimulai.",
  opening: "Mengaktifkan kamera...",
  ready: "Mencari barcode...",
  stopped: "Scanner dihentikan.",
  detected: "Barcode ditemukan.",
};

const decodeIntervalMs = 140;
const duplicateDebounceMs = 2_000;
const minimumBarcodeLength = 4;
const roiRatio = 0.6;

function getCameraErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Izin kamera ditolak. Izinkan akses kamera pada pengaturan situs, lalu mulai ulang scanner.";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "Kamera tidak tersedia pada perangkat ini.";
    }
    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut lalu coba kembali.";
    }
    if (error.name === "OverconstrainedError") {
      return "Kamera tidak mendukung konfigurasi yang diperlukan scanner.";
    }
  }

  return error instanceof Error
    ? error.message
    : "Kamera tidak dapat dibuka. Silakan coba kembali.";
}

function isRearCamera(device: MediaDeviceInfo) {
  return /back|rear|environment|belakang/i.test(device.label);
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onDetected,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const permissionStreamRef = useRef<MediaStream | null>(null);
  const decodeTimerRef = useRef<number | null>(null);
  const startSequenceRef = useRef(0);
  const detectedRef = useRef(false);
  const lastDetectionRef = useRef({ barcode: "", detectedAt: 0 });
  const onCloseRef = useRef(onClose);
  const onDetectedRef = useRef(onDetected);
  const [errorMessage, setErrorMessage] = useState("");
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>("idle");

  useEffect(() => {
    onCloseRef.current = onClose;
    onDetectedRef.current = onDetected;
  }, [onClose, onDetected]);

  const stopScanner = useCallback((status: ScannerStatus = "stopped") => {
    startSequenceRef.current += 1;
    if (decodeTimerRef.current !== null) {
      window.clearTimeout(decodeTimerRef.current);
      decodeTimerRef.current = null;
    }
    permissionStreamRef.current?.getTracks().forEach((track) => track.stop());
    permissionStreamRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    const video = videoRef.current;
    const stream = video?.srcObject;
    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (video) {
      video.pause();
      video.srcObject = null;
    }
    setScannerStatus(status);
  }, []);

  const startScanner = useCallback(async () => {
    stopScanner("opening");
    const sequence = startSequenceRef.current;
    detectedRef.current = false;
    setErrorMessage("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Browser ini tidak mendukung akses kamera. Gunakan browser terbaru melalui HTTPS.",
        );
      }

      permissionStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      if (sequence !== startSequenceRef.current) return;

      const cameras = (await navigator.mediaDevices.enumerateDevices()).filter(
        (device) => device.kind === "videoinput",
      );
      if (cameras.length === 0) {
        throw new DOMException("No camera found", "NotFoundError");
      }

      const selectedCamera = cameras.find(isRearCamera) ?? cameras[0];
      permissionStreamRef.current.getTracks().forEach((track) => track.stop());
      permissionStreamRef.current = null;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          deviceId: { exact: selectedCamera.deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (sequence !== startSequenceRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Preview kamera tidak dapat disiapkan.");
      video.srcObject = stream;
      await video.play();
      if (sequence !== startSequenceRef.current) return;

      const reader = new BrowserMultiFormatReader();
      reader.possibleFormats = supportedFormats;
      const roiCanvas = document.createElement("canvas");
      const roiContext = roiCanvas.getContext("2d", {
        alpha: false,
        willReadFrequently: true,
      });
      if (!roiContext) throw new Error("Area pemindaian tidak dapat disiapkan.");

      setScannerStatus("ready");

      const decodeRoi = () => {
        if (sequence !== startSequenceRef.current || detectedRef.current) return;

        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          const roiWidth = Math.max(1, Math.round(video.videoWidth * roiRatio));
          const roiHeight = Math.max(1, Math.round(video.videoHeight * roiRatio));
          const roiX = Math.round((video.videoWidth - roiWidth) / 2);
          const roiY = Math.round((video.videoHeight - roiHeight) / 2);

          if (roiCanvas.width !== roiWidth) roiCanvas.width = roiWidth;
          if (roiCanvas.height !== roiHeight) roiCanvas.height = roiHeight;
          roiContext.drawImage(
            video,
            roiX,
            roiY,
            roiWidth,
            roiHeight,
            0,
            0,
            roiWidth,
            roiHeight,
          );

          try {
            const barcode = reader.decodeFromCanvas(roiCanvas).getText().trim();
            const detectedAt = Date.now();
            const isDuplicate =
              barcode === lastDetectionRef.current.barcode &&
              detectedAt - lastDetectionRef.current.detectedAt < duplicateDebounceMs;

            if (barcode.length >= minimumBarcodeLength && !isDuplicate) {
              lastDetectionRef.current = { barcode, detectedAt };
              detectedRef.current = true;
              stopScanner("detected");
              navigator.vibrate?.(80);
              onDetectedRef.current(barcode);
              return;
            }
          } catch {
            // No supported barcode was found inside the ROI during this interval.
          }
        }

        if (sequence === startSequenceRef.current && !detectedRef.current) {
          decodeTimerRef.current = window.setTimeout(decodeRoi, decodeIntervalMs);
        }
      };

      decodeTimerRef.current = window.setTimeout(decodeRoi, decodeIntervalMs);
    } catch (error) {
      if (sequence !== startSequenceRef.current) return;
      stopScanner("stopped");
      setErrorMessage(getCameraErrorMessage(error));
    }
  }, [stopScanner]);

  const restartScanner = useCallback(() => {
    void startScanner();
  }, [startScanner]);

  useEffect(() => {
    if (isOpen) {
      void startScanner();
    } else {
      stopScanner("idle");
    }

    return () => stopScanner("idle");
  }, [isOpen, startScanner, stopScanner]);

  if (!isOpen) return null;

  const handleClose = () => {
    stopScanner("idle");
    onCloseRef.current();
  };

  const isRunning = scannerStatus === "opening" || scannerStatus === "ready";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="barcode-scanner-title"
    >
      <Card className="w-full max-w-lg overflow-hidden border-0 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 id="barcode-scanner-title" className="text-lg font-semibold text-gray-900">
              Scanner Barcode
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Pindai barcode produk dengan kamera belakang.
            </p>
          </div>
          <Button variant="icon" onClick={handleClose} aria-label="Tutup scanner">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-5">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-950">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              autoPlay
              muted
              playsInline
            />
            {!errorMessage && scannerStatus !== "stopped" ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-3/5 w-3/5 overflow-hidden rounded-lg border-2 border-blue-400/80">
                  {scannerStatus === "ready" ? (
                    <span className="barcode-scan-line absolute left-2 right-2 h-0.5 bg-blue-400 shadow-[0_0_8px_2px_rgba(96,165,250,0.75)]" />
                  ) : null}
                </div>
              </div>
            ) : null}
            {scannerStatus === "opening" && !errorMessage ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-950/60 text-white">
                <Loader2 className="h-7 w-7 animate-spin" />
                <p className="text-sm font-medium">Mengaktifkan kamera...</p>
              </div>
            ) : null}
          </div>

          {errorMessage ? (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          ) : (
            <p
              className={`mt-3 text-center text-sm font-medium ${
                scannerStatus === "detected" ? "text-emerald-600" : "text-gray-500"
              }`}
              aria-live="polite"
            >
              {statusMessages[scannerStatus]}
            </p>
          )}

          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-4">
            <Button variant="secondary" onClick={() => void startScanner()} disabled={isRunning}>
              <Play className="h-4 w-4" />
              Start Scanner
            </Button>
            <Button variant="secondary" onClick={() => stopScanner()} disabled={!isRunning}>
              <Square className="h-4 w-4" />
              Stop Scanner
            </Button>
            <Button variant="secondary" onClick={restartScanner}>
              <RefreshCw className="h-4 w-4" />
              Restart Scanner
            </Button>
            <Button variant="secondary" onClick={handleClose}>Tutup</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
