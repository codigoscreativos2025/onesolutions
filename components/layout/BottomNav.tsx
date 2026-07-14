"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
import {
  Map,
  LayoutDashboard,
  Trophy,
  MessageSquare,
  Shield,
  Calendar,
  Briefcase,
  Target,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const { data: session } = useSession();

  const isActive = (path: string) => pathname.includes(path);

  const navItems = [
    { href: "/map", label: t.nav.map, icon: Map, roles: ["SETTER", "CLOSER", "ADMIN"] },
    {
      href: "/ranking",
      label: t.nav.ranking,
      icon: Trophy,
      roles: ["SETTER", "CLOSER", "ADMIN"],
      highlighted: true,
    },
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard, roles: ["SETTER", "CLOSER", "ADMIN"] },
    { href: "/leads", label: "Leads", icon: Target, roles: ["SETTER", "CLOSER"] },
    { href: "/my-projects", label: "Mis Proyectos", icon: Briefcase, roles: ["CLOSER"] },
    { href: "/calendar", label: t.nav.calendar, icon: Calendar, roles: ["CLOSER", "ADMIN"] },
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
              className={`relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors ${
                item.highlighted
                  ? "text-primary bg-primary/10"
                  : active
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high"
              }`}
            >
              {active && !item.highlighted && (
                <motion.div
                  layoutId="nav-active-indicator"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}
              <Icon className="w-5 h-5 relative z-10" />
              <span className="text-[10px] font-medium relative z-10">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
