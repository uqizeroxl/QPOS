import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { STORAGE_KEYS } from "../constants/app";
import {
  defaultSettings,
  SettingsContext,
} from "./settingsContextValue";
import type { AppSettings } from "./settingsContextValue";

type SettingsProviderProps = {
  children: ReactNode;
};

function getStoredSettings(): AppSettings {
  try {
    const value = localStorage.getItem(STORAGE_KEYS.settings);
    return value ? { ...defaultSettings, ...(JSON.parse(value) as AppSettings) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setSettings(getStoredSettings());
    setIsLoading(false);
  }, []);

  const saveSettings = useCallback(
    async (nextSettings: AppSettings) => {
      try {
        const safeSettings: AppSettings = {
          storeName: nextSettings.storeName.trim() || defaultSettings.storeName,
          phone: nextSettings.phone.trim(),
          address: nextSettings.address.trim(),
        };
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(safeSettings));
        setSettings(safeSettings);
        return { ok: true as const };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal menyimpan pengaturan";
        return { ok: false as const, error: message };
      }
    },
    [],
  );

  const value = useMemo(
    () => ({ settings, isLoading, fetchSettings, saveSettings }),
    [settings, isLoading, fetchSettings, saveSettings],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
