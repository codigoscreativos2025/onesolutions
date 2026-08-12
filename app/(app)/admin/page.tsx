"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Users, BarChart3, ReceiptText, Mail } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "ADMIN")) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading" || !session) return null;

  const menuItems = [
    { title: t.admin.users, description: t.admin.usersDesc, href: "/admin/users", icon: Users, color: "bg-primary/10 text-primary" },
    { title: t.admin.metrics, description: t.admin.metricsDesc, href: "/admin/metrics", icon: BarChart3, color: "bg-tertiary/10 text-tertiary" },
    { title: "Facturas", description: "Genera facturas personalizadas y descarga PDFs", href: "/admin/invoices", icon: ReceiptText, color: "bg-primary/10 text-primary" },
    { title: "Correos", description: "Envia correos con plantillas predeterminadas a usuarios y clientes", href: "/admin/emails", icon: Mail, color: "bg-secondary/10 text-secondary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">
          {t.admin.title}
        </h1>
        <p className="text-on-surface-variant">
          {t.admin.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="glass-panel p-6 rounded-2xl hover:border-primary/40 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-headline text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                    {item.title}
                  </h2>
                  <p className="text-sm text-on-surface-variant mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
