import {
  AlertTriangle,
  Bell,
  Boxes,
  DollarSign,
  Package,
  Tags,
  Truck,
} from "lucide-react";
import { useMemo } from "react";
import ActivityPanel from "../../components/ui/ActivityPanel";
import Card from "../../components/ui/Card";
import StatCard from "../../components/ui/StatCard";
import StockAlertPanel from "../../components/ui/StockAlertPanel";
import { useActivityLog } from "../../hooks/useActivityLog";
import { useCategories } from "../../hooks/useCategories";
import { useNotification } from "../../hooks/useNotification";
import { useProducts } from "../../hooks/useProducts";
import { useSettings } from "../../hooks/useSettings";
import { useSuppliers } from "../../hooks/useSuppliers";
import MainLayout from "../../layouts/MainLayout";
import { formatRupiah } from "../../utils/currency";

const minimumStock = 5;

export default function DashboardPage() {
  const { products } = useProducts();
  const { categories } = useCategories();
  const { suppliers } = useSuppliers();
  const { activities } = useActivityLog();
  const { notifications } = useNotification();
  const { settings } = useSettings();

  const dashboardData = useMemo(() => {
    const totalStock = products.reduce(
      (currentTotal, product) => currentTotal + product.stock,
      0,
    );
    const totalInventoryValue = products.reduce(
      (currentTotal, product) =>
        currentTotal + product.purchasePrice * product.stock,
      0,
    );
    const lowStockItems = products
      .filter((product) => product.stock <= minimumStock)
      .map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        stock: product.stock,
        minStock: minimumStock,
      }));
    const unreadNotificationCount = notifications.filter(
      (notification) => !notification.isRead,
    ).length;

    return {
      totalInventoryValue,
      totalStock,
      lowStockItems,
      unreadNotificationCount,
    };
  }, [notifications, products]);

  const stats = [
    {
      title: "Total Produk",
      value: products.length.toString(),
      description: `${dashboardData.totalStock} stok tersedia`,
      icon: Package,
      tone: "blue" as const,
    },
    {
      title: "Total Kategori",
      value: categories.length.toString(),
      description: "Kelompok produk terdaftar",
      icon: Tags,
      tone: "green" as const,
    },
    {
      title: "Total Supplier",
      value: suppliers.length.toString(),
      description: "Pemasok terdaftar",
      icon: Truck,
      tone: "blue" as const,
    },
    {
      title: "Total Nilai Inventori",
      value: formatRupiah(dashboardData.totalInventoryValue, { prefix: true }),
      description: "Berdasarkan harga beli dan stok",
      icon: DollarSign,
      tone: "amber" as const,
    },
    {
      title: "Produk Stok Menipis",
      value: dashboardData.lowStockItems.length.toString(),
      description: `Stok <= ${minimumStock} pcs`,
      icon: AlertTriangle,
      tone: "red" as const,
    },
    {
      title: "Notifikasi",
      value: notifications.length.toString(),
      description: `${dashboardData.unreadNotificationCount} belum dibaca`,
      icon: Bell,
      tone: "amber" as const,
    },
  ];
  const recentActivities = activities.slice(0, 5);

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Ringkasan {settings.storeName}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-1 text-gray-500">
              Pantau produk, stok, supplier, dan penjualan harian toko.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-blue-700">
            <Boxes className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">Status Operasional</p>
              <p className="text-xs">Data operasional aktif</p>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              tone={stat.tone}
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <StockAlertPanel items={dashboardData.lowStockItems} />
          <ActivityPanel activities={recentActivities} />
        </div>
      </div>
    </MainLayout>
  );
}
