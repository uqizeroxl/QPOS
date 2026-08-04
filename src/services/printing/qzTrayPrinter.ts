import * as qz from "qz-tray";
import { getThermalPaperProfile, type ThermalPaperProfileId } from "../../types/settings";

export class QzTrayPrinterError extends Error {
  readonly code: "NOT_INSTALLED" | "CONNECTION_FAILED" | "PRINTER_NOT_FOUND" | "PRINT_FAILED";

  constructor(
    message: string,
    code: "NOT_INSTALLED" | "CONNECTION_FAILED" | "PRINTER_NOT_FOUND" | "PRINT_FAILED",
  ) {
    super(message);
    this.name = "QzTrayPrinterError";
    this.code = code;
  }
}

function connectionError(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error ?? "");
  if (/websocket|connection|connect|refused|closed|qz tray/i.test(detail)) {
    return new QzTrayPrinterError(
      "QZ Tray tidak terpasang atau tidak sedang berjalan. Instal dan jalankan QZ Tray, lalu coba lagi.",
      "NOT_INSTALLED",
    );
  }
  return new QzTrayPrinterError("Koneksi ke QZ Tray gagal.", "CONNECTION_FAILED");
}

async function connect() {
  if (qz.websocket.isActive()) return;
  try {
    await qz.websocket.connect({ retries: 1, delay: 0 });
  } catch (error) {
    throw connectionError(error);
  }
}

async function disconnect() {
  if (!qz.websocket.isActive()) return;
  try {
    await qz.websocket.disconnect();
  } catch {
    // The local QZ process may already be closed; cleanup must not mask print errors.
  }
}

async function findPrinter() {
  const found = await qz.printers.find();
  const printers = Array.isArray(found) ? found : found ? [found] : [];
  if (printers.length === 0) {
    throw new QzTrayPrinterError("Printer tidak ditemukan oleh QZ Tray.", "PRINTER_NOT_FOUND");
  }

  const defaultPrinter = await qz.printers.getDefault().catch(() => "");
  return defaultPrinter && printers.includes(defaultPrinter) ? defaultPrinter : printers[0];
}

function applicationCss() {
  return Array.from(document.styleSheets).map((sheet) => {
    try {
      return Array.from(sheet.cssRules).map((rule) => rule.cssText).join("\n");
    } catch {
      return "";
    }
  }).join("\n");
}

function receiptHtml(receiptElement: HTMLElement, widthMm: number) {
  const clone = receiptElement.cloneNode(true) as HTMLElement;
  return `<!doctype html><html style="--receipt-paper-width:${widthMm}mm"><head><meta charset="utf-8"><style>${applicationCss()}</style></head><body class="receipt-printing" style="--receipt-paper-width:${widthMm}mm">${clone.outerHTML}</body></html>`;
}

export async function testQzTrayConnection() {
  try {
    await connect();
    const version = await qz.api.getVersion();
    const found = await qz.printers.find();
    const printers = Array.isArray(found) ? found : found ? [found] : [];
    return { version, printers };
  } catch (error) {
    if (error instanceof QzTrayPrinterError) throw error;
    throw connectionError(error);
  } finally {
    await disconnect();
  }
}

export async function printReceiptWithQzTray(
  receiptElement: HTMLElement,
  paperProfile: ThermalPaperProfileId,
) {
  try {
    await connect();
    const printer = await findPrinter();
    const widthMm = getThermalPaperProfile(paperProfile).widthMm;
    const config = qz.configs.create(printer, {
      jobName: "QPOS Receipt",
      units: "mm",
      size: { width: widthMm },
      margins: 0,
      scaleContent: true,
    });
    await qz.print(config, [{ type: "pixel", format: "html", flavor: "plain", data: receiptHtml(receiptElement, widthMm) }]);
    return printer;
  } catch (error) {
    if (error instanceof QzTrayPrinterError) throw error;
    if (!qz.websocket.isActive()) throw connectionError(error);
    throw new QzTrayPrinterError(
      error instanceof Error ? `Gagal mencetak melalui QZ Tray: ${error.message}` : "Gagal mencetak melalui QZ Tray.",
      "PRINT_FAILED",
    );
  } finally {
    await disconnect();
  }
}
