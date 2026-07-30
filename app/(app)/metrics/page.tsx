"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DoorOpen, UserPlus, CheckCircle, DollarSign } from "lucide-react";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  CLOSER: "Closer",
  SETTER: "Trainee",
  SETTER_JR: "Setter",
  PARTNER: "Partner",
};

interface TopUser {
  id: number;
  name: string;
  count: number;
}

interface AdminMetrics {
  doorsKnockedToday: number;
  doorsKnockedWeek: number;
  doorsKnockedMonth: number;
  leadsCreatedToday: number;
  leadsCreatedWeek: number;
  leadsCreatedMonth: number;
  projectsClosedToday: number;
  projectsClosedWeek: number;
  projectsClosedMonth: number;
  totalBilling: number;
  topClosers: TopUser[];
  topSetters: TopUser[];
}

interface PersonalMetrics {
  doorsKnockedToday: number;
  doorsKnockedWeek: number;
  doorsKnockedMonth: number;
  doorsKnockedTotal: number;
  leadsGeneratedToday: number;
  leadsGeneratedWeek: number;
  leadsGeneratedMonth: number;
  leadsGeneratedTotal: number;
  projectsClosedToday: number;
  projectsClosedWeek: number;
  projectsClosedMonth: number;
  projectsClosedTotal: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function splitName(fullName: string): [string, string] {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return [fullName, ""];
  return [parts[0], parts.slice(1).join(" ")];
}

export default function MetricsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || "";
  const isAdmin = role === "ADMIN";

  const [adminData, setAdminData] = useState<AdminMetrics | null>(null);
  const [personalData, setPersonalData] = useState<PersonalMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!role) return;

    async function fetchMetrics() {
      setLoading(true);
      try {
        if (isAdmin) {
          const res = await fetch("/api/metrics?type=admin");
          const json = await res.json();
          setAdminData(json);
        } else {
          const res = await fetch("/api/metrics?mode=own");
          const json = await res.json();
          setPersonalData(json);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [role, isAdmin]);

  return (
    <div className="space-y-6 pt-4 pb-28">
      <div>
        <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          {roleLabels[role] || role}
        </span>
        <h1 className="font-headline text-2xl font-bold text-on-surface">
          Dashboard
        </h1>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && isAdmin && adminData && <AdminView data={adminData} />}
      {!loading && !isAdmin && personalData && <PersonalView data={personalData} />}
    </div>
  );
}

function AdminView({ data }: { data: AdminMetrics }) {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={DoorOpen}
          label="Puertas Tocadas"
          color="text-orange-400"
          today={data.doorsKnockedToday}
          week={data.doorsKnockedWeek}
          month={data.doorsKnockedMonth}
        />
        <MetricCard
          icon={UserPlus}
          label="Leads Creados"
          color="text-blue-400"
          today={data.leadsCreatedToday}
          week={data.leadsCreatedWeek}
          month={data.leadsCreatedMonth}
        />
        <MetricCard
          icon={CheckCircle}
          label="Proyectos Cerrados"
          color="text-green-400"
          today={data.projectsClosedToday}
          week={data.projectsClosedWeek}
          month={data.projectsClosedMonth}
        />
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-5 h-5 text-yellow-400" />
            <span className="text-xs text-on-surface-variant uppercase tracking-wide">
              Facturacion
            </span>
          </div>
          <div className="text-2xl font-bold text-yellow-400 mt-1">
            {formatCurrency(data.totalBilling)}
          </div>
          <span className="text-xs text-on-surface-variant mt-2">
            Total proyectos cerrados
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Top 3 Closers
          </h3>
          {data.topClosers.length === 0 && (
            <p className="text-sm text-on-surface-variant">Sin datos</p>
          )}
          <div className="space-y-2">
            {data.topClosers.map((c, i) => {
              const [first, last] = splitName(c.name);
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-1.5 border-b border-glass-border last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface-variant w-5">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-on-surface">
                      {first} {last && <span className="font-bold">{last}</span>}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-green-400">{c.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
            <DoorOpen className="w-4 h-4 text-orange-400" />
            Top 3 Trainees / Setters
          </h3>
          {data.topSetters.length === 0 && (
            <p className="text-sm text-on-surface-variant">Sin datos</p>
          )}
          <div className="space-y-2">
            {data.topSetters.map((s, i) => {
              const [first, last] = splitName(s.name);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-1.5 border-b border-glass-border last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface-variant w-5">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-on-surface">
                      {first} {last && <span className="font-bold">{last}</span>}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-orange-400">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function PersonalView({ data }: { data: PersonalMetrics }) {
  return (
    <div className="space-y-4">
      <div className="glass-panel p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <DoorOpen className="w-5 h-5 text-orange-400" />
          <h3 className="text-sm font-semibold text-on-surface">Mis Puertas Tocadas</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PeriodStat label="Hoy" value={data.doorsKnockedToday} color="text-orange-400" />
          <PeriodStat label="Esta Semana" value={data.doorsKnockedWeek} color="text-orange-400" />
          <PeriodStat label="Este Mes" value={data.doorsKnockedMonth} color="text-orange-400" />
          <PeriodStat label="Total" value={data.doorsKnockedTotal} color="text-orange-400" />
        </div>
      </div>

      <div className="glass-panel p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-on-surface">Mis Leads Generados</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PeriodStat label="Hoy" value={data.leadsGeneratedToday} color="text-blue-400" />
          <PeriodStat label="Esta Semana" value={data.leadsGeneratedWeek} color="text-blue-400" />
          <PeriodStat label="Este Mes" value={data.leadsGeneratedMonth} color="text-blue-400" />
          <PeriodStat label="Total" value={data.leadsGeneratedTotal} color="text-blue-400" />
        </div>
      </div>

      <div className="glass-panel p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <h3 className="text-sm font-semibold text-on-surface">Mis Proyectos Cerrados</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PeriodStat label="Hoy" value={data.projectsClosedToday} color="text-green-400" />
          <PeriodStat label="Esta Semana" value={data.projectsClosedWeek} color="text-green-400" />
          <PeriodStat label="Este Mes" value={data.projectsClosedMonth} color="text-green-400" />
          <PeriodStat label="Total" value={data.projectsClosedTotal} color="text-green-400" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  color,
  today,
  week,
  month,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  today: number;
  week: number;
  month: number;
}) {
  return (
    <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-xs text-on-surface-variant uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className={`text-3xl font-bold ${color} mt-1`}>{today}</div>
      <div className="flex gap-4 mt-2">
        <span className="text-xs text-on-surface-variant">
          <span className="font-medium text-on-surface">{week}</span> sem.
        </span>
        <span className="text-xs text-on-surface-variant">
          <span className="font-medium text-on-surface">{month}</span> mes
        </span>
      </div>
    </div>
  );
}

function PeriodStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-on-surface-variant mt-0.5">{label}</div>
    </div>
  );
}
