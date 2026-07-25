import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType, NotFoundException } from "@zxing/library";

export type ScannerStatus =
  | "opening"
  | "focusing"
  | "scanning"
  | "detected";

type NativeBarcode = {
  rawValue: string;
  format: string;
};

type NativeBarcodeDetector = {
  detect: (source: CanvasImageSource) => Promise<NativeBarcode[]>;
};

type NativeBarcodeDetectorConstructor = {
  new (options: { formats: string[] }): NativeBarcodeDetector;
  getSupportedFormats?: () => Promise<string[]>;
};

type ScannerCallbacks = {
  onDetected: (barcode: string) => void;
  onError: (message: string) => void;
  onStatusChange: (status: ScannerStatus) => void;
};

const nativeFormats = [
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

const decodeIntervalMs = 120;
const duplicateCooldownMs = 1_500;

class BarcodeScannerService {
  private stream: MediaStream | null = null;
  private timer: number | null = null;
  private sessionId = 0;
  private lastResult = { value: "", timestamp: 0 };
  private readonly canvas = document.createElement("canvas");
  private readonly zxingReader: BrowserMultiFormatReader;

  constructor() {
    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, zxingFormats);
    hints.set(DecodeHintType.TRY_HARDER, true);
    this.zxingReader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: decodeIntervalMs,
      delayBetweenScanSuccess: duplicateCooldownMs,
    });
  }

  async start(video: HTMLVideoElement, callbacks: ScannerCallbacks) {
    this.stop();
    const currentSession = ++this.sessionId;
    callbacks.onStatusChange("opening");

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30 },
        },
      });

      if (currentSession !== this.sessionId) {
        this.stopStream(this.stream);
        return;
      }

      video.srcObject = this.stream;
      video.setAttribute("playsinline", "true");
      await video.play();
      callbacks.onStatusChange("focusing");
      await this.applyCameraEnhancements(this.stream.getVideoTracks()[0]);

      window.setTimeout(() => {
        if (currentSession === this.sessionId) {
          callbacks.onStatusChange("scanning");
        }
      }, 500);

      const detector = await this.createNativeDetector();
      this.scheduleDecode(video, callbacks, currentSession, detector);
    } catch (error) {
      this.stop();
      callbacks.onError(this.getCameraErrorMessage(error));
    }
  }

  stop() {
    this.sessionId += 1;
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    this.stopStream(this.stream);
    this.stream = null;
  }

  async playSuccessFeedback() {
    try {
      const AudioContextClass = window.AudioContext;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 1_040;
      gain.gain.setValueAtTime(0.12, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.12);
      oscillator.addEventListener("ended", () => void context.close());
    } catch {
      // Audio feedback is optional and may be blocked by browser policy.
    }

    navigator.vibrate?.(80);
  }

  private scheduleDecode(
    video: HTMLVideoElement,
    callbacks: ScannerCallbacks,
    sessionId: number,
    detector: NativeBarcodeDetector | null,
  ) {
    const decode = async () => {
      if (sessionId !== this.sessionId) {
        return;
      }

      try {
        const frame = this.captureRoi(video);
        const result = detector
          ? (await detector.detect(frame))[0]?.rawValue
          : this.zxingReader.decodeFromCanvas(frame).getText();

        if (result && !this.isDuplicate(result)) {
          this.lastResult = { value: result, timestamp: Date.now() };
          callbacks.onStatusChange("detected");
          callbacks.onDetected(result);
          return;
        }
      } catch (error) {
        if (!(error instanceof NotFoundException)) {
          console.debug("Barcode decode skipped", error);
        }
      }

      this.timer = window.setTimeout(decode, decodeIntervalMs);
    };

    void decode();
  }

  private captureRoi(video: HTMLVideoElement) {
    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    const roiWidth = Math.round(sourceWidth * 0.82);
    const roiHeight = Math.round(sourceHeight * 0.38);
    const sourceX = Math.round((sourceWidth - roiWidth) / 2);
    const sourceY = Math.round((sourceHeight - roiHeight) / 2);
    this.canvas.width = roiWidth;
    this.canvas.height = roiHeight;
    this.canvas
      .getContext("2d", { willReadFrequently: true })
      ?.drawImage(
        video,
        sourceX,
        sourceY,
        roiWidth,
        roiHeight,
        0,
        0,
        roiWidth,
        roiHeight,
      );
    return this.canvas;
  }

  private async createNativeDetector() {
    const Detector = (
      window as typeof window & { BarcodeDetector?: NativeBarcodeDetectorConstructor }
    ).BarcodeDetector;

    if (!Detector) {
      return null;
    }

    const supported = Detector.getSupportedFormats
      ? await Detector.getSupportedFormats()
      : nativeFormats;
    const formats = nativeFormats.filter((format) => supported.includes(format));
    return formats.length > 0 ? new Detector({ formats }) : null;
  }

  private async applyCameraEnhancements(track: MediaStreamTrack) {
    const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & {
      focusMode?: string[];
      exposureMode?: string[];
      whiteBalanceMode?: string[];
    };
    const advanced: Record<string, string>[] = [];

    if (capabilities.focusMode?.includes("continuous")) {
      advanced.push({ focusMode: "continuous" });
    }
    if (capabilities.exposureMode?.includes("continuous")) {
      advanced.push({ exposureMode: "continuous" });
    }
    if (capabilities.whiteBalanceMode?.includes("continuous")) {
      advanced.push({ whiteBalanceMode: "continuous" });
    }

    if (advanced.length > 0) {
      await track.applyConstraints({ advanced } as MediaTrackConstraints);
    }
  }

  private isDuplicate(value: string) {
    return (
      value === this.lastResult.value &&
      Date.now() - this.lastResult.timestamp < duplicateCooldownMs
    );
  }

  private stopStream(stream: MediaStream | null) {
    stream?.getTracks().forEach((track) => track.stop());
  }

  private getCameraErrorMessage(error: unknown) {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      return "Izin kamera ditolak. Aktifkan izin kamera pada browser.";
    }
    if (error instanceof DOMException && error.name === "NotFoundError") {
      return "Kamera tidak ditemukan pada perangkat ini.";
    }
    return "Kamera tidak dapat dibuka. Pastikan kamera tidak digunakan aplikasi lain.";
  }
}

export const barcodeScannerService = new BarcodeScannerService();
