"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Bell, BarChart3, TrendingUp, Package } from "lucide-react";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { CreateLeadModal } from "@/components/leads/CreateLeadModal";
import { Button } from "@/components/ui/Button";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  CLOSER: "Closer",
  SETTER: "Trainee",
  SETTER_JR: "Setter",
  PARTNER: "Partner",
};

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

export default function DashboardPage() {
  const { data: session } = useSession();
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const role = session?.user?.role || "";
  const isAdmin = role === "ADMIN";
  const isSetter = role === "SETTER";
  const isSetterJr = role === "SETTER_JR";
  const isPartner = role === "PARTNER";
  const canCreateLead = role === "SETTER" || role === "CLOSER" || role === "ADMIN" || role === "SETTER_JR";

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              {roleLabels[role] || role}
            </span>
            <h1 className="font-headline text-2xl font-bold text-on-surface">
              Pipeline
            </h1>
          </div>
          {canCreateLead && (
            <Button
              onClick={() => setShowCreateLeadModal(true)}
              variant="primary"
            >
              <Plus className="w-5 h-5 mr-2" />
              Crear Lead
            </Button>
          )}
        </div>
      </section>

      {isPartner ? (
        <KanbanBoard isAdmin={false} isSetterJr={false} isSetter={false} isPartner={true} key={refreshKey} />
      ) : (
        <KanbanBoard
          key={refreshKey}
          isAdmin={isAdmin}
          isSetterJr={isSetterJr}
          isSetter={isSetter}
        />
      )}

      {!isPartner && (
        <DashboardNotifications />
      )}

      {!isPartner && !isSetterJr && (
        <DashboardCharts isAdmin={isAdmin} />
      )}

      <CreateLeadModal
        isOpen={showCreateLeadModal}
        onClose={() => setShowCreateLeadModal(false)}
        onSuccess={() => {
          setRefreshKey((k) => k + 1);
          setShowCreateLeadModal(false);
        }}
      />
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

function DashboardNotifications() {
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
        Notificaciones
      </h2>
      <div className="glass-panel rounded-2xl divide-y divide-outline-variant/20">
        {notifications.map((n) => (
          <div key={n.id} className="p-4 flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                n.link ? "bg-primary/10" : "bg-orange-100"
              }`}
            >
              <Bell
                className={`w-4 h-4 ${n.link ? "text-primary" : "text-orange-500"}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-on-surface">{n.title}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{n.body}</p>
              <p className="text-[10px] text-on-surface-variant/60 mt-1">{timeAgo(n.createdAt)}</p>
            </div>
          </div>
        ))}
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

function DashboardCharts({ isAdmin }: { isAdmin: boolean }) {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = isAdmin
      ? "/api/metrics/charts?period=7d"
      : "/api/metrics/charts?period=7d";
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.labels) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAdmin]);

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
        Estadisticas
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel rounded-2xl p-4">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary" />
            Leads Generados (ultimos 7 dias)
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
            Tipos de Proyecto
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
