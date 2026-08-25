"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MapPin,
  User,
  GripVertical,
  ArrowLeftRight,
  X,
  Clock,
  Undo2,
  CheckCircle,
} from "lucide-react";
import { useLocale } from "@/lib/locale-context";

const COLS = [
  {
    stage: "IN_PROGRESS",
    title: "Leads",
    color: "bg-blue-500",
    colorBar: "bg-blue-500",
  },
  {
    stage: "PROPOSAL_ACCEPTED",
    title: "Leads Potenciales",
    color: "bg-amber-500",
    colorBar: "bg-amber-500",
  },
  {
    stage: "PROJECT",
    title: "En Proyecto",
    color: "bg-purple-500",
    colorBar: "bg-purple-500",
  },
  {
    stage: "CLOSED",
    title: "Proyecto Cerrado",
    color: "bg-green-500",
    colorBar: "bg-green-500",
  },
  {
    stage: "CANCELLED",
    title: "Proyecto Cancelado",
    color: "bg-red-500",
    colorBar: "bg-red-500",
  },
] as const;

const STAGE_SET = new Set<string>(COLS.map((c) => c.stage));

interface KanbanVisit {
  id: number;
  stage: string;
  createdAt: string;
  assignedAt?: string | null;
  contractFields?: string | null;
  parcel: { id: string; address: string; ownerName: string | null };
  setter: { id: number; name: string };
  closer: { id: number; name: string } | null;
  projects: { projectType: { id: number; name: string } }[];
  projectDetails?: Record<string, unknown> | null;
  progress?: number;
}

interface TransferUser {
  id: number;
  name: string;
  role: string;
}

type GroupedVisits = Record<string, KanbanVisit[]>;

interface KanbanBoardProps {
  isAdmin: boolean;
  isSetterJr: boolean;
  isSetter: boolean;
  isPartner?: boolean;
}

