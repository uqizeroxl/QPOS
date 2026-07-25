import { createContext } from "react";

export type AppSettings = {
  storeName: string;
  phone: string;
  address: string;
  receiptFooter: string;
};

export const defaultSettings: AppSettings = {
  storeName: "Toko Saya",
  phone: "",
  address: "",
  receiptFooter: "Terima kasih",
};

export type SettingsContextValue = {
  settings: AppSettings;
  saveSettings: (settings: AppSettings) => void;
  setReceiptFooter: (receiptFooter: string) => void;
};

export const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);
