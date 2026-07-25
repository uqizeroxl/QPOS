import { BarcodeFormat, BrowserMultiFormatReader } from "@zxing/browser";
import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Button from "./ui/Button";
import Card from "./ui/Card";

type BarcodeScannerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
};

type ScannerStatus = "opening" | "unfocused" | "ready" | "detected";
type NativeBarcodeFormat =
  | "ean_13"
  | "ean_8"
  | "upc_a"
  | "upc_e"
  | "code_128"
  | "code_39";

type NativeBarcodeDetector = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
};

type NativeBarcodeDetectorConstructor = {
  new (options: { formats: NativeBarcodeFormat[] }): NativeBarcodeDetector;
  getSupportedFormats?: () => Promise<string[]>;
};

const nativeFormats: NativeBarcodeFormat[] = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
];

const zxingFormats = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
];

const decodeInterval = 120;
const duplicateDetectionDelay = 1500;
const roiWidthRatio = 0.8;
const roiHeightRatio = 0.42;

const statusMessages: Record<ScannerStatus, string> = {
  opening: "Membuka kamera...",
  unfocused: "Kamera belum fokus.",
  ready: "Arahkan barcode ke kotak.",
  detected: "Barcode terdeteksi.",
};

function getBarcodeDetectorConstructor() {
  return (
    globalThis as typeof globalThis & {
      BarcodeDetector?: NativeBarcodeDetectorConstructor;
    }
  ).BarcodeDetector;
}

function playDetectionBeep() {
  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gain.gain.setValueAtTime(0.12, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.12,
    );
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.addEventListener("ended", () => void audioContext.close());
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.12);
  } catch {
    // Audio feedback is optional when Web Audio is unavailable or blocked.
  }
}

