import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CircleDollarSign,
  Megaphone,
  PackageCheck,
  Printer,
} from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import MainLayout from "../../layouts/MainLayout";
import { useNotification } from "../../hooks/useNotification";
import type {
  AppNotification,
  NotificationCategory,
  NotificationType,
} from "../../contexts/notificationContextValue";

const notificationIcon = {
  stock: AlertTriangle,
  product: PackageCheck,
  category: PackageCheck,
  barcode: Printer,
  supplier: PackageCheck,
  sales: CircleDollarSign,
  announcement: Megaphone,
} satisfies Record<NotificationCategory, typeof Bell>;

const iconStyles: Record<NotificationType, string> = {
  warning: "bg-amber-50 text-amber-700",
  success: "bg-emerald-50 text-emerald-700",
  info: "bg-blue-50 text-blue-700",
  error: "bg-red-50 text-red-700",
};

function NotificationItem({ notification }: { notification: AppNotification }) {
  const Icon = notificationIcon[notification.category];

  return (
    <div
      className={`flex gap-4 border-b border-gray-100 px-5 py-4 last:border-0 ${
        notification.isRead ? "bg-white" : "bg-blue-50/60"
      }`}
    >
      <div
        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          iconStyles[notification.type]
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <h2
            className={`text-sm ${
              notification.isRead
                ? "font-medium text-gray-600"
                : "font-semibold text-gray-900"
            }`}
          >
            {notification.title}
          </h2>
          <span className="shrink-0 text-xs font-medium text-gray-400">
            {notification.time}
          </span>
        </div>
        {notification.description ? (
          <p className="mt-2 text-sm text-gray-500">
            {notification.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const { notifications, markAllAsRead } = useNotification();
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Notification Center
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              Notifikasi
            </h1>
            <p className="mt-1 text-gray-500">
              Pantau peringatan stok, supplier, dan performa penjualan.
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={markAllAsRead}
            className="shrink-0"
          >
            <CheckCheck className="h-4 w-4" />
            Tandai semua sudah dibaca
          </Button>
        </Card>

        <Card as="section" className="overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Semua Notifikasi
                </h2>
                <p className="text-sm text-gray-500">
                  {unreadCount} belum dibaca dari {notifications.length} notifikasi
                </p>
              </div>
            </div>
          </div>

          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))
          ) : (
            <p className="px-5 py-12 text-center text-sm font-medium text-gray-500">
              Belum ada data.
            </p>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
