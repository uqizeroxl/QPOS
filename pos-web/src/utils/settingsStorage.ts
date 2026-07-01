import { STORAGE_KEYS } from "../constants/app";
import type { AppSettings } from "../contexts/settingsContextValue";

export function getStoredSettings(fallbackSettings: AppSettings) {
  const storedSettings = localStorage.getItem(STORAGE_KEYS.settings);

  if (!storedSettings) {
    return fallbackSettings;
  }

  try {
    return {
      ...fallbackSettings,
      ...(JSON.parse(storedSettings) as Partial<AppSettings>),
    };
  } catch {
    localStorage.removeItem(STORAGE_KEYS.settings);
    return fallbackSettings;
  }
}

export function storeSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}
