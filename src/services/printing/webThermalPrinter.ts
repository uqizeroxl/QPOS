import { getThermalPaperProfile, type ThermalPaperProfileId } from "../../types/settings";
import type { SalesTransaction } from "../../types/cashier";

const PAPER_WIDTH_TO_CHARACTERS: Record<number, number> = {
  57: 32,
  58: 32,
  80: 48,
};

export type WebThermalPrinterErrorCode =
  | "UNSUPPORTED"
  | "NOT_FOUND"
  | "CONNECTION_FAILED"
  | "PRINT_FAILED"
  | "CANCELLED";

export type WebThermalPrinterKind = "usb" | "serial";

export type WebThermalPrinterInfo = {
  name: string;
  label: string;
  kind: WebThermalPrinterKind;
};

type Opens =
  | {
      kind: "usb";
      device: USBDevice;
      interfaceNumber: number;
      outEndpoint: USBEndpoint;
    }
  | {
      kind: "serial";
      port: SerialPort;
    };

export class WebThermalPrinterError extends Error {
  readonly code: WebThermalPrinterErrorCode;

  constructor(message: string, code: WebThermalPrinterErrorCode) {
    super(message);
    this.name = "WebThermalPrinterError";
    this.code = code;
  }
}

function isUsbSupported() {
  return typeof navigator !== "undefined" && "usb" in navigator;
}

function isSerialSupported() {
  return typeof navigator !== "undefined" && "serial" in navigator;
}

export function isWebThermalUsbSupported() {
  return isUsbSupported();
}

export function isWebThermalSerialSupported() {
  return isSerialSupported();
}

export function isWebThermalSupported() {
  return isUsbSupported() || isSerialSupported();
}

