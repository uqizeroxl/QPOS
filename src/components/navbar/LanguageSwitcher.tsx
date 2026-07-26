import { Check, Globe2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AppLanguage } from "../../i18n";
import { languageStorageKey } from "../../i18n";
import Button from "../ui/Button";

const languages: Array<{ code: AppLanguage; flag: string; labelKey: string }> = [
  { code: "id", flag: "🇮🇩", labelKey: "language.indonesian" },
  { code: "en", flag: "🇺🇸", labelKey: "language.english" },
];

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const activeLanguage: AppLanguage = i18n.resolvedLanguage === "en" ? "en" : "id";

  useEffect(() => {
    const closeDropdown = (event: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeDropdown);
    return () => document.removeEventListener("pointerdown", closeDropdown);
  }, []);

  useEffect(() => {
    document.documentElement.lang = activeLanguage;
  }, [activeLanguage]);

  const changeLanguage = async (language: AppLanguage) => {
    await i18n.changeLanguage(language);
    localStorage.setItem(languageStorageKey, language);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Button
        variant="unstyled"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label={t("language.label")}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Globe2 className="h-5 w-5" />
      </Button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800" role="menu">
          {languages.map((language) => (
            <button
              key={language.code}
              type="button"
              role="menuitemradio"
              aria-checked={activeLanguage === language.code}
              onClick={() => void changeLanguage(language.code)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <span className="text-lg" aria-hidden="true">{language.flag}</span>
              <span className="flex-1">{t(language.labelKey)}</span>
              {activeLanguage === language.code ? <Check className="h-4 w-4 text-blue-600" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
