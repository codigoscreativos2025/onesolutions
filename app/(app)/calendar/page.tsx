"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";
import {
  Loader2,
  Calendar as CalendarIcon,
  Eye,
  MapPin,
  RefreshCw,
  LayoutGrid,
  List,
} from "lucide-react";
import { VisualCalendar } from "@/components/calendar/VisualCalendar";
import { ViewProjectModal } from "@/components/calendar/ViewProjectModal";
import { toast } from "sonner";

interface CalendarVisit {
  id: number;
  scheduledAt: string;
  stage: string;
  parcel: { id: string; address: string };
  setter: { id: number; name: string };
  closer?: { id: number; name: string } | null;
  projects?: { projectType: { id: number; name: string } }[];
  bill?: { clientName: string | null } | null;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [visits, setVisits] = useState<CalendarVisit[]>([]);
  const [setterAppointments, setSetterAppointments] = useState<CalendarVisit[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isViewProjectModalOpen, setIsViewProjectModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<CalendarVisit | null>(null);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);

  const [reassignReason, setReassignReason] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";
  const isSetter = session?.user?.role === "SETTER";

  useEffect(() => {
    fetchData();
  }, [selectedUserId, session, router]);

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(
      data.filter(
        (u: AdminUser) => u.role === "SETTER" || u.role === "CLOSER"
      )
    );
  };

  const fetchVisits = async () => {
    let url = "/api/visits/details?filter=scheduled";
    if (selectedUserId) {
      url += `&userId=${selectedUserId}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    setVisits(data);
  };

  const fetchData = async () => {
    try {
      const promises: Promise<void>[] = [fetchVisits()];

      if (isAdmin) {
        promises.push(fetchUsers());
      }

      if (isSetter) {
        promises.push(
          (async () => {
            const res = await fetch("/api/appointments");
            const data = await res.json();
            const mapped: CalendarVisit[] = (data || [])
              .filter(
                (apt: { slot: unknown; stage: string }) =>
                  !apt.slot && apt.stage !== "CLOSED"
              )
              .map(
                (apt: {
                  id: number;
                  parcel: { id: string; address: string };
                  setter: { id: number; name: string };
                  slot?: { startAt: string; endAt: string };
                  projects?: { projectType: { id: number; name: string } }[];
                  scheduledAt?: string;
                  stage?: string;
                  closer?: { id: number; name: string } | null;
                  bill?: { clientName: string | null } | null;
                }) => ({
                  id: apt.id,
                  scheduledAt: apt.scheduledAt || apt.slot?.startAt || new Date().toISOString(),
                  stage: apt.stage || "IN_PROGRESS",
                  parcel: apt.parcel,
                  setter: apt.setter,
                  closer: apt.closer || null,
                  projects: apt.projects,
                  bill: apt.bill || null,
                })
              );
            setSetterAppointments(mapped);
          })()
        );
      }

      await Promise.all(promises);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVisitClick = (visit: CalendarVisit) => {
    setSelectedVisit(visit);
    setSelectedVisitId(visit.id);
    setIsActionModalOpen(true);
  };

  const handleViewProject = () => {
    if (selectedVisit) {
      setIsViewProjectModalOpen(true);
      setIsActionModalOpen(false);
    }
  };

  const handleVisit = () => {
    if (selectedVisit) {
      router.push(`/visit/${selectedVisit.parcel.id}`);
    }
    setIsActionModalOpen(false);
  };

  const handleReassign = async () => {
    if (!selectedVisit || !reassignReason) return;
    setSaving(true);

    try {
      await fetch(`/api/slots/${selectedVisit.id}/reassign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedVisit.id,
          reason: reassignReason,
        }),
      });
      toast.success("Cita reasignada correctamente");
    } catch {
      toast.error("Error al reasignar la cita");
    }

    setSaving(false);
    setIsActionModalOpen(false);
    setIsReassignModalOpen(false);
    setReassignReason("");
    fetchData();
  };

  const groupVisitsByDate = () => {
    const grouped: Record<string, CalendarVisit[]> = {};
    visits.forEach((visit) => {
      if (!visit.scheduledAt) return;
      const dateKey = new Date(visit.scheduledAt).toLocaleDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(visit);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const grouped = groupVisitsByDate();
  const stageLabels: Record<string, string> = {
    IN_PROGRESS: "Puerta",
    PROPOSAL_ACCEPTED: "Lead",
    PROJECT: "Proyecto",
    CLOSED: "Cerrado",
    CANCELLED: "Cancelado",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Calendario
          </h1>
          <p className="text-on-surface-variant">
            Gestiona tus citas agendadas
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-sm text-on-surface"
            >
              <option value="">Mis citas</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role === "CLOSER" ? "Closer" : "Trainee"})
                </option>
              ))}
            </select>
          )}
          <div className="flex border border-outline-variant rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 transition-colors ${
                viewMode === "list"
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-2 transition-colors ${
                viewMode === "calendar"
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {isSetter && (
        <div className="glass-panel rounded-2xl p-4">
          <h3 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" style={{ color: "#f48221" }} />
            Citas con tus Closers
          </h3>
          {setterAppointments.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant">
              <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No tienes citas agendadas</p>
              <p className="text-sm mt-1">
                Cuando envíes una propuesta y se agende con un closer, aparecerá aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {setterAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-xl bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleVisitClick(apt)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-on-surface">
                        {apt.parcel.address || "Sin dirección"}
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        {new Date(apt.scheduledAt).toLocaleDateString("es-MX", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm font-medium text-primary">
                        {new Date(apt.scheduledAt).toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </p>
                      {apt.bill?.clientName && (
                        <p className="text-xs text-on-surface-variant mt-1">
                          Cliente: {apt.bill.clientName}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                        {stageLabels[apt.stage] || apt.stage}
                      </span>
                      {apt.projects && apt.projects.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-end">
                          {apt.projects.map((p) => (
                            <span
                              key={p.projectType.id}
                              className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                            >
                              {p.projectType.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/visit/${apt.parcel.id}`);
                      }}
                    >
                      <MapPin className="w-4 h-4 mr-1" />
                      Visitar
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVisit(apt);
                        setSelectedVisitId(apt.id);
                        setIsViewProjectModalOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Proyecto
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === "calendar" && (
        <VisualCalendar
          visits={visits}
          onVisitSelect={handleVisitClick}
        />
      )}

      {viewMode === "list" && (
        <>
          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-12 text-on-surface-variant">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tienes visitas agendadas</p>
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(grouped).map(([dateKey, dayVisits]) => (
              <div key={dateKey} className="glass-panel rounded-2xl p-4">
                <h3 className="font-semibold text-on-surface mb-3">{dateKey}</h3>
                <div className="space-y-2">
                  {dayVisits.map((visit) => (
                    <div
                      key={visit.id}
                      onClick={() => handleVisitClick(visit)}
                      className="p-3 rounded-xl bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-on-surface flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            {visit.parcel.address}
                          </p>
                          <p className="text-sm text-on-surface-variant">
                            {new Date(visit.scheduledAt).toLocaleTimeString("es-MX", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            })}
                            {" — "}
                            <Link
                              href={`/profile/${visit.setter.id}`}
                              className="hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {visit.setter.name}
                            </Link>
                            {visit.closer && (
                              <>
                                {" / "}
                                <Link
                                  href={`/profile/${visit.closer.id}`}
                                  className="hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {visit.closer.name}
                                </Link>
                              </>
                            )}
                          </p>
                          {visit.bill?.clientName && (
                            <p className="text-xs text-on-surface-variant mt-1">
                              Cliente: {visit.bill.clientName}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                            {stageLabels[visit.stage] || visit.stage}
                          </span>
                          {visit.projects && visit.projects.length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {visit.projects.map((p) => (
                                <span
                                  key={p.projectType.id}
                                  className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                                >
                                  {p.projectType.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/visit/${visit.parcel.id}`);
                          }}
                        >
                          <MapPin className="w-4 h-4 mr-1" />
                          Visitar
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVisit(visit);
                            setSelectedVisitId(visit.id);
                            setIsViewProjectModalOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Proyecto
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title="Cita Agendada"
      >
        {selectedVisit && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="font-semibold text-on-surface">
                {selectedVisit.parcel.address}
              </p>
              <p className="text-sm text-on-surface-variant">
                Trainee:{" "}
                <Link
                  href={`/profile/${selectedVisit.setter.id}`}
                  className="hover:underline"
                >
                  {selectedVisit.setter.name}
                </Link>
              </p>
              {selectedVisit.closer && (
                <p className="text-sm text-on-surface-variant">
                  Closer:{" "}
                  <Link
                    href={`/profile/${selectedVisit.closer.id}`}
                    className="hover:underline"
                  >
                    {selectedVisit.closer.name}
                  </Link>
                </p>
              )}
              {selectedVisit.bill?.clientName && (
                <p className="text-sm text-on-surface-variant">
                  Cliente: {selectedVisit.bill.clientName}
                </p>
              )}
              <p className="text-sm text-on-surface-variant">
                {new Date(selectedVisit.scheduledAt).toLocaleString("es-MX", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </p>
              <p className="text-sm mt-1">
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                  {stageLabels[selectedVisit.stage] || selectedVisit.stage}
                </span>
              </p>
              {selectedVisit.projects && selectedVisit.projects.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedVisit.projects.map((p) => (
                    <span
                      key={p.projectType.id}
                      className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                    >
                      {p.projectType.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button onClick={handleViewProject} variant="outline" className="w-full">
                <Eye className="w-5 h-5 mr-2" />
                Ver Proyecto
              </Button>
              <Button onClick={handleVisit} className="w-full">
                <MapPin className="w-5 h-5 mr-2" />
                Visitar
              </Button>
              <Button
                onClick={() => {
                  setIsActionModalOpen(false);
                  setIsReassignModalOpen(true);
                }}
                variant="secondary"
                className="w-full"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Reasignar Cita
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        title="Reasignar Cita"
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Al reasignar, se notificará al administrador para que evalúe la situación y asigne la cita a otro closer.
          </p>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Justificación
            </label>
            <textarea
              value={reassignReason}
              onChange={(e) => setReassignReason(e.target.value)}
              className="w-full min-h-[120px] bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-xl p-4 resize-none text-on-surface mt-1"
              placeholder="Explica por qué no puedes asistir a esta cita..."
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsReassignModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReassign}
              disabled={!reassignReason || saving}
              className="flex-1"
              isLoading={saving}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      <ViewProjectModal
        isOpen={isViewProjectModalOpen}
        onClose={() => setIsViewProjectModalOpen(false)}
        visitId={selectedVisitId}
      />
    </div>
  );
}
