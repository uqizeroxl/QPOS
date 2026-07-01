import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Button from "../ui/Button";
import { useNotification } from "../../hooks/useNotification";
import NotificationDropdown from "./NotificationDropdown";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { notifications, markAllAsRead } = useNotification();
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <Button
        variant="unstyled"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        aria-label="Notifikasi"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </Button>

      <NotificationDropdown
        notifications={notifications}
        isOpen={isOpen}
        onMarkAllAsRead={markAllAsRead}
        onNavigate={() => setIsOpen(false)}
      />
    </div>
  );
}
