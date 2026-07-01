import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { NotificationContext } from "./notificationContextValue";
import type { AddNotificationPayload, AppNotification } from "./notificationContextValue";

type NotificationProviderProps = {
  children: ReactNode;
};

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const notify = useCallback((notification: AddNotificationPayload) => {
    setNotifications((currentNotifications) => [
      {
        ...notification,
        id: crypto.randomUUID(),
        description: notification.description ?? notification.message,
        time: notification.time ?? "Baru saja",
        category: notification.category ?? "announcement",
        isRead: false,
      },
      ...currentNotifications,
    ]);
  }, []);

  const dismiss = useCallback((notificationId: string) => {
    setNotifications((currentNotifications) =>
      currentNotifications.filter(
        (notification) => notification.id !== notificationId,
      ),
    );
  }, []);

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    );
  }, []);

  const value = useMemo(
    () => ({ notifications, notify, dismiss, markAllAsRead, clear }),
    [clear, dismiss, markAllAsRead, notifications, notify],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
