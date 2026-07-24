import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { STORAGE_KEYS } from "../constants/app";
import { apiService } from "../services/api/apiService";
import {
  defaultSettings,
  SettingsContext,
} from "./settingsContextValue";
import type { AppSettings } from "./settingsContextValue";

type SettingsProviderProps = {
  children: ReactNode;
};

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem(STORAGE_KEYS.authToken)));

  const fetchSettings = useCallback(async () => {
    try {
      const response = await apiService.get<AppSettings>("/settings");
      setSettings({
        storeName: response.data.storeName || defaultSettings.storeName,
        phone: response.data.phone || "",
        address: response.data.address || "",
      });
    } catch {
      // keep previous state on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEYS.authToken)) {
      return;
    }

    let cancelled = false;

    const load = () => {
      void apiService.get<AppSettings>("/settings").then((response) => {
        if (!cancelled) {
          setSettings({
            storeName: response.data.storeName || defaultSettings.storeName,
            phone: response.data.phone || "",
            address: response.data.address || "",
          });
        }
      }).catch(() => {}).finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    };

    load();

    const onLogin = () => { setIsLoading(true); load(); };
    window.addEventListener("auth:login", onLogin);

    return () => { cancelled = true; window.removeEventListener("auth:login", onLogin); };
  }, []);

  const saveSettings = useCallback(
    async (nextSettings: AppSettings) => {
      try {
        const safeSettings: AppSettings = {
          storeName: nextSettings.storeName.trim() || defaultSettings.storeName,
          phone: nextSettings.phone.trim(),
          address: nextSettings.address.trim(),
        };
        await apiService.put("/settings", safeSettings);
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
