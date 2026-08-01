import { createContext } from "react";
import type { AppSettings } from "../types/settings";
import type { ReceiptFooterSettings } from "../types/report";
export { defaultSettings } from "../types/settings";
export type { AppSettings } from "../types/settings";

export type SettingsContextValue = {
  settings: AppSettings;
  saveSettings: (settings: AppSettings) => Promise<void>;
  setReceiptFooter: (receiptFooter: string) => void;
  setReceiptSettings: (settings: ReceiptFooterSettings) => void;
};

export const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);
