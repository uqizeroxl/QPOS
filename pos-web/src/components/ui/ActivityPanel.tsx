import {
  LogIn,
  LogOut,
  Package,
  Pencil,
  Printer,
  ReceiptText,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ActivityLogItem, ActivityType } from "../../contexts/activityContextValue";
import { formatActivityDate, formatActivityTime } from "../../utils/activity";
import Card from "./Card";

type ActivityPanelProps = {
  activities: ActivityLogItem[];
};

const activityIcons: Record<ActivityType, LucideIcon> = {
  "product-create": Package,
  "product-update": Pencil,
  "product-delete": Trash2,
  "category-create": Package,
  "category-update": Pencil,
  "category-delete": Trash2,
  "supplier-create": Truck,
  "supplier-update": Pencil,
  "supplier-delete": Trash2,
  login: LogIn,
  logout: LogOut,
  "transaction-success": ShoppingCart,
  "barcode-print": Printer,
  "receipt-print": ReceiptText,
  "stock-restock": Package,
  "stock-minimum": Package,
};

export default function ActivityPanel({ activities }: ActivityPanelProps) {
  return (
    <Card as="section" className="p-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Aktivitas Terbaru
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Ringkasan aktivitas operasional hari ini.
        </p>
      </div>

      <div className="mt-5 space-y-5">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                {(() => {
                  const Icon = activityIcons[activity.type];
                  return <Icon className="h-4 w-4" />;
                })()}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  <span className="shrink-0 text-xs font-medium text-gray-400">
                    {formatActivityTime(activity.createdAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-gray-500">
                  {activity.description}
                </p>
                <p className="mt-1 text-xs font-medium text-gray-400">
                  {formatActivityDate(activity.createdAt)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-6 text-center text-sm font-medium text-gray-500">
            Belum ada data.
          </p>
        )}
      </div>
    </Card>
  );
}
