"use client";

import { useEffect, useState } from "react";
import { Mail, Bell, X, MapPinOff } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
import { useNotifications } from "@/hooks/useNotifications";

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
  
  const { toastData, dismissToast } = useNotifications();

  if (!toastData) return null;

  const isMessage = toastData.type === "message";
  const isError = toastData.type === "error";

  const handleDismiss = (navigateToChat: boolean = false) => {
    dismissToast(navigateToChat);
    if (navigateToChat) router.push("/chat");
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
        onClick={() => handleDismiss(isMessage)}
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
            handleDismiss(false);
          }}
          className="absolute top-2 right-2 text-black/40 hover:text-black transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}