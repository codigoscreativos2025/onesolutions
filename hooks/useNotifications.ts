import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "@/lib/locale-context";

interface UnreadStatus {
  unreadNotificationsCount: number;
  latestUnreadNotificationId: number | null;
  unreadMessagesCount: number;
  latestUnreadMessageId: number | null;
}

export interface ToastData {
  type: "message" | "notification" | "error";
  title: string;
  body: string;
  messageId?: number | null;
  notificationId?: number | null;
}

export function useNotifications() {
  const { data: session } = useSession();
  const { t } = useLocale();
  
  const [toastData, setToastData] = useState<ToastData | null>(null);

  // Listen for custom global events (e.g. from MapView or local actions)
  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        // Enforce that local toasts are valid
        setToastData(customEvent.detail);
      }
    };
    window.addEventListener("show-global-toast", handleGlobalToast);
    return () => window.removeEventListener("show-global-toast", handleGlobalToast);
  }, []);

  useEffect(() => {
    if (!session || !session.user || !session.user.id) return;

    const checkUnreadStatus = async () => {
      // Dont fetch if a toast is currently visible
      if (toastData) return;

      try {
        const res = await fetch("/api/unread-status");
        if (!res.ok) return;
        const data: UnreadStatus = await res.json();

        // Retrieve stored state
        const storedMessageId = parseInt(localStorage.getItem("latestUnreadMessageId") || "0");
        const storedNotificationId = parseInt(localStorage.getItem("latestUnreadNotificationId") || "0");
        const lastReminderTime = parseInt(localStorage.getItem("lastUnreadReminderTime") || "0");
        const now = Date.now();
        const TWENTY_MINUTES = 20 * 60 * 1000;

        let shouldShowMessageToast = false;
        let shouldShowNotificationToast = false;
        
        let messageTitle = "";
        let messageBody = "";
        let notifTitle = "";
        let notifBody = "";

        // 1. Check for completely NEW messages
        if (data.latestUnreadMessageId && data.latestUnreadMessageId > storedMessageId) {
          shouldShowMessageToast = true;
          messageTitle = t.notifier.newMsgTitle;
          messageBody = t.notifier.msgBody;
        } 
        // 2. Check for reminder of UNREAD messages (every 20 mins)
        else if (data.unreadMessagesCount > 0 && (now - lastReminderTime > TWENTY_MINUTES)) {
          shouldShowMessageToast = true;
          messageTitle = t.notifier.unreadMsgTitle;
          messageBody = t.notifier.msgBody;
        }

        // 3. Check for NEW notifications
        if (data.latestUnreadNotificationId && data.latestUnreadNotificationId > storedNotificationId) {
          shouldShowNotificationToast = true;
          notifTitle = t.notifier.newNotifTitle;
          notifBody = t.notifier.notifBody;
        }
        // 4. Check for reminder of UNREAD notifications
        else if (data.unreadNotificationsCount > 0 && (now - lastReminderTime > TWENTY_MINUTES)) {
          shouldShowNotificationToast = true;
          notifTitle = t.notifier.newNotifTitle;
          notifBody = t.notifier.notifBody;
        }

        // Show toast (prioritize messages, wait for user to dismiss to update localStorage)
        if (shouldShowMessageToast) {
          setToastData({ 
            type: "message", 
            title: messageTitle, 
            body: messageBody,
            messageId: data.latestUnreadMessageId
          });
        } else if (shouldShowNotificationToast) {
          setToastData({ 
            type: "notification", 
            title: notifTitle, 
            body: notifBody,
            notificationId: data.latestUnreadNotificationId
          });
        }

      } catch (error) {
        console.error("Error checking unread status", error);
      }
    };

    // Initial check (delay by 3 seconds)
    const initTimer = setTimeout(checkUnreadStatus, 3000);

    // Check every 30 seconds to catch NEW messages quickly
    const interval = setInterval(checkUnreadStatus, 30000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [session, toastData, t]);

  const dismissToast = (navigateToChat: boolean = false) => {
    if (toastData?.type === "message") {
      if (toastData.messageId) {
        localStorage.setItem("latestUnreadMessageId", toastData.messageId.toString());
      }
      localStorage.setItem("lastUnreadReminderTime", Date.now().toString());
    } else if (toastData?.type === "notification") {
      if (toastData.notificationId) {
        localStorage.setItem("latestUnreadNotificationId", toastData.notificationId.toString());
      }
      localStorage.setItem("lastUnreadReminderTime", Date.now().toString());
    }
    setToastData(null);
  };

  return { toastData, dismissToast };
}
