import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  defaultSettings,
  SettingsContext,
} from "./settingsContextValue";
import type { AppSettings } from "./settingsContextValue";
import { getStoredSettings, storeSettings } from "../utils/settingsStorage";
import { settingsService } from "../services/settingsService";
import { useAuth } from "../hooks/useAuth";

type SettingsProviderProps = {
  children: ReactNode;
};

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(() =>
    getStoredSettings(defaultSettings),
  );

  const saveSettings = useCallback((nextSettings: AppSettings) => {
    const safeSettings: AppSettings = {
      storeName: nextSettings.storeName.trim() || defaultSettings.storeName,
      phone: nextSettings.phone.trim(),
      address: nextSettings.address.trim(),
      receiptFooter:
        nextSettings.receiptFooter.trim() || defaultSettings.receiptFooter,
      thermalPaperWidth: nextSettings.thermalPaperWidth,
      receiptAutoCut: nextSettings.receiptAutoCut,
    };

    setSettings(safeSettings);
    storeSettings(safeSettings);
  }, []);

  const setReceiptFooter = useCallback((receiptFooter: string) => {
    setSettings((currentSettings) => {
      const nextSettings = { ...currentSettings, receiptFooter };
      storeSettings(nextSettings);
      return nextSettings;
    });
  }, []);

  const setReceiptSettings = useCallback((receiptSettings: Parameters<typeof settingsService.updateReceiptFooter>[0]) => {
    setSettings((currentSettings) => {
      const nextSettings = { ...currentSettings, ...receiptSettings };
      storeSettings(nextSettings);
      return nextSettings;
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    void settingsService.getReceiptFooter().then((result) => {
      if (isMounted) setReceiptSettings(result);
    }).catch(() => {
      // Keep the cached/default footer while the API is unavailable.
    });

    return () => {
      isMounted = false;
    };
  }, [setReceiptSettings, user]);

  const value = useMemo(
    () => ({ settings, saveSettings, setReceiptFooter, setReceiptSettings }),
    [saveSettings, setReceiptFooter, setReceiptSettings, settings],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