function getPrinterWidth(profile: string) {
  return profile.startsWith("58") || profile.startsWith("57")
    ? PAPER_WIDTH_TO_CHARACTERS[58]
    : PAPER_WIDTH_TO_CHARACTERS[80];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatReceiptDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function usbDeviceName(device: USBDevice) {
  return device.serialNumber
    ? `usb:${device.vendorId}:${device.productId}:${device.serialNumber}`
    : `usb:${device.vendorId}:${device.productId}`;
}

function usbDeviceLabel(device: USBDevice) {
  return (
    device.productName ||
    device.manufacturerName ||
    `USB Printer (${device.vendorId}:${device.productId})`
  );
}

function serialPortName(index: number) {
  return `serial:${index}`;
}

function serialPortLabel(port: SerialPort, index: number) {
  const info = port.getInfo();
  if (info.usbVendorId && info.usbProductId) {
    return `Serial Port (${info.usbVendorId}:${info.usbProductId})`;
  }
  return `Serial Port ${index + 1}`;
}

async function getUsbDevices(): Promise<USBDevice[]> {
  if (!isUsbSupported()) return [];
  return navigator.usb.getDevices();
}

async function getSerialPorts(): Promise<SerialPort[]> {
  if (!isSerialSupported()) return [];
  return navigator.serial.getPorts();
}

export async function scanWebThermalPrinters(): Promise<WebThermalPrinterInfo[]> {
  const printers: WebThermalPrinterInfo[] = [];
  const devices = await getUsbDevices();
  for (const device of devices) {
    printers.push({
      name: usbDeviceName(device),
      label: usbDeviceLabel(device),
      kind: "usb",
    });
  }
  const ports = await getSerialPorts();
  for (let index = 0; index < ports.length; index += 1) {
    printers.push({
      name: serialPortName(index),
      label: serialPortLabel(ports[index], index),
      kind: "serial",
    });
  }
  return printers;
}

export async function pairWebUsbPrinter(): Promise<WebThermalPrinterInfo> {
  if (!isUsbSupported()) {
    throw new WebThermalPrinterError(
      "WebUSB tidak didukung di browser ini. Gunakan Chrome/Edge dengan HTTPS.",
      "UNSUPPORTED",
    );
  }
  try {
    const device = await navigator.usb.requestDevice({ filters: [] });
    return {
      name: usbDeviceName(device),
      label: usbDeviceLabel(device),
      kind: "usb",
    };
  } catch (error) {
    const cancelled = error instanceof Error && error.name === "NotFoundError";
    throw new WebThermalPrinterError(
      cancelled ? "Pemilihan printer dibatalkan." : "Gagal menghubungkan printer USB.",
      cancelled ? "CANCELLED" : "CONNECTION_FAILED",
    );
  }
}

export async function pairWebSerialPrinter(): Promise<WebThermalPrinterInfo> {
  if (!isSerialSupported()) {
    throw new WebThermalPrinterError(
      "Web Serial tidak didukung di browser ini. Gunakan Chrome/Edge dengan HTTPS.",
      "UNSUPPORTED",
    );
  }
  try {
    const port = await navigator.serial.requestPort();
    const existing = await getSerialPorts();
    const index = existing.indexOf(port);
    const resolvedIndex = index >= 0 ? index : 0;
    return {
      name: serialPortName(resolvedIndex),
      label: serialPortLabel(port, resolvedIndex),
      kind: "serial",
    };
  } catch (error) {
    const cancelled = error instanceof Error && error.name === "NotFoundError";
    throw new WebThermalPrinterError(
      cancelled ? "Pemilihan port serial dibatalkan." : "Gagal menghubungkan port serial.",
      cancelled ? "CANCELLED" : "CONNECTION_FAILED",
    );
  }
}

function hasOutEndpoint(device: USBDevice) {
  const configuration = device.configuration;
  if (!configuration) return false;
  return configuration.interfaces.some((iface) =>
    iface.alternate?.endpoints?.some(
      (endpoint) => endpoint.direction === "out" && endpoint.type === "bulk",
    ),
  );
}

async function findUsbDevice(name: string): Promise<USBDevice | null> {
  const devices = await getUsbDevices();
  const exact = devices.find((device) => usbDeviceName(device) === name);
  if (exact) return exact;
  const withEndpoint = devices.find(hasOutEndpoint);
  return withEndpoint ?? devices[0] ?? null;
}

async function findSerialPort(name: string): Promise<SerialPort | null> {
  const ports = await getSerialPorts();
  const rawIndex = name.startsWith("serial:")
    ? Number(name.slice("serial:".length))
    : Number.NaN;
  const index = Number.isInteger(rawIndex) ? rawIndex : 0;
  return ports[index] ?? ports[0] ?? null;
}

async function openUsb(device: USBDevice): Promise<Opens> {
  try {
    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    const configuration = device.configuration;
    if (!configuration) {
      throw new WebThermalPrinterError(
        "Printer USB tidak memiliki konfigurasi.",
        "CONNECTION_FAILED",
      );
    }
    let open: { iface: USBInterface; endpoint: USBEndpoint } | null = null;
    for (const iface of configuration.interfaces) {
      const endpoint = iface.alternate?.endpoints.find(
        (e) => e.direction === "out" && e.type === "bulk",
      );
      if (endpoint) {
        open = { iface, endpoint };
        break;
      }
    }
    if (!open) {
      throw new WebThermalPrinterError(
        "Endpoint output printer USB tidak ditemukan.",
        "CONNECTION_FAILED",
      );
    }
    await device.claimInterface(open.iface.interfaceNumber);
    return {
      kind: "usb",
      device,
      interfaceNumber: open.iface.interfaceNumber,
      outEndpoint: open.endpoint,
    };
  } catch (error) {
    try {
      await device.close();
    } catch {
      // ignore close errors
    }
    if (error instanceof WebThermalPrinterError) throw error;
    throw new WebThermalPrinterError(
      "Koneksi ke printer USB gagal.",
      "CONNECTION_FAILED",
    );
  }
}

async function openSerial(port: SerialPort): Promise<Opens> {
  try {
    await port.open({ baudRate: 9600 });
    return { kind: "serial", port };
  } catch {
    throw new WebThermalPrinterError(
      "Koneksi ke port serial gagal.",
      "CONNECTION_FAILED",
    );
  }
}

async function openPrinter(name: string): Promise<Opens> {
  if (name.startsWith("serial:")) {
    const port = await findSerialPort(name);
    if (!port) {
      throw new WebThermalPrinterError(
        "Port serial tidak ditemukan. Pasangkan kembali melalui Pengaturan.",
        "NOT_FOUND",
      );
    }
    return openSerial(port);
  }
  const device = await findUsbDevice(name);
  if (!device) {
    throw new WebThermalPrinterError(
      "Printer USB tidak ditemukan. Pasangkan kembali melalui Pengaturan.",
      "NOT_FOUND",
    );
  }
  return openUsb(device);
}

async function writeOpens(opens: Opens, data: Uint8Array<ArrayBuffer>) {
  if (opens.kind === "serial") {
    const writer = opens.port.writable?.getWriter();
    if (!writer) {
      throw new WebThermalPrinterError(
        "Port serial tidak siap untuk menulis.",
        "CONNECTION_FAILED",
      );
    }
    try {
      await writer.write(data);
    } finally {
      writer.releaseLock();
    }
    return;
  }

  const maxPacket = opens.outEndpoint.packetSize || 512;
  for (let offset = 0; offset < data.length; offset += maxPacket) {
    await opens.device.transferOut(
      opens.outEndpoint.endpointNumber,
      data.subarray(offset, offset + maxPacket),
    );
  }
}

async function closeOpens(opens: Opens) {
  if (opens.kind === "serial") {
    try {
      await opens.port.close();
    } catch {
      // ignore close errors
    }
    return;
  }
  try {
    await opens.device.releaseInterface(opens.interfaceNumber);
  } catch {
    // ignore release errors
  }
  try {
    await opens.device.close();
  } catch {
    // ignore close errors
  }
}

export async function testWebThermalConnection(
  printerName: string,
): Promise<{ printer: string }> {
  if (!isWebThermalSupported()) {
    throw new WebThermalPrinterError(
      "WebUSB/Web Serial tidak didukung. Gunakan Chrome/Edge dengan HTTPS untuk mencetak thermal dari browser.",
      "UNSUPPORTED",
    );
  }
  const opens = await openPrinter(printerName);
  try {
    await writeOpens(opens, new Uint8Array([0x1b, 0x40]));
  } finally {
    await closeOpens(opens);
  }
  return { printer: printerName };
}

const ESC = 0x1b;

function pushText(chunks: Uint8Array[], content: string) {
  if (content.length === 0) return;
  chunks.push(new TextEncoder().encode(content));
}

function pushFeed(chunks: Uint8Array[], lines: number) {
  chunks.push(new Uint8Array(lines).fill(0x0a));
}

function pushAlign(chunks: Uint8Array[], mode: "CENTER" | "LEFT" | "RIGHT") {
  chunks.push(
    new Uint8Array([ESC, 0x61, mode === "CENTER" ? 0x01 : mode === "RIGHT" ? 0x02 : 0x00]),
  );
}

function pushBold(chunks: Uint8Array[], on: boolean) {
  chunks.push(new Uint8Array([ESC, 0x45, on ? 0x01 : 0x00]));
}

function pushRow(
  chunks: Uint8Array[],
  left: string,
  right: string,
  width: number,
  bold: boolean,
) {
  pushAlign(chunks, "LEFT");
  if (bold) pushBold(chunks, true);
  pushText(chunks, left);
  const padding = Math.max(0, width - left.length - right.length);
  if (padding > 0) pushText(chunks, " ".repeat(padding));
  pushText(chunks, right);
  pushFeed(chunks, 1);
  if (bold) pushBold(chunks, false);
}

export type WebThermalPrintOptions = {
  printerName?: string;
  storeName: string;
  address: string;
  phone: string;
  receiptFooter: string;
  paperProfile: ThermalPaperProfileId;
  autoCut: boolean;
};

export async function printReceiptWithWebThermal(
  transaction: SalesTransaction,
  options: WebThermalPrintOptions,
): Promise<void> {
  if (!isWebThermalSupported()) {
    throw new WebThermalPrinterError(
      "WebUSB/Web Serial tidak didukung. Gunakan Chrome/Edge dengan HTTPS untuk mencetak thermal dari browser.",
      "UNSUPPORTED",
    );
  }
  const selected = options.printerName?.trim();
  if (!selected) {
    throw new WebThermalPrinterError(
      "Pilih printer thermal terlebih dahulu pada Pengaturan > Sistem.",
      "NOT_FOUND",
    );
  }

  const width = getPrinterWidth(options.paperProfile);
  const chunks: Uint8Array[] = [new Uint8Array([ESC, 0x40])];

  pushAlign(chunks, "CENTER");
  pushText(chunks, options.storeName);
  pushFeed(chunks, 1);
  if (options.address) {
    pushAlign(chunks, "CENTER");
    pushText(chunks, options.address);
    pushFeed(chunks, 1);
  }
  if (options.phone) {
    pushAlign(chunks, "CENTER");
    pushText(chunks, options.phone);
    pushFeed(chunks, 1);
  }
  pushAlign(chunks, "LEFT");
  pushText(chunks, "-".repeat(width));
  pushFeed(chunks, 1);

  pushText(chunks, `No : ${transaction.transactionNumber}`);
  pushFeed(chunks, 1);
  pushText(chunks, `Tanggal : ${formatReceiptDate(transaction.createdAt)}`);
  pushFeed(chunks, 1);
  pushText(chunks, "-".repeat(width));
  pushFeed(chunks, 1);

  for (const item of transaction.items) {
    pushText(chunks, item.name);
    pushFeed(chunks, 1);
    pushText(
      chunks,
      `${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(item.subtotal)}`,
    );
    pushFeed(chunks, 1);
  }

  pushText(chunks, "-".repeat(width));
  pushFeed(chunks, 1);

  pushRow(chunks, "Subtotal", formatCurrency(transaction.subtotal), width, false);
  pushRow(
    chunks,
    `Diskon (${transaction.discountPercent}%)`,
    `-${formatCurrency(transaction.discountAmount)}`,
    width,
    false,
  );
  pushRow(chunks, "Grand Total", formatCurrency(transaction.grandTotal), width, true);
  pushRow(chunks, "Bayar", formatCurrency(transaction.paidAmount), width, false);
  pushRow(chunks, "Kembali", formatCurrency(transaction.change), width, false);

  pushText(chunks, "-".repeat(width));
  pushFeed(chunks, 1);

  pushAlign(chunks, "CENTER");
  pushText(chunks, options.receiptFooter || "Terima kasih");
  pushFeed(chunks, 1);

  if (options.autoCut) {
    chunks.push(new Uint8Array([0x1d, 0x56, 0x42, 0x00]));
  }
  pushFeed(chunks, 3);

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }

  const opens = await openPrinter(selected);
  try {
    await writeOpens(opens, output);
    if (import.meta.env.DEV) {
      console.debug(
        `[Web Thermal] Receipt printed at ${getThermalPaperProfile(options.paperProfile).widthMm}mm`,
      );
    }
  } catch (error) {
    if (error instanceof WebThermalPrinterError) throw error;
    throw new WebThermalPrinterError(
      error instanceof Error
        ? `Gagal mencetak struk: ${error.message}`
        : "Gagal mencetak struk.",
      "PRINT_FAILED",
    );
  } finally {
    await closeOpens(opens);
  }
}