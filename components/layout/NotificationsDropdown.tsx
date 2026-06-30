"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";

interface Notification {
  id: number;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsDropdown() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) {
      fetchNotifications();
    }
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
    fetchNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
    });
    fetchNotifications();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays}d`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors active:scale-90 relative"
      >
        <Bell className="w-5 h-5 text-primary" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 max-h-96 glass-panel rounded-2xl shadow-lg border border-glass-border overflow-hidden z-50">
          <div className="flex items-center justify-between p-3 border-b border-glass-border">
            <h3 className="font-semibold text-on-surface text-sm">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
              >
                <CheckCheck className="w-3 h-3" />
                Marcar todas
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant text-sm">
                No hay notificaciones
              </div>
            ) : (
              notifications.slice(0, 20).map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-3 border-b border-glass-border/50 hover:bg-surface-container-low transition-colors ${
                    !notification.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-on-surface text-sm truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">
                        {notification.body}
                      </p>
                      <p className="text-[10px] text-on-surface-variant mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
