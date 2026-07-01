import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNotification } from "../hooks/useNotification";
import { ActivityContext } from "./activityContextValue";
import type {
  ActivityLogItem,
  AddActivityPayload,
  ActivityType,
} from "./activityContextValue";
import type {
  NotificationCategory,
  NotificationType,
} from "./notificationContextValue";

type ActivityProviderProps = {
  children: ReactNode;
};

const initialActivities: ActivityLogItem[] = [];

const activityNotificationMap: Record<
  ActivityType,
  {
    title: string;
    type: NotificationType;
    category: NotificationCategory;
  }
> = {
  "product-create": {
    title: "Tambah Produk",
    type: "success",
    category: "product",
  },
  "product-update": {
    title: "Edit Produk",
    type: "info",
    category: "product",
  },
  "product-delete": {
    title: "Hapus Produk",
    type: "error",
    category: "product",
  },
  "category-create": {
    title: "Tambah Kategori",
    type: "success",
    category: "category",
  },
  "category-update": {
    title: "Edit Kategori",
    type: "info",
    category: "category",
  },
  "category-delete": {
    title: "Hapus Kategori",
    type: "error",
    category: "category",
  },
  "supplier-create": {
    title: "Tambah Supplier",
    type: "success",
    category: "supplier",
  },
  "supplier-update": {
    title: "Edit Supplier",
    type: "info",
    category: "supplier",
  },
  "supplier-delete": {
    title: "Hapus Supplier",
    type: "error",
    category: "supplier",
  },
  login: {
    title: "Login",
    type: "info",
    category: "announcement",
  },
  logout: {
    title: "Logout",
    type: "info",
    category: "announcement",
  },
  "transaction-success": {
    title: "Transaksi Berhasil",
    type: "success",
    category: "sales",
  },
  "barcode-print": {
    title: "Cetak Barcode",
    type: "info",
    category: "barcode",
  },
  "receipt-print": {
    title: "Cetak Struk",
    type: "info",
    category: "sales",
  },
  "stock-minimum": {
    title: "Stok Minimum",
    type: "warning",
    category: "stock",
  },
};

function getSafeCreatedAt(value?: string) {
  const date = value ? new Date(value) : new Date();

  if (isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

export function ActivityProvider({ children }: ActivityProviderProps) {
  const { notify } = useNotification();
  const [activities, setActivities] =
    useState<ActivityLogItem[]>(initialActivities);

  const addActivity = useCallback((activity: AddActivityPayload) => {
    const createdAt = getSafeCreatedAt(activity.createdAt);
    const nextActivity = {
      ...activity,
      id: crypto.randomUUID(),
      createdAt,
    };
    const notification = activityNotificationMap[nextActivity.type];

    setActivities((currentActivities) => [
      nextActivity,
      ...currentActivities,
    ]);

    notify({
      title: notification.title,
      description: nextActivity.description,
      type: notification.type,
      category: notification.category,
    });
  }, [notify]);

  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  const value = useMemo(
    () => ({ activities, addActivity, clearActivities }),
    [activities, addActivity, clearActivities],
  );

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
}
