import {
  BarcodeFormat,
  BrowserMultiFormatReader,
} from "@zxing/browser";
import { Flashlight, Loader2, Play, RefreshCw, Square, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Button from "./ui/Button";
import Card from "./ui/Card";

type BarcodeScannerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
};

type ScannerStatus =
  | "idle"
  | "requesting"
  | "opening"
  | "ready"
  | "stopped"
  | "detected";

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
  requesting: "Meminta izin kamera...",
  opening: "Membuka kamera...",
  ready: "Mencari barcode...",
  stopped: "Scanner dihentikan.",
  detected: "Barcode ditemukan.",
};

const decodeIntervalMs = 140;
const duplicateDebounceMs = 2_000;
const minimumBarcodeLength = 4;
const roiRatio = 0.6;

type ExtendedTrackCapabilities = MediaTrackCapabilities & {
  torch?: boolean;
  zoom?: { min: number; max: number; step: number };
  focusMode?: string[];
  exposureMode?: string[];
};

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

function playSuccessBeep() {
  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gain.gain.setValueAtTime(0.1, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.12);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.addEventListener("ended", () => void audioContext.close(), { once: true });
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.12);
  } catch {
    // Audio feedback is optional when Web Audio is unavailable or blocked.
  }
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onDetected,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const permissionStreamRef = useRef<MediaStream | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const decodeTimerRef = useRef<number | null>(null);
  const startSequenceRef = useRef(0);
  const detectedRef = useRef(false);
  const lastDetectionRef = useRef({ barcode: "", detectedAt: 0 });
  const onCloseRef = useRef(onClose);
  const onDetectedRef = useRef(onDetected);
  const [errorMessage, setErrorMessage] = useState("");
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>("idle");
  const [supportsTorch, setSupportsTorch] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoomRange, setZoomRange] = useState<{
    min: number;
    max: number;
    step: number;
  } | null>(null);
  const [zoom, setZoom] = useState(1);

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
    videoTrackRef.current = null;
    setSupportsTorch(false);
    setTorchEnabled(false);
    setZoomRange(null);

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
    stopScanner("requesting");
    const sequence = startSequenceRef.current;
    detectedRef.current = false;
    setErrorMessage("");

    const releaseAttemptResources = () => {
      permissionStreamRef.current?.getTracks().forEach((track) => track.stop());
      permissionStreamRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      videoTrackRef.current = null;
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
    };

    const initializeCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Browser ini tidak mendukung akses kamera. Gunakan browser terbaru melalui HTTPS.",
        );
      }

      permissionStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      if (sequence !== startSequenceRef.current) {
        releaseAttemptResources();
        return;
      }
      setScannerStatus("opening");

      const cameras = (await navigator.mediaDevices.enumerateDevices()).filter(
        (device) => device.kind === "videoinput",
      );
      if (cameras.length === 0) {
        throw new DOMException("No camera found", "NotFoundError");
      }

      const selectedCamera = cameras.find(isRearCamera) ?? cameras[0];
      permissionStreamRef.current.getTracks().forEach((track) => track.stop());
      permissionStreamRef.current = null;

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            deviceId: { exact: selectedCamera.deviceId },
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch (constraintError) {
        if (
          !(constraintError instanceof DOMException) ||
          constraintError.name !== "OverconstrainedError"
        ) {
          throw constraintError;
        }
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" } },
        });
      }
      if (sequence !== startSequenceRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const videoTrack = stream.getVideoTracks()[0];
      videoTrackRef.current = videoTrack ?? null;
      const video = videoRef.current;
      if (!video) throw new Error("Preview kamera tidak dapat disiapkan.");
      video.srcObject = stream;
      await video.play();
      if (sequence !== startSequenceRef.current) {
        releaseAttemptResources();
        return;
      }

      if (videoTrack?.getCapabilities) {
        const capabilities = videoTrack.getCapabilities() as ExtendedTrackCapabilities;
        setSupportsTorch(capabilities.torch === true);
        if (capabilities.zoom) {
          const settings = videoTrack.getSettings() as MediaTrackSettings & { zoom?: number };
          const initialZoom = settings.zoom ?? capabilities.zoom.min;
          setZoomRange(capabilities.zoom);
          setZoom(initialZoom);
        }

        const advanced: MediaTrackConstraintSet[] = [];
        if (capabilities.focusMode?.includes("continuous")) {
          advanced.push({ focusMode: "continuous" } as MediaTrackConstraintSet);
        } else if (capabilities.focusMode?.includes("auto")) {
          advanced.push({ focusMode: "auto" } as MediaTrackConstraintSet);
        }
        if (capabilities.exposureMode?.includes("continuous")) {
          advanced.push({ exposureMode: "continuous" } as MediaTrackConstraintSet);
        }
        if (advanced.length > 0) {
          try {
            await videoTrack.applyConstraints({ advanced });
          } catch {
            // Optional camera enhancements must not prevent scanning.
          }
        }
      }

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
              playSuccessBeep();
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
    };

    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await initializeCamera();
        return;
      } catch (error) {
        lastError = error;
        releaseAttemptResources();
        if (sequence !== startSequenceRef.current) return;
        if (attempt === 0) {
          await new Promise((resolve) => window.setTimeout(resolve, 250));
        }
      }
    }

    if (sequence !== startSequenceRef.current) return;
    stopScanner("stopped");
    setErrorMessage(getCameraErrorMessage(lastError));
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

  useEffect(() => {
    if (!isOpen) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopScanner("stopped");
      } else if (!detectedRef.current) {
        void startScanner();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isOpen, startScanner, stopScanner]);

  const toggleTorch = async () => {
    const track = videoTrackRef.current;
    if (!track || !supportsTorch) return;

    const nextValue = !torchEnabled;
    try {
      await track.applyConstraints({
        advanced: [{ torch: nextValue } as MediaTrackConstraintSet],
      });
      setTorchEnabled(nextValue);
    } catch {
      setErrorMessage("Flash kamera tidak dapat diaktifkan pada perangkat ini.");
    }
  };

  const changeZoom = async (nextZoom: number) => {
    const track = videoTrackRef.current;
    if (!track || !zoomRange) return;

    try {
      await track.applyConstraints({
        advanced: [{ zoom: nextZoom } as MediaTrackConstraintSet],
      });
      setZoom(nextZoom);
    } catch {
      setErrorMessage("Zoom kamera tidak dapat diubah pada perangkat ini.");
    }
  };

  if (!isOpen) return null;

  const handleClose = () => {
    stopScanner("idle");
    onCloseRef.current();
  };

  const isRunning =
    scannerStatus === "requesting" ||
    scannerStatus === "opening" ||
    scannerStatus === "ready";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="barcode-scanner-title"
    >
      <Card className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto border-0 shadow-xl">
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
                <div className="relative h-3/5 w-3/5 overflow-hidden rounded-md shadow-[0_0_0_9999px_rgba(3,7,18,0.52)]">
                  <span className="absolute left-0 top-0 h-7 w-7 rounded-tl-md border-l-4 border-t-4 border-cyan-400" />
                  <span className="absolute right-0 top-0 h-7 w-7 rounded-tr-md border-r-4 border-t-4 border-cyan-400" />
                  <span className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-md border-b-4 border-l-4 border-cyan-400" />
                  <span className="absolute bottom-0 right-0 h-7 w-7 rounded-br-md border-b-4 border-r-4 border-cyan-400" />
                  {scannerStatus === "ready" ? (
                    <span className="barcode-scan-line absolute left-3 right-3 h-0.5 bg-cyan-300 shadow-[0_0_8px_2px_rgba(103,232,249,0.75)]" />
                  ) : null}
                </div>
              </div>
            ) : null}
            {(scannerStatus === "requesting" || scannerStatus === "opening") &&
            !errorMessage ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-950/60 text-white">
                <Loader2 className="h-7 w-7 animate-spin" />
                <p className="text-sm font-medium">{statusMessages[scannerStatus]}</p>
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
            {zoomRange ? (
              <label className="mr-auto flex min-w-40 items-center gap-2 text-sm text-gray-600">
                Zoom
                <input
                  type="range"
                  min={zoomRange.min}
                  max={zoomRange.max}
                  step={zoomRange.step || 0.1}
                  value={zoom}
                  onChange={(event) => void changeZoom(Number(event.target.value))}
                  disabled={!isRunning}
                  aria-label="Zoom kamera"
                />
              </label>
            ) : null}
            {supportsTorch ? (
              <Button
                variant="secondary"
                onClick={() => void toggleTorch()}
                disabled={!isRunning}
                aria-pressed={torchEnabled}
              >
                <Flashlight className="h-4 w-4" />
                Flash {torchEnabled ? "On" : "Off"}
              </Button>
            ) : null}
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
