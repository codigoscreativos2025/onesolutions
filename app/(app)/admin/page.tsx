import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { Users, MessageSquareWarning, BarChart3, MessageCircle, Award, Settings, Briefcase, FileText, ReceiptText } from "lucide-react";

export default async function AdminPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const menuItems = [
    {
      title: "Usuarios",
      description: "Gestiona trainers, closers y administradores",
      href: "/admin/users",
      icon: Users,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Objeciones",
      description: "Configura las objeciones del equipo",
      href: "/admin/objections",
      icon: MessageSquareWarning,
      color: "bg-secondary/10 text-secondary",
    },
    {
      title: "Métricas",
      description: "Visualiza el rendimiento general",
      href: "/admin/metrics",
      icon: BarChart3,
      color: "bg-tertiary/10 text-tertiary",
    },
    {
      title: "Medallas",
      description: "Configura medallas y metas del equipo",
      href: "/admin/badges",
      icon: Award,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Campos de Proyectos",
      description: "Configura campos personalizados por tipo de proyecto",
      href: "/admin/project-fields",
      icon: Settings,
      color: "bg-secondary/10 text-secondary",
    },
    {
      title: "CRM",
      description: "Gestión completa de proyectos, leads y visitas",
      href: "/admin/crm",
      icon: Briefcase,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Historial de Auditoría",
      description: "Registro de todos los cambios en la plataforma",
      href: "/admin/audit-logs",
      icon: FileText,
      color: "bg-secondary/10 text-secondary",
    },
    {
      title: "Chats",
      description: "Monitorea las conversaciones internas",
      href: "/admin/chats",
      icon: MessageCircle,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Configuración",
      description: "Logo del negocio y etiquetas personalizadas",
      href: "/admin/settings",
      icon: Settings,
      color: "bg-tertiary/10 text-tertiary",
    },
    {
      title: "Facturas",
      description: "Genera facturas personalizadas y descarga PDFs",
      href: "/admin/invoices",
      icon: ReceiptText,
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
