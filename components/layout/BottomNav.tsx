"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Map, LayoutDashboard, Trophy, MessageSquare, Shield } from "lucide-react";
import { useSession } from "next-auth/react";

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { data: session } = useSession();

  const isActive = (path: string) => pathname.includes(path);

  const navItems = [
    { key: "map", href: "/map", icon: Map },
    { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
    { key: "ranking", href: "/ranking", icon: Trophy },
    { key: "chat", href: "/chat", icon: MessageSquare },
  ];

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <nav className="fixed bottom-0 left-0 w-full h-20 px-4 pb-safe bg-glass-fill dark:bg-deep-black/90 backdrop-blur-xl rounded-t-2xl border-t border-glass-border shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all active:scale-110 ${
                active
                  ? "text-primary bg-primary/10"
                  : "text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium mt-0.5">{t(item.key)}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all active:scale-110 ${
              isActive("/admin")
                ? "text-primary bg-primary/10"
                : "text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            <Shield className="w-6 h-6" />
            <span className="text-xs font-medium mt-0.5">{t("admin")}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