async function createNativeDetector() {
  const BarcodeDetector = getBarcodeDetectorConstructor();
  if (!BarcodeDetector) return null;

  try {
    const supportedFormats = BarcodeDetector.getSupportedFormats
      ? await BarcodeDetector.getSupportedFormats()
      : nativeFormats;
    const formats = nativeFormats.filter((format) =>
      supportedFormats.includes(format),
    );

    return formats.length > 0 ? new BarcodeDetector({ formats }) : null;
  } catch {
    return null;
  }
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onDetected,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const decodeTimerRef = useRef<number | null>(null);
  const focusTimerRef = useRef<number | null>(null);
  const completionTimerRef = useRef<number | null>(null);
  const detectedRef = useRef(false);
  const lastDetectionRef = useRef({ barcode: "", detectedAt: 0 });
  const onCloseRef = useRef(onClose);
  const onDetectedRef = useRef(onDetected);
  const [errorMessage, setErrorMessage] = useState("");
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>("opening");

  useEffect(() => {
    onCloseRef.current = onClose;
    onDetectedRef.current = onDetected;
  }, [onClose, onDetected]);

  const stopScanner = useCallback(() => {
    if (decodeTimerRef.current !== null) {
      window.clearTimeout(decodeTimerRef.current);
      decodeTimerRef.current = null;
    }
    if (focusTimerRef.current !== null) {
      window.clearTimeout(focusTimerRef.current);
      focusTimerRef.current = null;
    }
    if (completionTimerRef.current !== null) {
      window.clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }

    const videoStream = videoRef.current?.srcObject;
    if (
      videoStream &&
      typeof MediaStream !== "undefined" &&
      videoStream instanceof MediaStream
    ) {
      videoStream.getTracks().forEach((track) => track.stop());
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    let isActive = true;
    detectedRef.current = false;
    setErrorMessage("");
    setScannerStatus("opening");

    const handleDetection = (barcode: string) => {
      if (!barcode || detectedRef.current || !isActive) return;

      const detectedAt = Date.now();
      if (
        lastDetectionRef.current.barcode === barcode &&
        detectedAt - lastDetectionRef.current.detectedAt < duplicateDetectionDelay
      ) {
        return;
      }

      lastDetectionRef.current = { barcode, detectedAt };
      detectedRef.current = true;
      setScannerStatus("detected");
      playDetectionBeep();
      navigator.vibrate?.(80);
      stopScanner();
      completionTimerRef.current = window.setTimeout(() => {
        completionTimerRef.current = null;
        onCloseRef.current();
        onDetectedRef.current(barcode);
      }, 180);
    };

    const startScanner = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Browser atau perangkat ini tidak mendukung akses kamera. Gunakan browser terbaru dan buka aplikasi melalui koneksi HTTPS.",
          );
        }

        const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
        const supportsResizeMode = (
          supportedConstraints as MediaTrackSupportedConstraints & {
            resizeMode?: boolean;
          }
        ).resizeMode;
        const videoConstraints: MediaTrackConstraints & {
          resizeMode?: ConstrainDOMString;
        } = {
          facingMode: { ideal: "environment" },
          width: { min: 1280, ideal: 1920 },
          height: { min: 720, ideal: 1080 },
          ...(supportsResizeMode
            ? { resizeMode: { ideal: "crop-and-scale" } }
            : {}),
        };
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: videoConstraints,
        });

        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) throw new Error("Preview kamera tidak dapat disiapkan.");

        video.srcObject = stream;
        await video.play();
        if (!isActive) return;

        setScannerStatus("unfocused");
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack?.getCapabilities) {
          const capabilities = videoTrack.getCapabilities() as MediaTrackCapabilities & {
            focusMode?: string[];
          };
          if (capabilities.focusMode?.includes("continuous")) {
            await videoTrack.applyConstraints({
              advanced: [
                { focusMode: "continuous" } as MediaTrackConstraintSet,
              ],
            });
          }
        }

        const nativeDetector = await createNativeDetector();
        const zxingReader = new BrowserMultiFormatReader();
        zxingReader.possibleFormats = zxingFormats;
        const roiCanvas = document.createElement("canvas");
        const roiContext = roiCanvas.getContext("2d", {
          alpha: false,
          willReadFrequently: true,
        });
        if (!roiContext) throw new Error("Area pemindaian tidak dapat disiapkan.");

        focusTimerRef.current = window.setTimeout(() => {
          if (isActive && !detectedRef.current) setScannerStatus("ready");
        }, 800);

        let useNativeDetector = Boolean(nativeDetector);
        const decodeFrame = async () => {
          if (!isActive || detectedRef.current) return;

          try {
            if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
              const roiWidth = Math.round(video.videoWidth * roiWidthRatio);
              const roiHeight = Math.round(video.videoHeight * roiHeightRatio);
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

              if (useNativeDetector && nativeDetector) {
                try {
                  const barcodes = await nativeDetector.detect(roiCanvas);
                  const barcode = barcodes[0]?.rawValue;
                  if (barcode) handleDetection(barcode);
                } catch {
                  useNativeDetector = false;
                }
              }

              if (!useNativeDetector && !detectedRef.current) {
                try {
                  handleDetection(zxingReader.decodeFromCanvas(roiCanvas).getText());
                } catch {
                  // No supported barcode was found in this ROI frame.
                }
              }
            }
          } finally {
            if (isActive && !detectedRef.current) {
              decodeTimerRef.current = window.setTimeout(
                () => void decodeFrame(),
                decodeInterval,
              );
            }
          }
        };

        void decodeFrame();
      } catch (error) {
        stopScanner();
        if (!isActive) return;

        if (
          error instanceof DOMException &&
          (error.name === "NotAllowedError" || error.name === "SecurityError")
        ) {
          setErrorMessage(
            "Izin kamera ditolak. Buka pengaturan situs di browser, izinkan akses Kamera, lalu buka scanner kembali.",
          );
        } else if (error instanceof DOMException && error.name === "NotFoundError") {
          setErrorMessage("Kamera belakang tidak ditemukan pada perangkat ini.");
        } else if (error instanceof DOMException && error.name === "OverconstrainedError") {
          setErrorMessage(
            "Kamera tidak mendukung resolusi minimum 1280x720 yang diperlukan scanner.",
          );
        } else if (error instanceof DOMException && error.name === "NotReadableError") {
          setErrorMessage(
            "Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut lalu coba kembali.",
          );
        } else {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Kamera tidak dapat dibuka. Silakan coba kembali.",
          );
        }
      }
    };

    void startScanner();

    return () => {
      isActive = false;
      stopScanner();
    };
  }, [isOpen, stopScanner]);

  if (!isOpen) return null;

  const handleClose = () => {
    stopScanner();
    onClose();
  };

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
            <h2
              id="barcode-scanner-title"
              className="text-lg font-semibold text-gray-900"
            >
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
            {!errorMessage ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-[42%] w-4/5 overflow-hidden rounded-lg border-2 border-blue-400/80">
                  {scannerStatus !== "opening" && scannerStatus !== "detected" ? (
                    <span className="barcode-scan-line absolute left-2 right-2 h-0.5 bg-blue-400 shadow-[0_0_8px_2px_rgba(96,165,250,0.75)]" />
                  ) : null}
                </div>
              </div>
            ) : null}
            {scannerStatus === "opening" && !errorMessage ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-950/60 text-white">
                <Loader2 className="h-7 w-7 animate-spin" />
                <p className="text-sm font-medium">Membuka kamera...</p>
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

          <div className="mt-5 flex justify-end border-t border-gray-200 pt-4">
            <Button variant="secondary" onClick={handleClose}>Tutup</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
