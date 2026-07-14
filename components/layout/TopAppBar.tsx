"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { useLocale } from "@/lib/locale-context";
import { LogOut } from "lucide-react";

export function TopAppBar() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLocale();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="fixed top-0 z-50 w-full h-16 glass-panel border-b border-brand-orange/20 flex justify-between items-center px-5 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/profile/${session?.user?.id}`)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
          >
            <circle cx="16" cy="16" r="14" stroke="#FF5722" strokeWidth="2.5" />
            <path
              d="M16 22V12"
              stroke="#4CAF50"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M16 14C16 14 12 12 10 8C13 9 16 14 16 14Z"
              fill="#4CAF50"
            />
            <path
              d="M16 14C16 14 20 12 22 8C19 9 16 14 16 14Z"
              fill="#4CAF50"
            />
          </svg>
          <div className="flex flex-col text-left">
            <span className="font-headline text-lg font-bold text-primary tracking-tight">
              {session?.user?.name || "One Solutions"}
            </span>
            <span className="text-xs text-on-surface-variant">
              {session?.user?.role ? t.roles[session.user.role as keyof typeof t.roles] || session.user.role : ""}
            </span>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
        <NotificationsDropdown />
        <button
          onClick={handleSignOut}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors active:scale-90"
          title="Cerrar sesión"
        >
          <LogOut className="w-5 h-5 text-on-surface-variant" />
        </button>
      </div>
    </header>
  );
}
