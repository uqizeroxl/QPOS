import {
  BarChart3,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import Button from "../ui/Button";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../hooks/useAuth";
import type { UserRole } from "../../services/authService";

type SidebarMenuItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: UserRole[];
};

const allRoles: UserRole[] = ["OWNER", "ADMIN", "CASHIER", "WAREHOUSE"];
const ownerAdminRoles: UserRole[] = ["OWNER", "ADMIN"];
const inventoryRoles: UserRole[] = ["OWNER", "ADMIN", "WAREHOUSE"];
const salesRoles: UserRole[] = ["OWNER", "ADMIN", "CASHIER"];

const menuItems: SidebarMenuItem[] = [
  { label: "Dashboard", path: ROUTES.dashboard, icon: LayoutDashboard, roles: allRoles },
  { label: "Produk", path: ROUTES.product, icon: Package, roles: inventoryRoles },
  { label: "Kategori", path: ROUTES.category, icon: Tags, roles: inventoryRoles },
  { label: "Supplier", path: ROUTES.supplier, icon: Truck, roles: inventoryRoles },
  {
    label: "Purchase Order",
    path: ROUTES.purchaseOrder,
    icon: ClipboardList,
    roles: inventoryRoles,
  },
  { label: "Kasir", path: ROUTES.cashier, icon: ShoppingCart, roles: salesRoles },
  {
    label: "Riwayat Transaksi",
    path: ROUTES.transactions,
    icon: ReceiptText,
    roles: salesRoles,
  },
  { label: "Laporan", path: ROUTES.report, icon: BarChart3, roles: ownerAdminRoles },
  { label: "Pengaturan", path: ROUTES.setting, icon: Settings, roles: ownerAdminRoles },
  { label: "Bantuan & Shortcut", path: ROUTES.helpShortcut, icon: CircleHelp, roles: allRoles },
];

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

function SidebarContent({ onClose }: Pick<SidebarProps, "onClose">) {
  const { user } = useAuth();
  const visibleMenuItems = menuItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <>
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-lg font-extrabold tracking-wide text-white shadow-sm transition duration-200">
          Q
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-2xl font-extrabold tracking-wide text-transparent transition duration-200 dark:from-blue-300 dark:to-cyan-300">
            QPOS
          </h1>
          <p className="text-xs font-medium text-blue-100 dark:text-slate-400">
            Retail Management
          </p>
        </div>

        {onClose ? (
          <Button
            variant="icon"
            className="lg:hidden"
            aria-label="Tutup menu"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        ) : null}
      </div>

      <nav className="space-y-1">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-blue-100 hover:bg-white/10 hover:text-white dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-blue-700 bg-blue-700 px-4 py-5 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950 lg:block">
        <SidebarContent />
      </aside>

      {isOpen ? (
        <div className="fixed inset-0 z-30 lg:hidden">
          <Button
            variant="unstyled"
            className="absolute inset-0 h-full w-full bg-gray-900/40"
            aria-label="Tutup menu"
            onClick={onClose}
          />

          <aside className="relative h-full w-72 max-w-[85vw] border-r border-blue-700 bg-blue-700 px-4 py-5 shadow-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950">
            <SidebarContent onClose={onClose} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
