import {
  BarChart3,
  Barcode,
  CircleHelp,
  LayoutDashboard,
  Package,
  PackagePlus,
  ReceiptText,
  ScrollText,
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
  { label: "Label Barcode", path: ROUTES.barcodeLabels, icon: Barcode, roles: inventoryRoles },
  { label: "Kategori", path: ROUTES.category, icon: Tags, roles: inventoryRoles },
  { label: "Supplier", path: ROUTES.supplier, icon: Truck, roles: inventoryRoles },
  { label: "Restok Barang", path: ROUTES.restock, icon: PackagePlus, roles: inventoryRoles },
  { label: "Riwayat Stok", path: ROUTES.stockHistory, icon: ScrollText, roles: inventoryRoles },
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
      <div className="mb-8 flex min-h-12 items-center gap-[14px] px-2">
        <img
          src="/qpos-logo.png"
          alt="Logo QPOS"
          className="h-12 w-12 shrink-0 object-contain"
        />
        <div className="qpos-brand-type min-w-0 flex-1 overflow-hidden text-left transition-[width,opacity] duration-200 ease-out">
          <h1 className="truncate text-[26px] font-bold leading-[1] tracking-[-0.03em] text-white">
            QPOS
          </h1>
          <p className="mt-1 truncate text-[10px] font-medium leading-tight tracking-[0.045em] text-white/70">
            Retail Management
          </p>
        </div>

        {onClose ? (
          <Button
            variant="icon"
            className="border-white/15 text-white hover:bg-white/20 lg:hidden"
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
                    : "text-white hover:bg-white/20"
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
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/10 bg-gradient-to-b from-[#2F6BFF] to-[#214BCB] px-4 py-5 lg:block">
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

          <aside className="relative h-full w-72 max-w-[85vw] border-r border-white/10 bg-gradient-to-b from-[#2F6BFF] to-[#214BCB] px-4 py-5 shadow-xl">
            <SidebarContent onClose={onClose} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
