import { LogOut, Menu, Moon, Sun, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "../ui/Button";
import NotificationBell from "../navbar/NotificationBell";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import { useSettings } from "../../hooks/useSettings";
import { useTheme } from "../../hooks/useTheme";
import LanguageSwitcher from "../navbar/LanguageSwitcher";
import StoreSwitcher from "../navbar/StoreSwitcher";
import ConnectionStatus from "../navbar/ConnectionStatus";

type NavbarProps = {
  onMenuClick: () => void;
};

const pageTitleKeys: Record<string, string> = {
  [ROUTES.dashboard]: "navbar.pages.dashboard",
  [ROUTES.product]: "navbar.pages.product",
  [ROUTES.barcodeLabels]: "navbar.pages.barcodeLabels",
  [ROUTES.category]: "navbar.pages.category",
  [ROUTES.supplier]: "navbar.pages.supplier",
  [ROUTES.cashier]: "navbar.pages.cashier",
  [ROUTES.transactions]: "navbar.pages.transactions",
  [ROUTES.transactionHistory]: "navbar.pages.transactions",
  [ROUTES.report]: "navbar.pages.report",
  [ROUTES.setting]: "navbar.pages.setting",
  [ROUTES.helpShortcut]: "navbar.pages.help",
  [ROUTES.notifications]: "navbar.pages.notifications",
};

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { logout, user } = useAuth();
  const { settings } = useSettings();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitleKey = pageTitleKeys[location.pathname];
  const pageTitle = pageTitleKey ? t(pageTitleKey) : settings.storeName;

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="unstyled"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            aria-label={t("navbar.openMenu")}
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-slate-100">
              {pageTitle}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="unstyled"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={
              resolvedTheme === "dark"
                ? t("navbar.enableLight")
                : t("navbar.enableDark")
            }
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <LanguageSwitcher />

          <ConnectionStatus />

          <NotificationBell />

          <StoreSwitcher />

          <button
            type="button"
            onClick={() => navigate(ROUTES.userSettings)}
            className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 transition-colors duration-300 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800 sm:flex"
          >
            <UserRound className="h-4 w-4 text-gray-500 dark:text-slate-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
              {user?.name ?? t("navbar.userFallback")} · {user?.role ?? "-"}
            </span>
          </button>

          <Button
            variant="unstyled"
            onClick={handleLogout}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t("navbar.logout")}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
