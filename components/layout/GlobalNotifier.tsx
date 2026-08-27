"use client";

import { useEffect, useState } from "react";
import { Mail, Bell, X, MapPinOff } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/locale-context";

interface UnreadStatus {
  unreadNotificationsCount: number;
  latestUnreadNotificationId: number | null;
  unreadMessagesCount: number;
  latestUnreadMessageId: number | null;
}

export function GlobalNotifier() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLocale();
  
  // Local state for the custom toast
  const [toastData, setToastData] = useState<{
    type: "message" | "notification" | "error";
    title: string;
    body: string;
    messageId?: number | null;
    notificationId?: number | null;
  } | null>(null);

  // Listen for custom global events (e.g. from MapView)
  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setToastData(customEvent.detail);
      }
    };
    window.addEventListener("show-global-toast", handleGlobalToast);
    return () => window.removeEventListener("show-global-toast", handleGlobalToast);
  }, []);

  useEffect(() => {
    if (!session) return;

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
        // 4. Check for reminder of UNREAD notifications (every 20 mins, shares timer with messages)
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
            messageId: data.latestUnreadMessageId // pass ID to update it on dismiss
          });
        } else if (shouldShowNotificationToast) {
          setToastData({ 
            type: "notification", 
            title: notifTitle, 
            body: notifBody,
            notificationId: data.latestUnreadNotificationId // pass ID to update it on dismiss
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

  if (!toastData) return null;

  const isMessage = toastData.type === "message";
  const isError = toastData.type === "error";

  const dismissToast = (navigateToChat: boolean = false) => {
    // Update local storage so it doesnt pop up again immediately
    if (isMessage) {
      if (toastData.messageId) {
        localStorage.setItem("latestUnreadMessageId", toastData.messageId.toString());
      }
      // Always reset the 20-min reminder timer when dismissing a message toast
      localStorage.setItem("lastUnreadReminderTime", Date.now().toString());
      
      if (navigateToChat) router.push("/chat");
    } else if (toastData.type === "notification") {
      if (toastData.notificationId) {
        localStorage.setItem("latestUnreadNotificationId", toastData.notificationId.toString());
      }
      // Reset reminder for notifications too
      localStorage.setItem("lastUnreadReminderTime", Date.now().toString());
    }
    setToastData(null);
  };

  let bgClass = "bg-[#fff3e0] border-[#ff9800]";
  let iconClass = "bg-[#ff9800]/20 text-[#ff9800]";
  let titleClass = "text-[#e65100]";
  let Icon = Bell;

  if (isMessage) {
    bgClass = "bg-[#e8f5e9] border-[#4caf50]";
    iconClass = "bg-[#4caf50]/20 text-[#4caf50]";
    titleClass = "text-[#2e7d32]";
    Icon = Mail;
  } else if (isError) {
    bgClass = "bg-[#ffebee] border-[#f44336]";
    iconClass = "bg-[#f44336]/20 text-[#f44336]";
    titleClass = "text-[#c62828]";
    Icon = MapPinOff;
  }

  return (
    <div className="fixed bottom-28 left-4 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div 
        onClick={() => dismissToast(isMessage)}
        className={`relative cursor-pointer overflow-hidden flex items-start gap-3 p-4 pr-8 w-[340px] rounded-xl shadow-2xl border transition-transform hover:scale-[1.02] ${bgClass}`}
      >
        <div className={`shrink-0 p-2 rounded-full ${iconClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className={`text-sm font-bold mb-1 ${titleClass}`}>
            {toastData.title}
          </h1>
          <p className="text-xs text-black/70 leading-relaxed">
            {toastData.body}
          </p>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            dismissToast(false);
          }}
          className="absolute top-2 right-2 text-black/40 hover:text-black transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}