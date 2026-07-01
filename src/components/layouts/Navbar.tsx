import { LogOut, Menu, Moon, Sun, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import NotificationBell from "../navbar/NotificationBell";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import { useSettings } from "../../hooks/useSettings";
import { useTheme } from "../../hooks/useTheme";

type NavbarProps = {
  onMenuClick: () => void;
};

const pageTitles: Record<string, string> = {
  [ROUTES.dashboard]: "Dashboard",
  [ROUTES.product]: "Produk",
  [ROUTES.category]: "Kategori",
  [ROUTES.supplier]: "Supplier",
  [ROUTES.cashier]: "Kasir",
  [ROUTES.transactionHistory]: "Riwayat Transaksi",
  [ROUTES.report]: "Laporan",
  [ROUTES.setting]: "Pengaturan",
  [ROUTES.helpShortcut]: "Bantuan & Shortcut",
  [ROUTES.notifications]: "Notifikasi",
};

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { logout } = useAuth();
  const { settings } = useSettings();
  const { resolvedTheme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = pageTitles[location.pathname] ?? settings.storeName;

  const handleLogout = () => {
    logout();
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="unstyled"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Buka menu"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="min-w-0">
            <p className="truncate text-sm text-gray-500 dark:text-slate-400">
              {settings.storeName}
            </p>
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
                ? "Aktifkan light mode"
                : "Aktifkan dark mode"
            }
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <NotificationBell />

          <div className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 transition-colors duration-300 dark:border-slate-700 sm:flex">
            <UserRound className="h-4 w-4 text-gray-500 dark:text-slate-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Manager</span>
          </div>

          <Button
            variant="unstyled"
            onClick={handleLogout}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
