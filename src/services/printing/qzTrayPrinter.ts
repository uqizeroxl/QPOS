import * as qz from "qz-tray";
import { getThermalPaperProfile, type ThermalPaperProfileId } from "../../types/settings";

const DEFAULT_TIMEOUT_MS = 5_000;
const CONNECTION_IDLE_MS = 2 * 60_000;

type QzErrorCode =
  | "NOT_INSTALLED"
  | "CONNECTION_FAILED"
  | "PRINTER_NOT_FOUND"
  | "PRINT_FAILED"
  | "TIMEOUT";

type PrinterCache = {
  printers: string[];
  defaultPrinter: string;
};

export type QzPrintOptions = {
  printerName?: string;
  timeoutMs?: number;
};

export class QzTrayPrinterError extends Error {
  readonly code: QzErrorCode;

  constructor(message: string, code: QzErrorCode) {
    super(message);
    this.name = "QzTrayPrinterError";
    this.code = code;
  }
}

let connectPromise: Promise<void> | null = null;
let idleTimer: ReturnType<typeof window.setTimeout> | null = null;
let printerCache: PrinterCache | null = null;
let receiptCssCache: string | null = null;

function debug(message: string, detail?: unknown) {
  if (import.meta.env.DEV) {
    console.debug(`[QZ Tray] ${message}`, detail ?? "");
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new QzTrayPrinterError(
        `${operation} melewati batas waktu ${timeoutMs / 1_000} detik.`,
        "TIMEOUT",
      ));
    }, timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function connectionError(error: unknown) {
  if (error instanceof QzTrayPrinterError) return error;
  const detail = error instanceof Error ? error.message : String(error ?? "");
  if (/websocket|connection|connect|refused|closed|qz tray/i.test(detail)) {
    return new QzTrayPrinterError(
      "QZ Tray tidak terpasang atau tidak sedang berjalan. Instal dan jalankan QZ Tray, lalu coba lagi.",
      "NOT_INSTALLED",
    );
  }
  return new QzTrayPrinterError("Koneksi ke QZ Tray gagal.", "CONNECTION_FAILED");
}

function clearIdleTimer() {
  if (idleTimer !== null) {
    window.clearTimeout(idleTimer);
    idleTimer = null;
  }
}

async function disconnect() {
  clearIdleTimer();
  connectPromise = null;
  if (!qz.websocket.isActive()) return;
  try {
    await qz.websocket.disconnect();
    debug("Disconnected");
  } catch (error) {
    debug("Disconnect cleanup failed", error);
  }
}

function scheduleIdleDisconnect() {
  clearIdleTimer();
  idleTimer = window.setTimeout(() => {
    void disconnect();
  }, CONNECTION_IDLE_MS);
}

async function connect(timeoutMs = DEFAULT_TIMEOUT_MS) {
  clearIdleTimer();
  if (qz.websocket.isActive()) return;
  if (!connectPromise) {
    const pendingConnection = withTimeout(
      qz.websocket.connect({ retries: 1, delay: 0 }),
      timeoutMs,
      "Koneksi QZ Tray",
    ).then(() => {
      debug("Connected");
    }).catch((error: unknown) => {
      throw connectionError(error);
    });
    connectPromise = pendingConnection;
    void pendingConnection.finally(() => {
      if (connectPromise === pendingConnection) connectPromise = null;
    }).catch(() => undefined);
  }
  await connectPromise;
}

function normalizePrinters(found: string[] | string) {
  return Array.isArray(found) ? found : found ? [found] : [];
}

export async function refreshPrinters(timeoutMs = DEFAULT_TIMEOUT_MS) {
  await connect(timeoutMs);
  try {
    const [found, defaultPrinter] = await withTimeout(
      Promise.all([
        qz.printers.find(),
        qz.printers.getDefault().catch(() => ""),
      ]),
      timeoutMs,
      "Pencarian printer QZ Tray",
    );
    printerCache = { printers: normalizePrinters(found), defaultPrinter };
    debug("Printer cache refreshed", printerCache);
    return [...printerCache.printers];
  } finally {
    scheduleIdleDisconnect();
  }
}

async function getPrinterCache(timeoutMs: number) {
  if (!printerCache) await refreshPrinters(timeoutMs);
  return printerCache!;
}

