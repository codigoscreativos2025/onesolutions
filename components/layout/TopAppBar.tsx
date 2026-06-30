"use client";

import { useSession } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { getTranslation } from "@/lib/i18n";

export function TopAppBar() {
  const { data: session } = useSession();
  const t = getTranslation().roles;

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  return (
    <header className="fixed top-0 z-50 w-full h-16 glass-panel border-b border-glass-border flex justify-between items-center px-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-surface-container flex items-center justify-center text-primary font-bold text-sm">
          {initials}
        </div>
        <div className="flex flex-col">
          <span className="font-headline text-lg font-bold text-primary tracking-tight">
            One Solutions
          </span>
          <span className="text-xs text-on-surface-variant">
            {session?.user?.role ? t[session.user.role as keyof typeof t] || session.user.role : ""}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
        <NotificationsDropdown />
      </div>
    </header>
  );
}
