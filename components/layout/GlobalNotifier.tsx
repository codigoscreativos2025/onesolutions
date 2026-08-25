"use client";

import { useEffect, useState, useRef } from "react";
import { Mail, Bell, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UnreadStatus {
  unreadNotificationsCount: number;
  latestUnreadNotificationId: number | null;
  unreadMessagesCount: number;
  latestUnreadMessageId: number | null;
}

export function GlobalNotifier() {
  const { data: session } = useSession();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Local state for the custom toast
  const [toastData, setToastData] = useState<{
    type: "message" | "notification";
    title: string;
    body: string;
    messageId?: number | null;
    notificationId?: number | null;
  } | null>(null);

  useEffect(() => {
    if (!session) return;

    const checkUnreadStatus = async () => {
      // Don`t fetch if a toast is currently visible
      if (toastData) return;

      try {
        const res = await fetch("/api/unread-status");
        if (!res.ok) return;
        const data: UnreadStatus = await res.json();

        // Retrieve stored state
        const storedMessageId = parseInt(localStorage.getItem("latestUnreadMessageId") || "0");
        const storedNotificationId = parseInt(localStorage.getItem("latestUnreadNotificationId") || "0");
        const lastReminderDate = localStorage.getItem("lastUnreadReminderDate") || "";

        const today = new Date().toISOString().split("T")[0];

        let shouldShowMessageToast = false;
        let shouldShowNotificationToast = false;
        
        let messageTitle = "";
        let messageBody = "";
        let notifTitle = "";
        let notifBody = "";

        // 1. Check for completely NEW messages
        if (data.latestUnreadMessageId && data.latestUnreadMessageId > storedMessageId) {
          shouldShowMessageToast = true;
          messageTitle = "Hola buenas, tienes un nuevo mensaje";
          messageBody = "Verifica y deja leídos los mensajes pendientes, mantener el flujo de desarrollo es importante.";
        } 
        // 2. Check for daily reminder of UNREAD messages
        else if (data.unreadMessagesCount > 0 && lastReminderDate !== today) {
          shouldShowMessageToast = true;
          messageTitle = "Hola buenas, tienes mensajes sin leer";
          messageBody = "Verifica y deja leídos los mensajes pendientes, mantener el flujo de desarrollo es importante.";
        }

        // 3. Check for NEW notifications
        if (data.latestUnreadNotificationId && data.latestUnreadNotificationId > storedNotificationId) {
          shouldShowNotificationToast = true;
          notifTitle = "Tienes una nueva notificación";
          notifBody = "Revisa tus notificaciones recientes para estar al tanto del flujo del proyecto.";
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

    // Check every 5 minutes (300000 ms)
    const interval = setInterval(checkUnreadStatus, 300000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [session, toastData]);

  if (!toastData) return null;

  const isMessage = toastData.type === "message";

  const dismissToast = (navigateToChat: boolean = false) => {
    // Update local storage so it doesnt pop up again immediately
    if (isMessage) {
      if (toastData.messageId) {
        localStorage.setItem("latestUnreadMessageId", toastData.messageId.toString());
      } else {
        localStorage.setItem("lastUnreadReminderDate", new Date().toISOString().split("T")[0]);
      }
      if (navigateToChat) router.push("/chat");
    } else {
      if (toastData.notificationId) {
        localStorage.setItem("latestUnreadNotificationId", toastData.notificationId.toString());
      }
    }
    setToastData(null);
  };

  return (
    <div className="fixed bottom-28 left-4 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div 
        onClick={() => dismissToast(true)}
        className={`relative cursor-pointer overflow-hidden flex items-start gap-3 p-4 pr-8 w-[340px] rounded-xl shadow-2xl border transition-transform hover:scale-[1.02] ${
          isMessage ? "bg-[#e8f5e9] border-[#4caf50]" : "bg-[#fff3e0] border-[#ff9800]"
        }`}
      >
        <div className={`shrink-0 p-2 rounded-full ${isMessage ? "bg-[#4caf50]/20 text-[#4caf50]" : "bg-[#ff9800]/20 text-[#ff9800]"}`}>
          {isMessage ? <Mail className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <h1 className={`text-sm font-bold mb-1 ${isMessage ? "text-[#2e7d32]" : "text-[#e65100]"}`}>
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