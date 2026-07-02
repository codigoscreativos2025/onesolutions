"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
import {
  DoorOpen,
  PersonStanding,
  Handshake,
  MessageSquareWarning,
  TrendingUp,
  Calendar,
  ChevronRight,
} from "lucide-react";

interface Metrics {
  doorsKnocked: number;
  leadsGenerated: number;
  projectsClosed: number;
  objectionsCount: number;
  appointments: number;
  teamGoal: number;
}

interface Appointment {
  id: number;
  parcel: { id: string; address: string };
  setter: { name: string };
  closer?: { name: string };
  stage: string;
  slot?: { startAt: string };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useLocale();

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [metricsRes, appointmentsRes] = await Promise.all([
        fetch("/api/metrics"),
        fetch("/api/appointments"),
      ]);
      const metricsData = await metricsRes.json();
      const appointmentsData = await appointmentsRes.json();
      setMetrics(metricsData);
      setAppointments(appointmentsData.slice(0, 5));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";

  return (
    <div className="space-y-6">
      <section className="mb-6">
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          {isAdmin ? "Admin" : role === "CLOSER" ? "Closer" : "Setter"}
        </span>
        <h1 className="font-headline text-2xl font-bold text-on-surface">
          {t.dashboard.greeting}, {session?.user?.name}
        </h1>
        <p className="text-on-surface-variant">
          {t.dashboard.summary}
        </p>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t.dashboard.doorsKnocked}
          value={metrics?.doorsKnocked || 0}
          icon={DoorOpen}
          color="primary"
        />
        <MetricCard
          title={t.dashboard.leadsGenerated}
          value={metrics?.leadsGenerated || 0}
          icon={PersonStanding}
          color="secondary"
        />
        <MetricCard
          title={t.dashboard.projectsClosed}
          value={metrics?.projectsClosed || 0}
          icon={Handshake}
          color="primary"
        />
        <MetricCard
          title={t.dashboard.objections}
          value={metrics?.objectionsCount || 0}
          icon={MessageSquareWarning}
          color="secondary"
        />
      </div>

      <section className="glass-panel rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-headline text-lg font-bold text-on-surface">
            {t.dashboard.recentAppointments}
          </h2>
          <Link
            href="/calendar"
            className="text-sm text-primary font-medium flex items-center gap-1"
          >
            {t.dashboard.viewAll} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {appointments.length === 0 ? (
          <p className="text-on-surface-variant text-center py-8">
            {t.dashboard.noAppointments}
          </p>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-4 rounded-xl border border-glass-border hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/visit/${apt.parcel.id || ""}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface">
                      {apt.parcel.address}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {apt.slot
                        ? new Date(apt.slot.startAt).toLocaleString()
                        : t.common.none}
                      {role === "CLOSER" && ` • Setter: ${apt.setter.name}`}
                    </p>
                  </div>
                </div>
                <StatusIcon stage={apt.stage} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: "primary" | "secondary";
}) {
  return (
    <div className="glass-panel p-3 sm:p-5 rounded-2xl flex flex-col justify-between min-h-[100px] sm:min-h-[130px] group hover:border-primary/40 transition-all">
      <div className="flex justify-between items-start">
        <div
          className={`p-2 sm:p-3 rounded-xl ${
            color === "primary" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
          }`}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
      </div>
      <div className="mt-2 sm:mt-4">
        <h3 className="text-on-surface-variant text-[10px] sm:text-xs uppercase tracking-wider font-semibold">
          {title}
        </h3>
        <p className="font-display text-2xl sm:text-3xl font-bold text-on-surface mt-1">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusIcon({ stage }: { stage: string }) {
  if (stage === "CLOSED") {
    return (
      <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase">
        Cerrado
      </span>
    );
  }
  return (
    <span className="px-2 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-bold uppercase">
      Pendiente
    </span>
  );
}
