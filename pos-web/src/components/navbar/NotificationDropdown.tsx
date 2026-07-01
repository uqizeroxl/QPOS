import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CircleDollarSign,
  Megaphone,
  PackageCheck,
  Printer,
} from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../ui/Button";
import { ROUTES } from "../../constants/routes";
import type {
  AppNotification,
  NotificationCategory,
  NotificationType,
} from "../../contexts/notificationContextValue";

type NotificationDropdownProps = {
  notifications: AppNotification[];
  isOpen: boolean;
  onMarkAllAsRead: () => void;
  onNavigate: () => void;
};

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

export default function NotificationDropdown({
  notifications,
  isOpen,
  onMarkAllAsRead,
  onNavigate,
}: NotificationDropdownProps) {
  return (
    <div
      className={`absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl transition duration-200 sm:w-96 ${
        isOpen
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Notifikasi</h3>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {notifications.length} Notifikasi
          </p>
        </div>
        <Button
          variant="unstyled"
          onClick={onMarkAllAsRead}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          <CheckCheck className="h-4 w-4" />
          Tandai semua
        </Button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const Icon = notificationIcon[notification.category];

            return (
              <div
                key={notification.id}
                className={`flex gap-3 border-b border-gray-100 px-4 py-3 transition ${
                  notification.isRead ? "bg-white" : "bg-blue-50/60"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    iconStyles[notification.type]
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm ${
                      notification.isRead
                        ? "font-medium text-gray-600"
                        : "font-semibold text-gray-900"
                    }`}
                  >
                    {notification.title}
                  </p>
                  {notification.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {notification.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs font-medium text-gray-400">
                    {notification.time}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="px-4 py-8 text-center text-sm font-medium text-gray-500">
            Belum ada data.
          </p>
        )}
      </div>

      <Link
        to={ROUTES.notifications}
        onClick={onNavigate}
        className="block border-t border-gray-200 px-4 py-3 text-center text-sm font-semibold text-blue-600 hover:bg-gray-50 hover:text-blue-700"
      >
        Lihat Semua
      </Link>
    </div>
  );
}
