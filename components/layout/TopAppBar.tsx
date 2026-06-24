"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Bell } from "lucide-react";

export function TopAppBar() {
  const { data: session } = useSession();
  const t = useTranslations("roles");

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
            {session?.user?.role ? t(session.user.role as "ADMIN" | "SETTER" | "CLOSER") : ""}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors active:scale-90 relative">
          <Bell className="w-5 h-5 text-primary" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
        </button>
      </div>
    </header>
  );
}
