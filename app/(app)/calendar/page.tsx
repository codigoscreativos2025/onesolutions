"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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
  ArrowRight,
} from "lucide-react";
import { VisualCalendar } from "@/components/calendar/VisualCalendar";
import { ViewProjectModal } from "@/components/calendar/ViewProjectModal";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CalendarVisit {
  id: number;
  scheduledAt: string;
  stage: string;
  parcel: { id: string; address: string; ownerName: string | null };
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

function formatTimeAMPM(dateStr: string): string {
  const d = new Date(dateStr);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

function formatDateSpanish(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedDayVisits, setSelectedDayVisits] = useState<CalendarVisit[]>([]);

  const [dayAvailability, setDayAvailability] = useState<Record<string, boolean>>({});
  const [availabilitySaving, setAvailabilitySaving] = useState(false);

  const [reassignReason, setReassignReason] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";
  const isSetter = session?.user?.role === "SETTER";
  const isSetterJr = session?.user?.role === "SETTER_JR";
  const isCloser = session?.user?.role === "CLOSER";
  const canSetSchedule = isSetter || isSetterJr || isCloser;

  const fetchAvailability = async (targetMonth?: Date) => {
    try {
      const now = targetMonth || new Date();
      const month = (now.getMonth() + 1).toString();
      const year = now.getFullYear().toString();
      const res = await fetch(`/api/profile/availability?month=${month}&year=${year}`);
      const data = await res.json();
      if (data.availability) {
        setDayAvailability(data.availability);
      }
    } catch {
      // ignore
    }
  };

  const saveAvailability = async (date: Date, available: boolean) => {
    setAvailabilitySaving(true);
    try {
      const key = format(date, "yyyy-MM-dd");
      const res = await fetch("/api/profile/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: key, available }),
      });
      if (res.ok) {
        toast.success(available ? "Marcado como disponible" : "Marcado como no disponible");
        setDayAvailability((prev) => ({ ...prev, [key]: available }));
      } else {
        toast.error("Error al actualizar disponibilidad");
      }
    } catch {
      toast.error("Error al actualizar disponibilidad");
    } finally {
      setAvailabilitySaving(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedUserId, session, router]);

  useEffect(() => {
    fetchAvailability();
  }, [session]);

  useEffect(() => {
    if (!loading && highlightId) {
      setTimeout(() => {
        const el = document.getElementById(`visit-${highlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("visit-highlight");
          highlightTimerRef.current = setTimeout(() => {
            el.classList.remove("visit-highlight");
          }, 2500);
        }
      }, 300);
    }
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, [loading, highlightId]);

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
                  parcel: { id: string; address: string; ownerName?: string | null };
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
                  parcel: { id: apt.parcel.id, address: apt.parcel.address, ownerName: apt.parcel.ownerName || null },
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

  const handleDayClick = (date: Date, dayVisits: CalendarVisit[]) => {
    setSelectedDay(date);
    setSelectedDayVisits(dayVisits);
    setIsDayModalOpen(true);
  };

  const getAvailableForDay = (date: Date): boolean => {
    const key = format(date, "yyyy-MM-dd");
    return dayAvailability[key] ?? true;
  };

  const getOwnerDisplay = (visit: CalendarVisit): string => {
    return visit.bill?.clientName || visit.parcel.ownerName || visit.parcel.address || "Sin dirección";
  };

  const handleAppointmentNavigate = (visit: CalendarVisit) => {
    setIsDayModalOpen(false);
    if (visit.stage === "IN_PROGRESS" || visit.stage === "OBJECTION") {
      router.push(`/leads?highlight=${visit.parcel.id}`);
    } else if (
      visit.stage === "PROPOSAL_ACCEPTED" ||
      visit.stage === "PROJECT" ||
      visit.stage === "CLOSED"
    ) {
      router.push(`/my-projects?highlight=${visit.id}`);
    } else {
      router.push(`/leads?highlight=${visit.parcel.id}`);
    }
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
      <style>{`
        @keyframes visitHighlightPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(244, 130, 33, 0.6); border-color: rgba(244, 130, 33, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(244, 130, 33, 0.1); border-color: rgba(244, 130, 33, 0.9); }
        }
        .visit-highlight {
          animation: visitHighlightPulse 0.8s ease-in-out 3;
          border-color: #f48221 !important;
          background-color: rgba(244, 130, 33, 0.08) !important;
        }
      `}</style>

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
                  id={`visit-${apt.id}`}
                  className="p-4 rounded-xl bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => handleVisitClick(apt)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-on-surface">
                        {getOwnerDisplay(apt)}
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
                        {formatTimeAMPM(apt.scheduledAt)}
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
          onDayClick={handleDayClick}
          dayAvailability={canSetSchedule ? dayAvailability : undefined}
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
                      id={`visit-${visit.id}`}
                      onClick={() => handleVisitClick(visit)}
                      className="p-3 rounded-xl bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-on-surface flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            {getOwnerDisplay(visit)}
                          </p>
                          <p className="text-sm text-on-surface-variant">
                            {formatTimeAMPM(visit.scheduledAt)}
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
                {getOwnerDisplay(selectedVisit)}
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
                {new Date(selectedVisit.scheduledAt).toLocaleDateString("es-MX", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                {formatTimeAMPM(selectedVisit.scheduledAt)}
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

      <Modal
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        title={selectedDay ? formatDateSpanish(selectedDay) : "Día"}
      >
        <div className="space-y-4">
          {canSetSchedule && selectedDay && (
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-on-surface">Disponibilidad</span>
                <button
                  onClick={() => saveAvailability(selectedDay, !getAvailableForDay(selectedDay))}
                  disabled={availabilitySaving}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    getAvailableForDay(selectedDay)
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  }`}
                >
                  {availabilitySaving ? (
                    <Loader2 className="w-3 h-3 animate-spin inline" />
                  ) : getAvailableForDay(selectedDay) ? (
                    "Disponible"
                  ) : (
                    "No Disponible"
                  )}
                </button>
              </div>
            </div>
          )}

          {selectedDayVisits.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant">
              <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No hay visitas para este día</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayVisits.map((visit) => {
                return (
                  <button
                    key={visit.id}
                    onClick={() => handleAppointmentNavigate(visit)}
                    className="w-full p-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2 h-8 rounded-full"
                          style={{
                            backgroundColor:
                              visit.stage === "IN_PROGRESS"
                                ? "#3b82f6"
                                : visit.stage === "PROPOSAL_ACCEPTED"
                                ? "#22c55e"
                                : visit.stage === "PROJECT"
                                ? "#eab308"
                                : visit.stage === "CLOSED"
                                ? "#8b5cf6"
                                : "#6b7280",
                          }}
                        />
                        <div>
                          <p className="font-medium text-sm">
                            {getOwnerDisplay(visit)}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {formatTimeAMPM(visit.scheduledAt)} — {visit.setter.name}
                            {visit.closer ? ` / ${visit.closer.name}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                          {stageLabels[visit.stage] || visit.stage}
                        </span>
                        <ArrowRight className="w-4 h-4 text-on-surface-variant" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
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
