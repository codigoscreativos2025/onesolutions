"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
import { Map, LayoutDashboard, Trophy, MessageSquare, Shield, Calendar, MapPin, Briefcase } from "lucide-react";
import { useSession } from "next-auth/react";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { data: session } = useSession();

  const isActive = (path: string) => pathname.includes(path);

  const navItems = [
    { href: "/map", label: t.nav.map, icon: Map, roles: ["SETTER", "CLOSER", "ADMIN"] },
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard, roles: ["SETTER", "CLOSER", "ADMIN"] },
    { href: "/my-parcels", label: "Parcelas Activas", icon: MapPin, roles: ["SETTER", "CLOSER"] },
    { href: "/my-projects", label: "Mis Proyectos", icon: Briefcase, roles: ["CLOSER"] },
    { href: "/calendar", label: t.nav.calendar, icon: Calendar, roles: ["CLOSER", "ADMIN"] },
    { href: "/ranking", label: t.nav.ranking, icon: Trophy, roles: ["SETTER", "CLOSER", "ADMIN"] },
    { href: "/chat", label: t.nav.chat, icon: MessageSquare, roles: ["SETTER", "CLOSER", "ADMIN"] },
    { href: "/admin", label: t.nav.admin, icon: Shield, roles: ["ADMIN"] },
  ];

  const visibleItems = navItems.filter((item) =>
    session?.user?.role ? item.roles.includes(session.user.role) : false
  );

  return (
    <nav className="fixed bottom-0 z-50 w-full glass-panel border-t border-glass-border">
      <div className="flex justify-around items-center h-16">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                active
                  ? "text-primary bg-primary/10"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
