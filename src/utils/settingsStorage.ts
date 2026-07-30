import { STORAGE_KEYS } from "../constants/app";
import {
  isThermalPaperProfileId,
  migrateLegacyPaperWidth,
  type AppSettings,
} from "../types/settings";

export function getStoredSettings(fallbackSettings: AppSettings) {
  const storedSettings = localStorage.getItem(STORAGE_KEYS.settings);

  if (!storedSettings) {
    return fallbackSettings;
  }

  try {
    const stored = JSON.parse(storedSettings) as Partial<AppSettings> & {
      thermalPaperWidth?: unknown;
    };
    const settings: AppSettings = {
      ...fallbackSettings,
      ...stored,
      thermalPaperProfile: isThermalPaperProfileId(stored.thermalPaperProfile)
        ? stored.thermalPaperProfile
        : migrateLegacyPaperWidth(stored.thermalPaperWidth),
    };
    storeSettings(settings);
    return settings;
  } catch {
    localStorage.removeItem(STORAGE_KEYS.settings);
    return fallbackSettings;
  }
}

export function storeSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}
