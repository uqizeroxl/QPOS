import { createContext } from "react";
import type {
  AppNotification,
  AddNotificationPayload,
} from "../types/notification";

export type {
  NotificationType,
  NotificationCategory,
  AppNotification,
  AddNotificationPayload,
} from "../types/notification";

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
