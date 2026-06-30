"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  DoorOpen,
  PersonStanding,
  Handshake,
  MessageSquareWarning,
  Target,
  TrendingUp,
  Calendar,
  Settings,
  Loader2,
  Package,
} from "lucide-react";

interface Metrics {
  doorsKnocked: number;
  prospectsGenerated: number;
  projectsClosed: number;
  objectionsCount: number;
  appointments: number;
  weeklyGoal: {
    id: number;
    doorsGoal: number;
    prospectsGoal: number;
    projectsGoal: number;
  } | null;
  monthlyGoal: {
    id: number;
    doorsGoal: number;
    prospectsGoal: number;
    projectsGoal: number;
  } | null;
  topDoorsKnocked: { id: number; name: string; count: number }[];
  topProspects: { id: number; name: string; count: number }[];
  topProjectsClosed: { id: number; name: string; count: number }[];
  topObjections: { id: number; name: string; color: string; count: number }[];
  projectMetrics: { id: number; name: string; count: number }[];
}

export default function AdminMetricsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDetail, setActiveDetail] = useState<string | null>(null);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [goalPeriod, setGoalPeriod] = useState("monthly");
  const [goalDoors, setGoalDoors] = useState(0);
  const [goalProspects, setGoalProspects] = useState(0);
  const [goalProjects, setGoalProjects] = useState(0);
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchMetrics();
  }, [session, router]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/metrics");
      const data = await res.json();
      setMetrics(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGoal(true);

    const now = new Date();
    let startDate, endDate;

    if (goalPeriod === "weekly") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    await fetch("/api/admin/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        period: goalPeriod,
        doorsGoal: goalDoors,
        prospectsGoal: goalProspects,
        projectsGoal: goalProjects,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    });

    setSavingGoal(false);
    setIsGoalsModalOpen(false);
    fetchMetrics();
  };

  const openGoalsModal = () => {
    if (metrics?.monthlyGoal) {
      setGoalPeriod("monthly");
      setGoalDoors(metrics.monthlyGoal.doorsGoal);
      setGoalProspects(metrics.monthlyGoal.prospectsGoal);
      setGoalProjects(metrics.monthlyGoal.projectsGoal);
    } else if (metrics?.weeklyGoal) {
      setGoalPeriod("weekly");
      setGoalDoors(metrics.weeklyGoal.doorsGoal);
      setGoalProspects(metrics.weeklyGoal.prospectsGoal);
      setGoalProjects(metrics.weeklyGoal.projectsGoal);
    }
    setIsGoalsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const monthlyGoal = metrics?.monthlyGoal;
  const weeklyGoal = metrics?.weeklyGoal;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Métricas del Negocio
          </h1>
          <p className="text-on-surface-variant">
            Rendimiento general y seguimiento de metas
          </p>
        </div>
        <Button onClick={openGoalsModal}>
          <Settings className="w-5 h-5 mr-2" />
          Configurar Metas
        </Button>
      </div>

      {/* Dashboard de Metas */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-primary" />
            <h2 className="font-headline text-lg font-bold text-on-surface">
              Metas del Mes
            </h2>
          </div>
          {monthlyGoal && (
            <span className="text-xs text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
              Meta Mensual
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GoalProgress
            label="Puertas Tocadas"
            current={metrics?.doorsKnocked || 0}
            goal={monthlyGoal?.doorsGoal || 0}
            color="primary"
          />
          <GoalProgress
            label="Prospectos Generados"
            current={metrics?.prospectsGenerated || 0}
            goal={monthlyGoal?.prospectsGoal || 0}
            color="secondary"
          />
          <GoalProgress
            label="Proyectos Cerrados"
            current={metrics?.projectsClosed || 0}
            goal={monthlyGoal?.projectsGoal || 0}
            color="primary"
          />
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Puertas Tocadas"
          value={metrics?.doorsKnocked || 0}
          icon={DoorOpen}
          onClick={() => setActiveDetail("doors")}
          clickable
        />
        <MetricCard
          title="Prospectos Generados"
          value={metrics?.prospectsGenerated || 0}
          icon={PersonStanding}
          onClick={() => setActiveDetail("prospects")}
          clickable
        />
        <MetricCard
          title="Proyectos Cerrados"
          value={metrics?.projectsClosed || 0}
          icon={Handshake}
          onClick={() => setActiveDetail("projects")}
          clickable
        />
        <MetricCard
          title="Objeciones Registradas"
          value={metrics?.objectionsCount || 0}
          icon={MessageSquareWarning}
          onClick={() => setActiveDetail("objections")}
          clickable
        />
      </div>

      {/* Tipos de Proyecto */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-6 h-6 text-primary" />
          <h2 className="font-headline text-lg font-bold text-on-surface">
            Proyectos por Tipo
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics?.projectMetrics.slice(0, 8).map((pm) => (
            <div
              key={pm.id}
              className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30"
            >
              <p className="text-xs text-on-surface-variant truncate">{pm.name}</p>
              <p className="font-bold text-lg text-on-surface">{pm.count}</p>
            </div>
          ))}
          {(!metrics?.projectMetrics || metrics.projectMetrics.length === 0) && (
            <p className="text-on-surface-variant col-span-4 text-center py-4">
              No hay proyectos registrados aún
            </p>
          )}
        </div>
      </div>

      {/* Semana actual */}
      {weeklyGoal && (
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-secondary" />
            <h2 className="font-headline text-lg font-bold text-on-surface">
              Meta Semanal
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GoalProgress
              label="Puertas Tocadas"
              current={metrics?.doorsKnocked || 0}
              goal={weeklyGoal.doorsGoal}
              color="secondary"
            />
            <GoalProgress
              label="Prospectos"
              current={metrics?.prospectsGenerated || 0}
              goal={weeklyGoal.prospectsGoal}
              color="secondary"
            />
            <GoalProgress
              label="Proyectos"
              current={metrics?.projectsClosed || 0}
              goal={weeklyGoal.projectsGoal}
              color="secondary"
            />
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      <Modal
        isOpen={!!activeDetail}
        onClose={() => setActiveDetail(null)}
        title={
          activeDetail === "doors"
            ? "Top Puertas Tocadas"
            : activeDetail === "prospects"
            ? "Top Prospectos Generados"
            : activeDetail === "projects"
            ? "Top Proyectos Cerrados"
            : "Objeciones Más Comunes"
        }
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activeDetail === "doors" && (
            <>
              {metrics?.topDoorsKnocked.map((item, idx) => (
                <RankingItem key={item.id} position={idx + 1} name={item.name} count={item.count} label="puertas" />
              ))}
              {(!metrics?.topDoorsKnocked || metrics.topDoorsKnocked.length === 0) && (
                <p className="text-center text-on-surface-variant py-4">Sin datos</p>
              )}
            </>
          )}
          {activeDetail === "prospects" && (
            <>
              {metrics?.topProspects.map((item, idx) => (
                <RankingItem key={item.id} position={idx + 1} name={item.name} count={item.count} label="prospectos" />
              ))}
              {(!metrics?.topProspects || metrics.topProspects.length === 0) && (
                <p className="text-center text-on-surface-variant py-4">Sin datos</p>
              )}
            </>
          )}
          {activeDetail === "projects" && (
            <>
              {metrics?.topProjectsClosed.map((item, idx) => (
                <RankingItem key={item.id} position={idx + 1} name={item.name} count={item.count} label="proyectos" />
              ))}
              {(!metrics?.topProjectsClosed || metrics.topProjectsClosed.length === 0) && (
                <p className="text-center text-on-surface-variant py-4">Sin datos</p>
              )}
            </>
          )}
          {activeDetail === "objections" && (
            <>
              {metrics?.topObjections.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-on-surface-variant w-6">#{idx + 1}</span>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-on-surface">{item.name}</span>
                  </div>
                  <span className="font-bold text-on-surface">{item.count}</span>
                </div>
              ))}
              {(!metrics?.topObjections || metrics.topObjections.length === 0) && (
                <p className="text-center text-on-surface-variant py-4">Sin objeciones registradas</p>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Modal de Metas */}
      <Modal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        title="Configurar Metas"
      >
        <form onSubmit={handleSaveGoal} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Período
            </label>
            <select
              value={goalPeriod}
              onChange={(e) => setGoalPeriod(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface mt-1"
            >
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Puertas
              </label>
              <input
                type="number"
                value={goalDoors}
                onChange={(e) => setGoalDoors(parseInt(e.target.value) || 0)}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Prospectos
              </label>
              <input
                type="number"
                value={goalProspects}
                onChange={(e) => setGoalProspects(parseInt(e.target.value) || 0)}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Proyectos
              </label>
              <input
                type="number"
                value={goalProjects}
                onChange={(e) => setGoalProjects(parseInt(e.target.value) || 0)}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface mt-1"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsGoalsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" isLoading={savingGoal}>
              Guardar Metas
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  onClick,
  clickable,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  onClick?: () => void;
  clickable?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`glass-panel p-5 rounded-2xl flex flex-col justify-between min-h-[130px] text-left w-full ${
        clickable ? "cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all" : ""
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          <Icon className="w-5 h-5" />
        </div>
        {clickable && <TrendingUp className="w-4 h-4 text-on-surface-variant" />}
      </div>
      <div className="mt-4">
        <h3 className="text-on-surface-variant text-xs uppercase tracking-wider font-semibold">
          {title}
        </h3>
        <p className="font-display text-3xl font-bold text-on-surface mt-1">
          {value}
        </p>
      </div>
    </button>
  );
}

function GoalProgress({
  label,
  current,
  goal,
  color,
}: {
  label: string;
  current: number;
  goal: number;
  color: "primary" | "secondary";
}) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const isComplete = percentage >= 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-on-surface">{label}</span>
        <span className={`text-sm font-bold ${isComplete ? "text-primary" : "text-on-surface-variant"}`}>
          {current} / {goal}
        </span>
      </div>
      <div className="h-3 bg-surface-container-highest rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            color === "primary" ? "bg-primary" : "bg-secondary"
          } ${isComplete ? "opacity-100" : "opacity-80"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-on-surface-variant mt-1">
        {percentage.toFixed(0)}% completado
      </p>
    </div>
  );
}

function RankingItem({
  position,
  name,
  count,
  label,
}: {
  position: number;
  name: string;
  count: number;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low">
      <div className="flex items-center gap-3">
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            position === 1
              ? "bg-primary text-on-primary"
              : position === 2
              ? "bg-secondary text-on-secondary"
              : position === 3
              ? "bg-tertiary text-on-tertiary"
              : "bg-surface-container-highest text-on-surface-variant"
          }`}
        >
          {position}
        </span>
        <span className="font-medium text-on-surface">{name}</span>
      </div>
      <div className="text-right">
        <span className="font-bold text-on-surface">{count}</span>
        <span className="text-xs text-on-surface-variant ml-1">{label}</span>
      </div>
    </div>
  );
}
