import { createContext } from "react";

export type NotificationType = "success" | "error" | "info" | "warning";
export type NotificationCategory =
  | "stock"
  | "product"
  | "category"
  | "barcode"
  | "supplier"
  | "sales"
  | "announcement";

export type AppNotification = {
  id: string;
  title: string;
  description?: string;
  message?: string;
  time: string;
  type: NotificationType;
  category: NotificationCategory;
  isRead: boolean;
};

export type AddNotificationPayload = {
  title: string;
  description?: string;
  message?: string;
  time?: string;
  type: NotificationType;
  category?: NotificationCategory;
};

export type NotificationContextValue = {
  notifications: AppNotification[];
  notify: (notification: AddNotificationPayload) => void;
  dismiss: (notificationId: string) => void;
  markAllAsRead: () => void;
  clear: () => void;
};

export const NotificationContext = createContext<
  NotificationContextValue | undefined
>(undefined);
