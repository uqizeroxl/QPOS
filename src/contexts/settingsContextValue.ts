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
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<{ ok: boolean; error?: string }>;
};

export const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);
