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

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  const handleProfileClick = () => {
    router.push("/profile");
  };

  return (
    <header className="fixed top-0 z-50 w-full h-16 glass-panel border-b border-glass-border flex justify-between items-center px-5 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={handleProfileClick}
          className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-surface-container flex items-center justify-center text-primary font-bold text-sm hover:border-primary/70 transition-colors"
          title="Ver perfil"
        >
          {initials}
        </button>
        <div className="flex flex-col">
          <span className="font-headline text-lg font-bold text-primary tracking-tight">
            One Solutions
          </span>
          <span className="text-xs text-on-surface-variant">
            {session?.user?.role ? t.roles[session.user.role as keyof typeof t.roles] || session.user.role : ""}
          </span>
        </div>
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
