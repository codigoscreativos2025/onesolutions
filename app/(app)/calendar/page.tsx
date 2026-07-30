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
  X,
  Plus,
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

function formatDateSpanish(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date + "T12:00:00") : date;
  return format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
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
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedDayVisits, setSelectedDayVisits] = useState<CalendarVisit[]>([]);

  const [dayData, setDayData] = useState<Record<string, { available: boolean; ranges: { start: string; end: string }[] }>>({});
  const [availabilitySaving, setAvailabilitySaving] = useState(false);

  const [reassignReason, setReassignReason] = useState("");
  const [saving, setSaving] = useState(false);

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentUserId, setAppointmentUserId] = useState("");
  const [appointmentAddress, setAppointmentAddress] = useState("");
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [appointmentSaving, setAppointmentSaving] = useState(false);

  const [rejectVisitId, setRejectVisitId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectSaving, setRejectSaving] = useState(false);

  const [adminReassignVisit, setAdminReassignVisit] = useState<CalendarVisit | null>(null);
  const [adminReassignUserId, setAdminReassignUserId] = useState("");
  const [adminReassignDate, setAdminReassignDate] = useState("");
  const [adminReassignTime, setAdminReassignTime] = useState("");
  const [isAdminReassignModalOpen, setIsAdminReassignModalOpen] = useState(false);
  const [adminReassignUsers, setAdminReassignUsers] = useState<AdminUser[]>([]);
  const [adminReassignSaving, setAdminReassignSaving] = useState(false);

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [nameFilter, setNameFilter] = useState("");

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
        setDayData(data.availability);
      }
    } catch {
      // ignore
    }
  };

  const saveAvailability = async (date: string | Date, available: boolean, ranges?: { start: string; end: string }[]) => {
    setAvailabilitySaving(true);
    try {
      const key = typeof date === "string" ? date : format(date, "yyyy-MM-dd");
      const res = await fetch("/api/profile/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: key, available, ranges }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(available ? "Marcado como disponible" : "Marcado como no disponible");
        setDayData((prev) => ({ ...prev, [key]: { available: data.available, ranges: data.ranges } }));
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

  const handleDayClick = (date: string, dayVisits: CalendarVisit[]) => {
    setSelectedDay(date);
    setSelectedDayVisits(dayVisits);
    setIsDayModalOpen(true);
  };

  const fetchAllUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setAllUsers(data.filter((u: AdminUser) => u.role !== "ADMIN"));
    } catch {
      // ignore
    }
  };

  const handleCreateAppointment = async () => {
    if (!appointmentDate || !appointmentTime || !appointmentUserId) {
      toast.error("Completa todos los campos requeridos");
      return;
    }
    setAppointmentSaving(true);
    try {
      const res = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: appointmentDate,
          hour: appointmentTime,
          targetUserId: appointmentUserId,
          address: appointmentAddress || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear cita");
      }
      toast.success("Cita creada correctamente");
      setIsAppointmentModalOpen(false);
      setAppointmentDate("");
      setAppointmentTime("");
      setAppointmentUserId("");
      setAppointmentAddress("");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear cita");
    } finally {
      setAppointmentSaving(false);
    }
  };

  const openAppointmentModal = async () => {
    await fetchAllUsers();
    setIsAppointmentModalOpen(true);
  };

  const getAvailableForDay = (date: Date | string): boolean => {
    const key = typeof date === "string" ? date : format(date, "yyyy-MM-dd");
    const d = dayData[key];
    return d?.available ?? true;
  };

  const getDayRanges = (date: Date | string) => {
    const key = typeof date === "string" ? date : format(date, "yyyy-MM-dd");
    return dayData[key]?.ranges || [];
  };

  const getOwnerDisplay = (visit: CalendarVisit): string => {
    return visit.bill?.clientName || visit.parcel.ownerName || visit.parcel.address || "Sin dirección";
  };

  const handleRejectAppointment = async () => {
    if (!rejectVisitId || !rejectReason) return;
    setRejectSaving(true);
    try {
      const res = await fetch(`/api/visits/${rejectVisitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: null, rejectionReason: rejectReason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al rechazar");
      }
      toast.success("Cita rechazada correctamente");
      setIsRejectModalOpen(false);
      setRejectReason("");
      setRejectVisitId(null);
      fetchData();
    } catch {
      toast.error("Error al rechazar la cita");
    } finally {
      setRejectSaving(false);
    }
  };

  const openRejectModal = (visit: CalendarVisit) => {
    setRejectVisitId(visit.id);
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const openAdminReassignModal = async (visit: CalendarVisit) => {
    setAdminReassignVisit(visit);
    const date = new Date(visit.scheduledAt);
    setAdminReassignDate(date.toISOString().split("T")[0]);
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    setAdminReassignTime(`${h}:${m}`);
    setAdminReassignUserId("");
    setIsAdminReassignModalOpen(true);

    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setAdminReassignUsers(
        data.filter(
          (u: AdminUser) => (u.role === "SETTER" || u.role === "SETTER_JR" || u.role === "CLOSER") && u.id !== visit.setter.id
        )
      );
    } catch {
      // ignore
    }
  };

  const handleAdminReassign = async () => {
    if (!adminReassignVisit || !adminReassignUserId || !adminReassignDate || !adminReassignTime) {
      toast.error("Completa todos los campos");
      return;
    }
    setAdminReassignSaving(true);
    try {
      const [h, m] = adminReassignTime.split(":");
      const newDate = new Date(adminReassignDate + `T${h}:${m}:00`);
      const targetUserId = parseInt(adminReassignUserId);

      const res = await fetch(`/api/visits/${adminReassignVisit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          closerId: targetUserId,
          scheduledAt: newDate.toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al reasignar");
      }

      const targetUser = adminReassignUsers.find((u) => u.id === targetUserId);
      if (targetUser) {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: targetUserId,
            title: "Nueva cita asignada",
            body: `Se te ha asignado una cita para el ${adminReassignDate} a las ${adminReassignTime}`,
            link: "/calendar",
          }),
        });
      }

      toast.success("Cita reasignada correctamente");
      setIsAdminReassignModalOpen(false);
      setAdminReassignVisit(null);
      fetchData();
    } catch {
      toast.error("Error al reasignar la cita");
    } finally {
      setAdminReassignSaving(false);
    }
  };

  const handleAppointmentNavigate = (visit: CalendarVisit) => {
    setIsDayModalOpen(false);
    router.push(`/lead/${visit.id}`);
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
              {users
                .filter((u) => {
                  if (roleFilter === "trainee") return u.role === "SETTER" || u.role === "SETTER_JR";
                  if (roleFilter === "closer") return u.role === "CLOSER";
                  return true;
                })
                .filter((u) => {
                  if (!nameFilter) return true;
                  return u.name.toLowerCase().includes(nameFilter.toLowerCase());
                })
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role === "CLOSER" ? "Closer" : "Trainee"})
                  </option>
                ))
              }
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
          {isAdmin && (
            <Button onClick={openAppointmentModal} size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              Agendar Cita
            </Button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="glass-panel rounded-2xl p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">Tipo de usuario</label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setSelectedUserId("");
              }}
              className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-sm text-on-surface"
            >
              <option value="all">Todos</option>
              <option value="trainee">Trainee</option>
              <option value="closer">Closer</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">Nombre</label>
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Buscar..."
              className="h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-sm text-on-surface w-48"
            />
          </div>
        </div>
      )}

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
          onDayClick={handleDayClick}
          dayAvailability={canSetSchedule ? dayData : undefined}
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
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {canSetSchedule && selectedDay && (
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-on-surface">Disponibilidad</span>
                <button
                  onClick={() => saveAvailability(selectedDay, !getAvailableForDay(selectedDay), getDayRanges(selectedDay))}
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

              {getAvailableForDay(selectedDay) && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-on-surface-variant">Rangos horarios:</span>
                  {getDayRanges(selectedDay).map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={r.start}
                        onChange={(e) => {
                          const newRanges = [...getDayRanges(selectedDay)];
                          newRanges[i] = { start: e.target.value, end: newRanges[i].end };
                          saveAvailability(selectedDay, true, newRanges);
                        }}
                        className="h-8 text-xs rounded bg-surface-container-low border border-outline-variant px-2"
                      />
                      <span className="text-xs text-on-surface-variant">a</span>
                      <input
                        type="time"
                        value={r.end}
                        onChange={(e) => {
                          const newRanges = [...getDayRanges(selectedDay)];
                          newRanges[i] = { start: newRanges[i].start, end: e.target.value };
                          saveAvailability(selectedDay, true, newRanges);
                        }}
                        className="h-8 text-xs rounded bg-surface-container-low border border-outline-variant px-2"
                      />
                      <button
                        onClick={() => {
                          const newRanges = getDayRanges(selectedDay).filter((_, j) => j !== i);
                          saveAvailability(selectedDay, newRanges.length > 0, newRanges);
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newRanges = [...getDayRanges(selectedDay), { start: "09:00", end: "17:00" }];
                      saveAvailability(selectedDay, true, newRanges);
                    }}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Agregar rango
                  </button>
                </div>
              )}
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
                  <div key={visit.id} className="w-full p-3 rounded-xl bg-primary/5 border border-primary/20 text-left">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleAppointmentNavigate(visit)}
                        className="flex items-center gap-3 flex-1 text-left hover:opacity-80"
                      >
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
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                          {stageLabels[visit.stage] || visit.stage}
                        </span>
                        <ArrowRight className="w-4 h-4 text-on-surface-variant" />
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 border-red-200 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRejectModal(visit);
                        }}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Rechazar
                      </Button>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAdminReassignModal(visit);
                          }}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Reasignar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        title="Agendar Cita"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Usuario
            </label>
            <select
              value={appointmentUserId}
              onChange={(e) => setAppointmentUserId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-sm text-on-surface mt-1"
            >
              <option value="">Seleccionar usuario...</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === "CLOSER" ? "Closer" : "Trainee"})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Fecha
            </label>
            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-sm text-on-surface mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Hora
            </label>
            <input
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-sm text-on-surface mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Dirección / Notas
            </label>
            <input
              type="text"
              value={appointmentAddress}
              onChange={(e) => setAppointmentAddress(e.target.value)}
              placeholder="Dirección o notas de la cita..."
              className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-sm text-on-surface mt-1"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsAppointmentModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateAppointment}
              disabled={appointmentSaving || !appointmentDate || !appointmentTime || !appointmentUserId}
              className="flex-1"
            >
              {appointmentSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectReason("");
          setRejectVisitId(null);
        }}
        title="Rechazar Cita"
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Al rechazar esta cita, se eliminará del calendario y se notificará al administrador.
          </p>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Motivo del rechazo
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full min-h-[100px] bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-xl p-4 resize-none text-on-surface mt-1"
              placeholder="Explica por qué rechazas esta cita..."
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsRejectModalOpen(false);
                setRejectReason("");
                setRejectVisitId(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRejectAppointment}
              disabled={!rejectReason || rejectSaving}
              className="flex-1"
              isLoading={rejectSaving}
            >
              Confirmar Rechazo
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isAdminReassignModalOpen}
        onClose={() => {
          setIsAdminReassignModalOpen(false);
          setAdminReassignVisit(null);
        }}
        title="Reasignar Cita"
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Reasigna esta cita a otro usuario con una nueva fecha y hora.
          </p>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Usuario
            </label>
            <select
              value={adminReassignUserId}
              onChange={(e) => setAdminReassignUserId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-sm text-on-surface mt-1"
            >
              <option value="">Seleccionar usuario...</option>
              {adminReassignUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === "CLOSER" ? "Closer" : "Trainee"})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Fecha
            </label>
            <input
              type="date"
              value={adminReassignDate}
              onChange={(e) => setAdminReassignDate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-sm text-on-surface mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Hora
            </label>
            <input
              type="time"
              value={adminReassignTime}
              onChange={(e) => setAdminReassignTime(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-sm text-on-surface mt-1"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsAdminReassignModalOpen(false);
                setAdminReassignVisit(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAdminReassign}
              disabled={adminReassignSaving || !adminReassignUserId || !adminReassignDate || !adminReassignTime}
              className="flex-1"
              isLoading={adminReassignSaving}
            >
              Reasignar
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
