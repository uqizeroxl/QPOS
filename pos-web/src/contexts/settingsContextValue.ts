import { createContext } from "react";

export type AppSettings = {
  storeName: string;
  phone: string;
  address: string;
};

export const defaultSettings: AppSettings = {
  storeName: "Toko Saya",
  phone: "",
  address: "",
};

export type SettingsContextValue = {
  settings: AppSettings;
  saveSettings: (settings: AppSettings) => void;
};

export const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);
