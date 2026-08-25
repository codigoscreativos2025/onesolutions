"use client";

import { useEffect, useState } from "react";
import { Mail, Bell } from "lucide-react";
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
  
  // Local state for the custom toast
  const [toastData, setToastData] = useState<{
    type: "message" | "notification";
    title: string;
    body: string;
  } | null>(null);

  useEffect(() => {
    if (!session) return;

    const checkUnreadStatus = async () => {
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
          localStorage.setItem("latestUnreadMessageId", data.latestUnreadMessageId.toString());
        } 
        // 2. Check for daily reminder of UNREAD messages
        else if (data.unreadMessagesCount > 0 && lastReminderDate !== today) {
          shouldShowMessageToast = true;
          messageTitle = "Tienes mensajes sin leer";
          messageBody = "Verifica y deja leídos los mensajes pendientes, mantener el flujo de desarrollo es importante.";
          localStorage.setItem("lastUnreadReminderDate", today);
        }

        // 3. Check for NEW notifications
        if (data.latestUnreadNotificationId && data.latestUnreadNotificationId > storedNotificationId) {
          shouldShowNotificationToast = true;
          notifTitle = "Tienes una nueva notificación";
          notifBody = "Revisa tus notificaciones recientes para estar al tanto del flujo del proyecto.";
          localStorage.setItem("latestUnreadNotificationId", data.latestUnreadNotificationId.toString());
        }

        // Show toast (prioritize messages)
        if (shouldShowMessageToast) {
          setToastData({ type: "message", title: messageTitle, body: messageBody });
          setTimeout(() => setToastData(null), 10000); // hide after 10s
        } else if (shouldShowNotificationToast) {
          setToastData({ type: "notification", title: notifTitle, body: notifBody });
          setTimeout(() => setToastData(null), 10000); // hide after 10s
        }

      } catch (error) {
        console.error("Error checking unread status", error);
      }
    };

    // Initial check (delay by 2 seconds to not crowd initial load)
    const initTimer = setTimeout(checkUnreadStatus, 2000);

    // Check every 5 minutes (300000 ms)
    const interval = setInterval(checkUnreadStatus, 300000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [session]);

  if (!toastData) return null;

  const isMessage = toastData.type === "message";

  return (
    <div className="fixed bottom-28 left-4 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div 
        onClick={() => {
          if (isMessage) router.push("/chat");
          setToastData(null);
        }}
        className={`relative cursor-pointer overflow-hidden flex items-start gap-3 p-4 w-[340px] rounded-xl shadow-2xl border transition-transform hover:scale-[1.02] ${
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
            setToastData(null);
          }}
          className="absolute top-2 right-2 text-black/40 hover:text-black transition-colors"
        >
          &times;
        </button>
      </div>
    </div>
  );
}