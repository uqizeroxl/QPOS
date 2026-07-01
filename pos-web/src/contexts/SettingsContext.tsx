import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  defaultSettings,
  SettingsContext,
} from "./settingsContextValue";
import type { AppSettings } from "./settingsContextValue";
import { getStoredSettings, storeSettings } from "../utils/settingsStorage";

type SettingsProviderProps = {
  children: ReactNode;
};

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(() =>
    getStoredSettings(defaultSettings),
  );

  const saveSettings = useCallback((nextSettings: AppSettings) => {
    const safeSettings: AppSettings = {
      storeName: nextSettings.storeName.trim() || defaultSettings.storeName,
      phone: nextSettings.phone.trim(),
      address: nextSettings.address.trim(),
    };

    setSettings(safeSettings);
    storeSettings(safeSettings);
  }, []);

  const value = useMemo(
    () => ({ settings, saveSettings }),
    [saveSettings, settings],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