export function KanbanBoard({
  isAdmin,
  isSetterJr,
  isSetter,
  isPartner,
}: KanbanBoardProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [data, setData] = useState<GroupedVisits>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVisit, setActiveVisit] = useState<KanbanVisit | null>(null);
  const overColumnRef = useRef<string | null>(null);
  const [transferOpen, setTransferOpen] = useState<number | null>(null);
  const [transferUsers, setTransferUsers] = useState<TransferUser[]>([]);

  const visitStageMap = new Map<number, string>();
  for (const [stage, visits] of Object.entries(data)) {
    for (const v of visits) {
      visitStageMap.set(v.id, stage);
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const [partnerFilter, setPartnerFilter] = useState({
    address: "",
    client: "",
  });
  const [projectTypeFilter, setProjectTypeFilter] = useState("");
  const [addressFilter, setAddressFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [userTypeFilter, setUserTypeFilter] = useState("");
  const [specificUserFilter, setSpecificUserFilter] = useState("");
  const [postCloseFilter, setPostCloseFilter] = useState("");
  const [allUsers, setAllUsers] = useState<TransferUser[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetch("/api/users/transferable")
        .then((r) => r.json())
        .then(setTransferUsers)
        .catch(() => {});
      fetch("/api/users/transferable?all=true")
        .then((r) => r.json())
        .then(setAllUsers)
        .catch(() => {});
    }
  }, [isAdmin]);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/visits/kanban?_t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Error al cargar los datos del tablero.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const moveCard = useCallback(
    async (visitId: number, targetStage: string) => {
      const sourceStage = visitStageMap.get(visitId);
      if (!sourceStage || sourceStage === targetStage) return;

      const visit = data[sourceStage]?.find((v) => v.id === visitId);
      if (!visit) return;

      setData((prev) => {
        const next = { ...prev };
        next[sourceStage] = (next[sourceStage] || []).filter(
          (v) => v.id !== visitId,
        );
        next[targetStage] = [
          { ...visit, stage: targetStage },
          ...(next[targetStage] || []),
        ];
        return next;
      });

      try {
        const res = await fetch(`/api/visits/${visitId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: targetStage }),
        });
        if (!res.ok) {
          throw new Error("Failed to update");
        }
        toast.success(
          `Lead movido a "${COLS.find((c) => c.stage === targetStage)?.title}"`,
        );
      } catch {
        toast.error("Error al mover el lead. Reintenta.");
        fetchData();
      }
    },
    [data, visitStageMap, fetchData],
  );

  function handleDragStart(event: DragStartEvent) {
    const visitId = event.active.id as number;
    for (const col of COLS) {
      const v = data[col.stage]?.find((v) => v.id === visitId);
      if (v) {
        setActiveVisit(v);
        break;
      }
    }
    overColumnRef.current = null;
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over) {
      overColumnRef.current = null;
      return;
    }
    if (STAGE_SET.has(over.id as string)) {
      overColumnRef.current = over.id as string;
    } else {
      const cardStage = visitStageMap.get(over.id as number);
      overColumnRef.current = cardStage || null;
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveVisit(null);
    const { active } = event;
    const visitId = active.id as number;
    const targetStage = overColumnRef.current;

    if (!targetStage) return;

    const sourceStage = visitStageMap.get(visitId);
    if (!sourceStage || sourceStage === targetStage) return;

    moveCard(visitId, targetStage);
    overColumnRef.current = null;
  }

  const handleTransfer = async (visitId: number, newUserId: number) => {
    try {
      const res = await fetch(`/api/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setterId: newUserId }),
      });
      if (!res.ok) throw new Error("Failed to transfer");
      const user = transferUsers.find((u) => u.id === newUserId);
      toast.success(`Lead transferido a ${user?.name || "usuario"}`);
      setTransferOpen(null);
      fetchData();
    } catch {
      toast.error("Error al transferir el lead");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-on-surface-variant">{error}</p>
        <button
          onClick={fetchData}
          className="text-primary font-medium hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const showOverlay = isSetterJr;

  const filterVisits = (visits: KanbanVisit[]) => {
    return visits.filter((v) => {
      const pt =
        v.projects?.map((p) => p.projectType.name.toLowerCase()).join(" ") ||
        "";
      const addr = v.parcel.address?.toLowerCase() || "";
      const client = (v.parcel.ownerName || "").toLowerCase();
      const matchesType =
        !projectTypeFilter || pt.includes(projectTypeFilter.toLowerCase());
      const matchesAddr =
        !addressFilter || addr.includes(addressFilter.toLowerCase());
      const matchesClient =
        !clientFilter || client.includes(clientFilter.toLowerCase());
      if (!matchesType || !matchesAddr || !matchesClient) return false;

      if (userTypeFilter) {
        if (userTypeFilter === "SETTER" && v.setter?.id) {
          const setterUser = allUsers.find((u) => u.id === v.setter.id);
          if (!setterUser || setterUser.role !== "SETTER") return false;
        } else if (userTypeFilter === "SETTER_JR" && v.setter?.id) {
          const setterUser = allUsers.find((u) => u.id === v.setter.id);
          if (!setterUser || setterUser.role !== "SETTER_JR") return false;
        } else if (userTypeFilter === "CLOSER" && v.closer?.id) {
          const closerUser = allUsers.find((u) => u.id === v.closer!.id);
          if (!closerUser || closerUser.role !== "CLOSER") return false;
        }
      }

      if (specificUserFilter) {
        const uid = parseInt(specificUserFilter);
        if (v.setter?.id !== uid && v.closer?.id !== uid) return false;
      }

      if (postCloseFilter) {
        let tag = "";
        try {
          if (v.contractFields) {
            const cf = JSON.parse(v.contractFields);
            tag = cf.postCloseTags || "";
          }
        } catch {
          /* */
        }
        if (tag !== postCloseFilter) return false;
      }

      return true;
    });
  };

  const clearFilters = () => {
    setActiveColumn(null);
    setProjectTypeFilter("");
    setAddressFilter("");
    setClientFilter("");
    setUserTypeFilter("");
    setSpecificUserFilter("");
    setPostCloseFilter("");
  };

  // Compute unique project types from loaded data
  const projectTypes = new Set<string>();
  Object.values(data).forEach((visits) => {
    visits.forEach((v) => {
      v.projects?.forEach((p) => projectTypes.add(p.projectType.name));
    });
  });
  const projectTypeOptions = Array.from(projectTypes).sort();

  if (isPartner) {
    const allVisits = Object.values(data).flat();
    const filtered = allVisits.filter((v) => {
      const addr = v.parcel.address?.toLowerCase() || "";
      const client = (v.parcel.ownerName || "").toLowerCase();
      const fa = partnerFilter.address.toLowerCase();
      const fc = partnerFilter.client.toLowerCase();
      return (!fa || addr.includes(fa)) && (!fc || client.includes(fc));
    });
    return (
      <div className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder={t.placeholders.filterAddress}
            value={partnerFilter.address}
            onChange={(e) =>
              setPartnerFilter((p) => ({ ...p, address: e.target.value }))
            }
            className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface flex-1 min-w-[200px]"
          />
          <input
            type="text"
            placeholder={t.placeholders.filterClient}
            value={partnerFilter.client}
            onChange={(e) =>
              setPartnerFilter((p) => ({ ...p, client: e.target.value }))
            }
            className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface flex-1 min-w-[200px]"
          />
        </div>
        <div className="glass-panel rounded-2xl border-t-4 border-t-primary">
          <div className="p-4 border-b border-outline-variant">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-on-surface">
                {t.chat.projects}
              </h3>
              <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {filtered.length}
              </span>
            </div>
          </div>
          <div className="p-3 space-y-2 max-h-[70vh] overflow-y-auto">
            {filtered.map((visit) => (
              <button
                key={visit.id}
                onClick={() => router.push(`/lead/${visit.id}`)}
                className="w-full text-left glass-panel p-4 rounded-xl hover:border-primary/40 transition-all cursor-pointer"
              >
                <p className="font-semibold text-sm text-on-surface">
                  {visit.parcel.ownerName || "Sin nombre"}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-on-surface-variant">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{visit.parcel.address}</span>
                </div>
                {visit.assignedAt && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-primary font-medium">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>
                      Asignado:{" "}
                      {new Date(visit.assignedAt).toLocaleString("es-ES", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                )}
                {visit.projects?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {visit.projects.map((p) => (
                      <span
                        key={p.projectType.id}
                        className="px-2 py-0.5 rounded-full bg-primary/5 text-primary text-[10px] font-medium"
                      >
                        {p.projectType.name}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center py-8 text-sm text-on-surface-variant">
                No tienes proyectos asignados.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const hasActiveFilters =
    projectTypeFilter ||
    addressFilter ||
    clientFilter ||
    activeColumn !== null ||
    userTypeFilter ||
    specificUserFilter ||
    postCloseFilter;

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
            Filtros
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {COLS.map((col) => {
            const isActive = activeColumn === col.stage;
            const dimmed = activeColumn !== null && !isActive;
            return (
              <button
                key={col.stage}
                onClick={() => setActiveColumn(isActive ? null : col.stage)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  dimmed
                    ? "bg-transparent text-on-surface-variant border-outline-variant opacity-40"
                    : isActive
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-transparent text-on-surface-variant border-outline-variant"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${col.colorBar}`} />
                  {col.title}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          <select
            value={projectTypeFilter}
            onChange={(e) => setProjectTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface flex-1 min-w-[160px]"
          >
            <option value="">Todos los proyectos</option>
            {projectTypeOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Dirección..."
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface flex-1 min-w-[160px]"
          />
          <input
            type="text"
            placeholder={t.placeholders.client}
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface flex-1 min-w-[160px]"
          />
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-3 mt-3">
            <select
              value={userTypeFilter}
              onChange={(e) => {
                setUserTypeFilter(e.target.value);
                setSpecificUserFilter("");
              }}
              className="h-9 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface flex-1 min-w-[140px]"
            >
              <option value="">{t.common.all}</option>
              <option value="SETTER">{t.roles.SETTER}</option>
              <option value="SETTER_JR">Setter</option>
              <option value="CLOSER">{t.roles.CLOSER}</option>
            </select>
            <select
              value={specificUserFilter}
              onChange={(e) => {
                setSpecificUserFilter(e.target.value);
                setUserTypeFilter("");
              }}
              className="h-9 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-sm text-on-surface flex-1 min-w-[160px]"
            >
              <option value="">Todos los usuarios</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        )}
        {activeColumn === "CLOSED" && (
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-on-surface-variant self-center mr-1">
              Estado:
            </span>
            {["En permisos", "Permisos aprobados", "PTO", "Finalizado"].map((tag) => {
              const isActive = postCloseFilter === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setPostCloseFilter(isActive ? "" : tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-transparent text-on-surface-variant border-outline-variant"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
            {postCloseFilter && (
              <button
                onClick={() => setPostCloseFilter("")}
                className="px-2 py-1 rounded-full text-xs text-primary hover:underline"
              >
                <X className="w-3 h-3 inline" />
              </button>
            )}
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
          {COLS.map((col, idx) => {
            if (activeColumn !== null && activeColumn !== col.stage)
              return null;
            const rawVisits = data[col.stage] || [];
            const visits = filterVisits(rawVisits);
            const isLeads = col.stage === "IN_PROGRESS";
            const restricted = showOverlay && !isLeads;

            return (
              <KanbanColumn
                key={col.stage}
                col={col}
                visits={visits}
                isAdmin={isAdmin}
                idx={idx}
                restricted={restricted}
                onCardClick={(visitId) => router.push(`/lead/${visitId}`)}
                transferOpen={transferOpen}
                setTransferOpen={setTransferOpen}
                transferUsers={transferUsers}
                onTransfer={handleTransfer}
                isTrainee={isSetter || isSetterJr}
              />
            );
          })}
        </div>
        <DragOverlay>
          {activeVisit ? <KanbanCardOverlay visit={activeVisit} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function KanbanColumn({
  col,
  visits,
  isAdmin,
  idx,
  restricted,
  onCardClick,
  transferOpen,
  setTransferOpen,
  transferUsers,
  onTransfer,
  isTrainee,
}: {
  col: (typeof COLS)[number];
  visits: KanbanVisit[];
  isAdmin: boolean;
  idx: number;
  restricted: boolean;
  onCardClick: (id: number) => void;
  transferOpen: number | null;
  setTransferOpen: (id: number | null) => void;
  transferUsers: TransferUser[];
  onTransfer: (visitId: number, newUserId: number) => void;
  isTrainee?: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: col.stage,
    disabled: !isAdmin,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 rounded-2xl transition-colors flex flex-col ${
        isOver && isAdmin
          ? "bg-primary/5 border-2 border-dashed border-primary"
          : "bg-surface-container-low border border-outline-variant"
      }`}
      style={{ animationDelay: `${idx * 0.1}s` }}
    >
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${col.colorBar}`} />
          <h3 className="font-headline text-sm font-bold text-on-surface">
            {col.title}
          </h3>
        </div>
        <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high rounded-full px-2 py-0.5">
          {visits.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 relative min-h-[120px]">
        {restricted && (
          <div className="absolute inset-0 z-10 glass-panel rounded-xl flex items-center justify-center mx-2 mb-2">
            <p className="text-xs text-on-surface-variant text-center px-4 font-medium">
              No tienes acceso a esta etapa
            </p>
          </div>
        )}

        {!restricted && visits.length === 0 && (
          <div className="flex items-center justify-center h-20">
            <p className="text-xs text-on-surface-variant">Sin leads</p>
          </div>
        )}

        {!restricted &&
          visits.map((visit) => (
            <KanbanCard
              key={visit.id}
              visit={visit}
              isAdmin={isAdmin}
              onClick={() => onCardClick(visit.id)}
              transferOpen={transferOpen}
              setTransferOpen={setTransferOpen}
              transferUsers={transferUsers}
              onTransfer={onTransfer}
              isTrainee={isTrainee}
            />
          ))}
      </div>
    </div>
  );
}

function KanbanCard({
  visit,
  isAdmin,
  onClick,
  transferOpen,
  setTransferOpen,
  transferUsers,
  onTransfer,
  isTrainee,
}: {
  visit: KanbanVisit;
  isAdmin: boolean;
  onClick: () => void;
  transferOpen: number | null;
  setTransferOpen: (id: number | null) => void;
  transferUsers: TransferUser[];
  onTransfer: (visitId: number, newUserId: number) => void;
  isTrainee?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: visit.id,
      data: { visit, sourceColumn: visit.stage },
      disabled: !isAdmin,
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 20 }
    : undefined;

  const isOpen = transferOpen === visit.id;
  const isBlockedForTrainee =
    isTrainee &&
    visit.stage !== "IN_PROGRESS" &&
    visit.closer != null &&
    visit.projects.some((p) =>
      p.projectType.name.toLowerCase().includes("panel solar"),
    );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-panel rounded-xl p-3 transition-all relative ${
        isDragging ? "opacity-50 shadow-lg ring-2 ring-primary" : ""
      } ${
        isBlockedForTrainee
          ? "opacity-60 cursor-not-allowed bg-surface-container"
          : "cursor-pointer hover:shadow-md"
      }`}
      onClick={(e) => {
        if (isBlockedForTrainee) {
          e.preventDefault();
          toast.info(
            "No puedes acceder a este proyecto porque ya fue asignado a un Closer.",
          );
          return;
        }
        onClick();
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-on-surface truncate">
            {visit.parcel.ownerName || visit.parcel.address}
          </p>
          <div className="flex items-center gap-1 mt-0.5 text-on-surface-variant">
            <MapPin className="w-3 h-3 shrink-0" />
            <p className="text-xs truncate">{visit.parcel.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isAdmin && (
            <div className="relative">
              <button
                className="p-1 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant"
                onClick={(e) => {
                  e.stopPropagation();
                  setTransferOpen(isOpen ? null : visit.id);
                }}
                title="Transferir"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
              {isOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30 w-48 max-h-48 overflow-y-auto">
                  <div className="p-1">
                    {transferUsers.map((user) => (
                      <button
                        key={user.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTransfer(visit.id, user.id);
                        }}
                      >
                        <span>{user.name}</span>
                        <span className="text-xs text-gray-400 ml-auto">
                          {user.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {isAdmin && (
            <button
              {...attributes}
              {...listeners}
              className="p-1 rounded-lg hover:bg-surface-container-high transition-colors shrink-0 text-on-surface-variant cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 text-xs text-on-surface-variant">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span className="truncate max-w-[80px]">
            {visit.setter?.name || "—"}
          </span>
        </div>
        <span className="text-outline-variant">|</span>
        <span className="truncate max-w-[100px]">
          {visit.createdAt
            ? new Date(visit.createdAt).toLocaleDateString()
            : "—"}
        </span>
      </div>

      {visit.stage === "IN_PROGRESS" &&
        visit.createdAt &&
        (() => {
          const daysLeft = Math.max(
            0,
            30 -
              Math.floor(
                (Date.now() - new Date(visit.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
          );
          return (
            <p
              className={`text-xs mt-1 font-medium ${daysLeft <= 5 ? "text-red-500" : "text-orange-500"}`}
            >
              Expira en {daysLeft} días
            </p>
          );
        })()}

      {visit.projects.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {visit.projects.map((p) => (
            <span
              key={p.projectType.id}
              className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
            >
              {p.projectType.name}
            </span>
          ))}
        </div>
      )}

      {visit.stage === "PROJECT" &&
        (() => {
          const parsedCF = (() => {
            if (!visit.contractFields) return {};
            try {
              return JSON.parse(visit.contractFields);
            } catch {
              return {};
            }
          })();
          const isCloseRequested = !!parsedCF.closeRequestedAt;
          const isReturned = !isCloseRequested && !!parsedCF.returnedAt;

          if (isCloseRequested) {
            return (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold mt-2">
                <Clock className="w-3 h-3" />
                <span>Cierre Solicitado</span>
              </div>
            );
          }
          if (isReturned) {
            return (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-[10px] font-semibold mt-2">
                <Undo2 className="w-3 h-3" />
                <span>Proyecto devuelto</span>
              </div>
            );
          }
          return null;
        })()}

      {visit.stage === "PROJECT" &&
        visit.progress !== undefined &&
        (() => {
          const pct = visit.progress ?? 0;
          return (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] text-on-surface-variant">
                  Progreso
                </span>
                <span className="text-[10px] font-semibold text-on-surface">
                  {pct}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    pct === 100
                      ? "bg-primary"
                      : pct >= 50
                        ? "bg-secondary"
                        : "bg-tertiary"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })()}

      {visit.stage === "CLOSED" &&
        (() => {
          const parsedCF = (() => {
            if (!visit.contractFields) return {};
            try {
              return JSON.parse(visit.contractFields);
            } catch {
              return {};
            }
          })();
          const tag = parsedCF.postCloseTags;
          if (!tag || typeof tag !== "string") return null;
          const tagColor =
            tag === "En permisos"
              ? "#f59e0b"
              : tag === "Permisos aprobados"
                ? "#3b82f6"
                : tag === "PTO"
                    ? "#a855f7"
                    : tag === "Finalizado"
                      ? "#22c55e"
                      : "#6b7280";
          return (
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-2"
              style={{
                backgroundColor: tagColor + "15",
                color: tagColor,
                border: `1px solid ${tagColor}30`,
              }}
            >
              <CheckCircle className="w-3 h-3" />
              <span>{tag}</span>
            </div>
          );
        })()}
    </div>
  );
}

function KanbanCardOverlay({ visit }: { visit: KanbanVisit }) {
  return (
    <div className="glass-panel rounded-xl p-3 shadow-xl ring-2 ring-primary w-72">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-on-surface truncate">
            {visit.parcel.ownerName || visit.parcel.address}
          </p>
          <div className="flex items-center gap-1 mt-0.5 text-on-surface-variant">
            <MapPin className="w-3 h-3 shrink-0" />
            <p className="text-xs truncate">{visit.parcel.address}</p>
          </div>
        </div>
        <GripVertical className="w-4 h-4 text-on-surface-variant" />
      </div>

      <div className="flex items-center gap-2 mt-2 text-xs text-on-surface-variant">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span className="truncate max-w-[80px]">
            {visit.setter?.name || "—"}
          </span>
        </div>
        {visit.closer && (
          <>
            <span className="text-outline-variant">|</span>
            <span className="truncate max-w-[80px] text-primary font-medium">
              {visit.closer.name}
            </span>
          </>
        )}
      </div>

      {visit.projects.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {visit.projects.map((p) => (
            <span
              key={p.projectType.id}
              className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
            >
              {p.projectType.name}
            </span>
          ))}
        </div>
      )}

      {visit.stage === "PROJECT" &&
        (() => {
          const parsedCF = (() => {
            if (!visit.contractFields) return {};
            try {
              return JSON.parse(visit.contractFields);
            } catch {
              return {};
            }
          })();
          const isCloseRequested = !!parsedCF.closeRequestedAt;
          const isReturned = !isCloseRequested && !!parsedCF.returnedAt;

          if (isCloseRequested) {
            return (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold mt-2">
                <Clock className="w-3 h-3" />
                <span>Cierre Solicitado</span>
              </div>
            );
          }
          if (isReturned) {
            return (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-[10px] font-semibold mt-2">
                <Undo2 className="w-3 h-3" />
                <span>Proyecto devuelto</span>
              </div>
            );
          }
          return null;
        })()}
    </div>
  );
}
