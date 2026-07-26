import type { NotificationType, NotificationCategory } from "./enums";

export type { NotificationType, NotificationCategory };

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
