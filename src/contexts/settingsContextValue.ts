import { createContext } from "react";
import type { AppSettings } from "../types/settings";
export { defaultSettings } from "../types/settings";
export type { AppSettings } from "../types/settings";

export type SettingsContextValue = {
  settings: AppSettings;
  saveSettings: (settings: AppSettings) => void;
  setReceiptFooter: (receiptFooter: string) => void;
};

export const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);
