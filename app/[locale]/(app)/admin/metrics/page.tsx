"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  DoorOpen,
  PersonStanding,
  Handshake,
  MessageSquareWarning,
  Users,
} from "lucide-react";

interface Metrics {
  doorsKnocked: number;
  leadsGenerated: number;
  projectsClosed: number;
  objectionsCount: number;
  appointments: number;
  teamGoal: number;
}

export default function AdminMetricsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push(`/${locale}/dashboard`);
      return;
    }
    fetch("/api/metrics")
      .then((res) => res.json())
      .then((data) => setMetrics(data));
  }, [session, locale, router]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">
          Métricas Globales
        </h1>
        <p className="text-on-surface-variant">
          Rendimiento general de la plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Puertas Tocadas"
          value={metrics?.doorsKnocked || 0}
          icon={DoorOpen}
        />
        <MetricCard
          title="Leads Generados"
          value={metrics?.leadsGenerated || 0}
          icon={PersonStanding}
        />
        <MetricCard
          title="Proyectos Cerrados"
          value={metrics?.projectsClosed || 0}
          icon={Handshake}
        />
        <MetricCard
          title="Objeciones Registradas"
          value={metrics?.objectionsCount || 0}
          icon={MessageSquareWarning}
        />
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="font-headline text-lg font-bold text-on-surface">
            Actividad del Equipo
          </h2>
        </div>
        <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: "65%" }}
          />
        </div>
        <p className="text-sm text-on-surface-variant mt-2">
          Meta mensual del equipo: {metrics?.teamGoal || 0} proyectos cerrados
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[130px]">
      <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit">
        <Icon className="w-5 h-5" />
      </div>
      <div className="mt-4">
        <h3 className="text-on-surface-variant text-xs uppercase tracking-wider font-semibold">
          {title}
        </h3>
        <p className="font-display text-3xl font-bold text-on-surface mt-1">
          {value}
        </p>
      </div>
    </div>
  );
}
