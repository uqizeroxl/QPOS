import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  defaultSettings,
  SettingsContext,
} from "./settingsContextValue";
import type { AppSettings } from "./settingsContextValue";
import { settingsService } from "../services/settingsService";
import { useAuth } from "../hooks/useAuth";
import { cacheService } from "../services/storage/cache.service";

const SETTINGS_CACHE_KEY = "/settings";

type SettingsProviderProps = {
  children: ReactNode;
};

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  const saveSettings = useCallback(async (nextSettings: AppSettings) => {
    const safeSettings: AppSettings = {
      storeName: nextSettings.storeName.trim() || defaultSettings.storeName,
      phone: nextSettings.phone.trim(),
      address: nextSettings.address.trim(),
      receiptFooter:
        nextSettings.receiptFooter.trim() || defaultSettings.receiptFooter,
      thermalPaperProfile: nextSettings.thermalPaperProfile,
      receiptAutoCut: nextSettings.receiptAutoCut,
      printerBackend: nextSettings.printerBackend,
      selectedPrinterName: nextSettings.selectedPrinterName.trim(),
    };

    setSettings(safeSettings);
    await cacheService.set(SETTINGS_CACHE_KEY, safeSettings);
    const stored = await settingsService.updateSettings(safeSettings);
    setSettings(stored);
    await cacheService.set(SETTINGS_CACHE_KEY, stored);
  }, []);

  const setReceiptFooter = useCallback((receiptFooter: string) => {
    setSettings((currentSettings) => {
      const nextSettings = { ...currentSettings, receiptFooter };
      return nextSettings;
    });
  }, []);

  const setReceiptSettings = useCallback((receiptSettings: Parameters<typeof settingsService.updateReceiptFooter>[0]) => {
    setSettings((currentSettings) => {
      const nextSettings = { ...currentSettings, ...receiptSettings };
      return nextSettings;
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    void settingsService.getSettings().then((result) => {
      if (!isMounted) return;
      setSettings(result);
      setIsLoaded(true);
    }).catch(async () => {
      const cached = await cacheService.get<AppSettings>(SETTINGS_CACHE_KEY);
      if (isMounted && cached) {
        setSettings(cached);
      }
      if (isMounted) setIsLoaded(true);
    });

    return () => {
      isMounted = false;
    };
  }, [setReceiptSettings, user]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    void cacheService.set(SETTINGS_CACHE_KEY, settings);
  }, [isLoaded, settings, user]);

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
