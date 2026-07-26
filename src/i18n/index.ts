import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import id from "./locales/id.json";
import en from "./locales/en.json";

export const languageStorageKey = "qpos-language";
export type AppLanguage = "id" | "en";

const storedLanguage = localStorage.getItem(languageStorageKey);
const initialLanguage: AppLanguage = storedLanguage === "en" ? "en" : "id";
document.documentElement.lang = initialLanguage;

void i18n.use(initReactI18next).init({
  resources: {
    id: { translation: id },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: "id",
  supportedLngs: ["id", "en"],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
