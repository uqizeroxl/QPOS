export const THERMAL_PAPER_PROFILES = [
  { id: "57x30", widthMm: 57, rollDiameterMm: 30, label: "57 × 30 mm (EDC & Printer Bluetooth)" },
  { id: "58x30", widthMm: 58, rollDiameterMm: 30, label: "58 × 30 mm (EDC & Printer Portable)" },
  { id: "58x40", widthMm: 58, rollDiameterMm: 40, label: "58 × 40 mm (Printer Bluetooth Mini)" },
  { id: "58x50", widthMm: 58, rollDiameterMm: 50, label: "58 × 50 mm (Printer Kasir Mini)" },
  { id: "80x50", widthMm: 80, rollDiameterMm: 50, label: "80 × 50 mm (Printer Thermal Restoran)" },
  { id: "80x80", widthMm: 80, rollDiameterMm: 80, label: "80 × 80 mm (Printer Kasir Meja/Supermarket) [Default]" },
] as const;

export type ThermalPaperProfileId = (typeof THERMAL_PAPER_PROFILES)[number]["id"];
export type ThermalPaperWidth = (typeof THERMAL_PAPER_PROFILES)[number]["widthMm"];
export const DEFAULT_THERMAL_PAPER_PROFILE: ThermalPaperProfileId = "80x80";

export function isThermalPaperProfileId(value: unknown): value is ThermalPaperProfileId {
  return THERMAL_PAPER_PROFILES.some((profile) => profile.id === value);
}

export function getThermalPaperProfile(profileId: ThermalPaperProfileId) {
  return THERMAL_PAPER_PROFILES.find((profile) => profile.id === profileId)!;
}

export function migrateLegacyPaperWidth(value: unknown): ThermalPaperProfileId {
  return value === 58 ? "58x30" : DEFAULT_THERMAL_PAPER_PROFILE;
}

export const PRINTER_BACKENDS = ["BROWSER", "QZ_TRAY", "NODE_THERMAL_PRINTER"] as const;
export type PrinterBackend = (typeof PRINTER_BACKENDS)[number];

export function isPrinterBackend(value: unknown): value is PrinterBackend {
  return PRINTER_BACKENDS.includes(value as PrinterBackend);
}

export const THERMAL_PRINTER_TYPES = ["epson", "star", "tanca", "daruma", "brother", "custom"] as const;
export type ThermalPrinterType = (typeof THERMAL_PRINTER_TYPES)[number];

export function isThermalPrinterType(value: unknown): value is ThermalPrinterType {
  return THERMAL_PRINTER_TYPES.includes(value as ThermalPrinterType);
}

export type AppSettings = {
  storeName: string;
  phone: string;
  address: string;
  receiptFooter: string;
  thermalPaperProfile: ThermalPaperProfileId;
  receiptAutoCut: boolean;
  printerBackend: PrinterBackend;
  selectedPrinterName: string;
  thermalPrinterType: ThermalPrinterType;
};

export const defaultSettings: AppSettings = {
  storeName: "Toko Saya",
  phone: "",
  address: "",
  receiptFooter: "Terima kasih",
  thermalPaperProfile: DEFAULT_THERMAL_PAPER_PROFILE,
  receiptAutoCut: true,
  printerBackend: "BROWSER",
  selectedPrinterName: "",
  thermalPrinterType: "epson",
};
