export const THERMAL_PAPER_WIDTHS = [58, 80] as const;
export type ThermalPaperWidth = (typeof THERMAL_PAPER_WIDTHS)[number];

export type AppSettings = {
  storeName: string;
  phone: string;
  address: string;
  receiptFooter: string;
  thermalPaperWidth: ThermalPaperWidth;
  receiptAutoCut: boolean;
};

export const defaultSettings: AppSettings = {
  storeName: "Toko Saya",
  phone: "",
  address: "",
  receiptFooter: "Terima kasih",
  thermalPaperWidth: 80,
  receiptAutoCut: true,
};