async function selectPrinter(selectedPrinter: string | undefined, timeoutMs: number) {
  const cache = await getPrinterCache(timeoutMs);
  if (cache.printers.length === 0) {
    throw new QzTrayPrinterError("Printer tidak ditemukan oleh QZ Tray.", "PRINTER_NOT_FOUND");
  }
  if (selectedPrinter && cache.printers.includes(selectedPrinter)) return selectedPrinter;
  if (cache.defaultPrinter && cache.printers.includes(cache.defaultPrinter)) return cache.defaultPrinter;
  return cache.printers[0];
}

function receiptCss() {
  if (receiptCssCache !== null) return receiptCssCache;
  receiptCssCache = Array.from(document.styleSheets).map((sheet) => {
    try {
      return Array.from(sheet.cssRules).map((rule) => rule.cssText).join("\n");
    } catch {
      return "";
    }
  }).join("\n");
  debug("Receipt CSS cached");
  return receiptCssCache;
}

function receiptHtml(receiptElement: HTMLElement, widthMm: number) {
  const clone = receiptElement.cloneNode(true) as HTMLElement;
  return `<!doctype html><html style="--receipt-paper-width:${widthMm}mm"><head><meta charset="utf-8"><style>${receiptCss()}</style></head><body class="receipt-printing" style="--receipt-paper-width:${widthMm}mm">${clone.outerHTML}</body></html>`;
}

function isConnectionLoss(error: unknown) {
  if (error instanceof QzTrayPrinterError) {
    return error.code === "CONNECTION_FAILED";
  }
  if (!qz.websocket.isActive()) return true;
  const detail = error instanceof Error ? error.message : String(error ?? "");
  return /websocket|connection|connect|closed|not active|socket/i.test(detail);
}

async function printAttempt(
  receiptElement: HTMLElement,
  paperProfile: ThermalPaperProfileId,
  options: QzPrintOptions,
) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  await connect(timeoutMs);
  const printer = await selectPrinter(options.printerName, timeoutMs);
  const widthMm = getThermalPaperProfile(paperProfile).widthMm;
  const config = qz.configs.create(printer, {
    jobName: "QPOS Receipt",
    units: "mm",
    size: { width: widthMm },
    margins: 0,
    scaleContent: true,
  });
  await withTimeout(
    qz.print(config, [{
      type: "pixel",
      format: "html",
      flavor: "plain",
      data: receiptHtml(receiptElement, widthMm),
    }]),
    timeoutMs,
    "Pencetakan QZ Tray",
  );
  debug("Print completed", { printer });
  return printer;
}

export async function testQzTrayConnection(timeoutMs = DEFAULT_TIMEOUT_MS) {
  await connect(timeoutMs);
  try {
    const version = await withTimeout(qz.api.getVersion(), timeoutMs, "Pemeriksaan versi QZ Tray");
    const printers = await refreshPrinters(timeoutMs);
    return { version, printers };
  } catch (error) {
    if (error instanceof QzTrayPrinterError) throw error;
    throw connectionError(error);
  } finally {
    scheduleIdleDisconnect();
  }
}

export async function printReceiptWithQzTray(
  receiptElement: HTMLElement,
  paperProfile: ThermalPaperProfileId,
  options: QzPrintOptions = {},
) {
  try {
    return await printAttempt(receiptElement, paperProfile, options);
  } catch (firstError) {
    if (firstError instanceof QzTrayPrinterError && firstError.code === "PRINTER_NOT_FOUND") {
      throw firstError;
    }
    if (!isConnectionLoss(firstError)) {
      if (firstError instanceof QzTrayPrinterError) throw firstError;
      throw new QzTrayPrinterError(
        firstError instanceof Error ? `Gagal mencetak melalui QZ Tray: ${firstError.message}` : "Gagal mencetak melalui QZ Tray.",
        "PRINT_FAILED",
      );
    }

    debug("Connection lost during print, retrying once", firstError);
    await disconnect();
    try {
      return await printAttempt(receiptElement, paperProfile, options);
    } catch (retryError) {
      if (retryError instanceof QzTrayPrinterError) throw retryError;
      throw connectionError(retryError);
    }
  } finally {
    scheduleIdleDisconnect();
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => { void disconnect(); });
  window.addEventListener("beforeunload", () => { void disconnect(); });
}
