import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { Users, MessageSquareWarning, BarChart3, MessageCircle } from "lucide-react";

export default async function AdminPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = await params;
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  const menuItems = [
    {
      title: "Usuarios",
      description: "Gestiona setters, closers y administradores",
      href: `/${locale}/admin/users`,
      icon: Users,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Objeciones",
      description: "Configura las objeciones del equipo",
      href: `/${locale}/admin/objections`,
      icon: MessageSquareWarning,
      color: "bg-secondary/10 text-secondary",
    },
    {
      title: "Métricas",
      description: "Visualiza el rendimiento general",
      href: `/${locale}/admin/metrics`,
      icon: BarChart3,
      color: "bg-tertiary/10 text-tertiary",
    },
    {
      title: "Chats",
      description: "Monitorea las conversaciones internas",
      href: `/${locale}/admin/chats`,
      icon: MessageCircle,
      color: "bg-primary/10 text-primary",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">
          Administración
        </h1>
        <p className="text-on-surface-variant">
          Panel de control general de la plataforma
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
