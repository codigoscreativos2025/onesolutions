"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DoorOpen, UserPlus, CheckCircle, DollarSign, Bell, BarChart3, TrendingUp, Package } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

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
  doorsKnockedTotal: number;
  leadsCreatedToday: number;
  leadsCreatedWeek: number;
  leadsCreatedMonth: number;
  leadsCreatedTotal: number;
  projectsClosedToday: number;
  projectsClosedWeek: number;
  projectsClosedMonth: number;
  projectsClosedTotal: number;
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

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days}d`;
  return date.toLocaleDateString();
}

const COLORS = ["#f48221", "#3b82f6", "#22c55e", "#eab308", "#8b5cf6", "#ef4444"];

export default function MetricsPage() {
  const { data: session } = useSession();
  const { t } = useLocale();
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

      <NotificationsSection t={t} />

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && !isAdmin && personalData && role !== "PARTNER" && (
        <PersonalView data={personalData} t={t} />
      )}
      
      {!loading && isAdmin && adminData && (
        <AdminView data={adminData} t={t} />
      )}

      <ChartsSection isAdmin={isAdmin} t={t} />
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
      <div className={`text-2xl font-bold mt-1 ${color}`}>{today}</div>
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

function AdminView({ data, t }: { data: AdminMetrics, t: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={DoorOpen}
          label={t.metrics.globalDoorsKnocked}
          color="text-orange-400"
          today={data.doorsKnockedToday}
          week={data.doorsKnockedWeek}
          month={data.doorsKnockedMonth}
        />
        <MetricCard
          icon={UserPlus}
          label={t.metrics.globalLeads}
          color="text-blue-400"
          today={data.leadsCreatedToday}
          week={data.leadsCreatedWeek}
          month={data.leadsCreatedMonth}
        />
        <MetricCard
          icon={CheckCircle}
          label={t.metrics.globalProjects}
          color="text-green-400"
          today={data.projectsClosedToday}
          week={data.projectsClosedWeek}
          month={data.projectsClosedMonth}
        />
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-5 h-5 text-yellow-400" />
            <span className="text-xs text-on-surface-variant uppercase tracking-wide">
              {t.metrics.globalBilling}
            </span>
          </div>
          <div className="text-2xl font-bold text-yellow-400 mt-1">
            {formatCurrency(data.totalBilling)}
          </div>
          <span className="text-xs text-on-surface-variant mt-2">
            {t.metrics.totalProjectsClosed}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            {t.metrics.top3Closers}
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
            {t.metrics.top3Setters}
          </h3>
          {data.topSetters.length === 0 && (
            <p className="text-sm text-on-surface-variant">Sin datos</p>
          )}
          <div className="space-y-2">
            {data.topSetters.map((c, i) => {
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
                  <span className="text-sm font-bold text-orange-400">{c.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalView({ data, t }: { data: PersonalMetrics, t: any }) {
  return (
    <div className="space-y-4">
      <div className="glass-panel p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <DoorOpen className="w-5 h-5 text-orange-400" />
          <h3 className="text-sm font-semibold text-on-surface">
            {t.metrics.myDoorsKnocked}
          </h3>
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
          <h3 className="text-sm font-semibold text-on-surface">
            {t.metrics.myLeads}
          </h3>
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
          <h3 className="text-sm font-semibold text-on-surface">
            {t.metrics.myProjects}
          </h3>
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

interface Notification {
  id: number;
  title: string;
  body: string;
  link: string | null;
  createdAt: string;
  isRead: boolean;
}

function NotificationsSection({ t }: { t: any }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notifications.length === 0) return null;

  return (
    <section>
      <h2 className="font-headline text-lg font-bold text-on-surface mb-3 flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" />
        {t.metrics.feed}
      </h2>
      <div className="glass-panel rounded-2xl divide-y divide-outline-variant/20">
        {notifications.map((n) => {
          const isTemplate = n.title.startsWith("[TEMPLATE]");
          const displayTitle = isTemplate ? n.title.replace("[TEMPLATE]", "").trim() : n.title;

          return (
            <div 
              key={n.id} 
              className={`p-4 flex items-start gap-3 transition-colors ${
                isTemplate ? "border-l-4 border-l-yellow-400 bg-yellow-500/5" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isTemplate ? "bg-yellow-100 dark:bg-yellow-500/20" : n.link ? "bg-primary/10" : "bg-orange-100 dark:bg-orange-500/20"
                }`}
              >
                <Bell
                  className={`w-4 h-4 ${isTemplate ? "text-yellow-500" : n.link ? "text-primary" : "text-orange-500"}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface">{displayTitle}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{n.body}</p>
                <p className="text-[10px] text-on-surface-variant/60 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface ChartData {
  labels: string[];
  leadsGenerated: number[];
  doorsKnocked: number[];
  projectsClosed: number[];
  projectTypes: { name: string; count: number }[];
}

function ChartsSection({ isAdmin, t }: { isAdmin: boolean, t: any }) {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = "/api/metrics/charts?period=7d";
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.labels) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const maxLeads = Math.max(...data.leadsGenerated, 1);

  const totalProjects = data.projectTypes.reduce((sum, pt) => sum + pt.count, 0) || 1;

  return (
    <section>
      <h2 className="font-headline text-lg font-bold text-on-surface mb-3 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        {t.metrics.statistics}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel rounded-2xl p-4">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary" />
            {t.metrics.leadsLast7Days}
          </h3>
          <div className="flex items-end gap-2 h-40">
            {data.labels.map((label, i) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-on-surface">
                  {data.leadsGenerated[i]}
                </span>
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${(data.leadsGenerated[i] / maxLeads) * 120}px`,
                    backgroundColor: COLORS[i % COLORS.length],
                    minHeight: data.leadsGenerated[i] > 0 ? "4px" : "2px",
                  }}
                />
                <span className="text-[10px] text-on-surface-variant">{label}</span>
              </div>
            ))}
            {data.labels.length === 0 && (
              <div className="flex-1 flex items-center justify-center h-full">
                <p className="text-sm text-on-surface-variant">Sin datos</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-primary" />
            {t.metrics.projectTypes}
          </h3>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {(() => {
                  let cumulativePercent = 0;
                  return data.projectTypes.map((pt, i) => {
                    const percent = (pt.count / totalProjects) * 100;
                    const startAngle = (cumulativePercent / 100) * 360;
                    const endAngle = ((cumulativePercent + percent) / 100) * 360;
                    cumulativePercent += percent;

                    const x1 = 50 + 40 * Math.cos((Math.PI * startAngle) / 180);
                    const y1 = 50 + 40 * Math.sin((Math.PI * startAngle) / 180);
                    const x2 = 50 + 40 * Math.cos((Math.PI * endAngle) / 180);
                    const y2 = 50 + 40 * Math.sin((Math.PI * endAngle) / 180);
                    const largeArc = percent > 50 ? 1 : 0;

                    if (percent === 0) return null;

                    return (
                      <path
                        key={pt.name}
                        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={COLORS[i % COLORS.length]}
                      />
                    );
                  });
                })()}
                <circle cx="50" cy="50" r="22" fill="white" className="dark:fill-gray-800" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-on-surface">{totalProjects}</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {data.projectTypes.map((pt, i) => (
                <div key={pt.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-xs text-on-surface truncate flex-1">{pt.name}</span>
                  <span className="text-xs font-bold text-on-surface">{pt.count}</span>
                </div>
              ))}
              {data.projectTypes.length === 0 && (
                <p className="text-sm text-on-surface-variant">Sin datos</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
