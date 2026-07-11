"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Plus,
  Trash2,
  Loader2,
  Calendar as CalendarIcon,
  Eye,
  MapPin,
  RefreshCw,
  Check,
  X,
  LayoutGrid,
  List,
} from "lucide-react";
import { VisualCalendar } from "@/components/calendar/VisualCalendar";
import { ViewProjectModal } from "@/components/calendar/ViewProjectModal";

interface Slot {
  id: number;
  startAt: string;
  endAt: string;
  isBooked: boolean;
  isWorkday?: boolean;
  visit?: {
    id: number;
    parcel: { id: string; address: string };
    setter: { name: string };
    projects?: { projectType: { id: number; name: string } }[];
  };
}

interface WeeklyPattern {
  id: number;
  dayOfWeek: number;
  startHour: number;
  endHour: number;
  slotDuration: number;
  isWorkday: boolean;
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const FULL_DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function CalendarPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [patterns, setPatterns] = useState<WeeklyPattern[]>([]);
  const [appointments, setAppointments] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isViewProjectModalOpen, setIsViewProjectModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);

  // Pattern form
  const [patternDay, setPatternDay] = useState(1);
  const [patternStartHour, setPatternStartHour] = useState(9);
  const [patternEndHour, setPatternEndHour] = useState(17);
  const [patternDuration, setPatternDuration] = useState(60);
  const [patternIsWorkday, setPatternIsWorkday] = useState(true);

  // Slot form
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("09:00");
  const [isWorkday, setIsWorkday] = useState(true);

  // Reassign form
  const [reassignReason, setReassignReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (session?.user?.role === "SETTER") {
      router.push("/dashboard");
      return;
    }
    fetchData();
  }, [session, router]);

  const fetchData = async () => {
    try {
      const [slotsRes, patternsRes, appointmentsRes] = await Promise.all([
        fetch("/api/slots"),
        fetch("/api/weekly-patterns"),
        fetch("/api/appointments"),
      ]);
      const slotsData = await slotsRes.json();
      const patternsData = await patternsRes.json();
      const appointmentsData = await appointmentsRes.json();

      // Convertir citas asignadas a formato Slot para mostrarlas en el calendario
      const appointmentSlots: Slot[] = (appointmentsData || [])
        .filter((apt: { slot: unknown; stage: string }) => !apt.slot && apt.stage !== "CLOSED")
        .map((apt: { id: number; parcel: { id: string; address: string }; setter: { name: string }; slot?: { startAt: string }; stage: string; projects?: { projectType: { id: number; name: string } }[] }) => ({
          id: -apt.id, // IDs negativos para diferenciar de slots reales
          startAt: apt.slot?.startAt || new Date().toISOString(),
          endAt: apt.slot?.startAt || new Date().toISOString(),
          isBooked: true,
          visit: {
            id: apt.id,
            parcel: apt.parcel,
            setter: apt.setter,
            projects: apt.projects,
          },
        }));

      setSlots(slotsData);
      setPatterns(patternsData);
      setAppointments(appointmentSlots);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePattern = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    await fetch("/api/weekly-patterns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayOfWeek: patternDay,
        startHour: patternStartHour,
        endHour: patternEndHour,
        slotDuration: patternDuration,
        isWorkday: patternIsWorkday,
      }),
    });

    setSaving(false);
    setIsPatternModalOpen(false);
    fetchData();
  };

  const handleDeletePattern = async (id: number) => {
    await fetch(`/api/weekly-patterns?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleGenerateSlots = async () => {
    setGenerating(true);
    await fetch("/api/weekly-patterns/generate-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weeksAhead: 4 }),
    });
    setGenerating(false);
    fetchData();
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    await fetch("/api/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, hour: hour.split(":")[0], isWorkday }),
    });

    setSaving(false);
    setIsSlotModalOpen(false);
    setDate("");
    setHour("09:00");
    fetchData();
  };

  const handleDeleteSlot = async (id: number) => {
    if (!confirm("¿Eliminar este slot?")) return;
    await fetch(`/api/slots/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleSlotClick = (slot: Slot) => {
    setSelectedSlot(slot);
    setIsActionModalOpen(true);
  };

  const handleViewProject = () => {
    if (selectedSlot?.visit) {
      setSelectedVisitId(selectedSlot.visit.id);
      setIsViewProjectModalOpen(true);
      setIsActionModalOpen(false);
    }
  };

  const handleVisit = () => {
    if (selectedSlot?.visit) {
      router.push(`/visit/${selectedSlot.visit.parcel.id}`);
    }
    setIsActionModalOpen(false);
  };

  const handleReassign = async () => {
    if (!selectedSlot || !reassignReason) return;
    setSaving(true);

    await fetch(`/api/slots/${selectedSlot.id}/reassign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slotId: selectedSlot.id,
        reason: reassignReason,
      }),
    });

    setSaving(false);
    setIsActionModalOpen(false);
    setIsReassignModalOpen(false);
    setReassignReason("");
    fetchData();
  };

  const groupSlotsByDate = () => {
    const grouped: Record<string, Slot[]> = {};
    const allSlots = [...slots, ...appointments];
    allSlots.forEach((slot) => {
      const dateKey = new Date(slot.startAt).toLocaleDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(slot);
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

  const grouped = groupSlotsByDate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Calendario
          </h1>
          <p className="text-on-surface-variant">
            Gestiona tus horarios y citas
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-outline-variant rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
          <Button variant="outline" onClick={() => setIsPatternModalOpen(true)}>
            <Plus className="w-5 h-5" />
            Patrón
          </Button>
          <Button onClick={() => setIsSlotModalOpen(true)}>
            <Plus className="w-5 h-5" />
            Slot
          </Button>
        </div>
      </div>

      {/* Patrones Semanales */}
      {patterns.length > 0 && (
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-on-surface">Patrones Semanales</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSlots}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="ml-2">Generar Slots</span>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {patterns.map((pattern) => (
              <div
                key={pattern.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20"
              >
                <span className="text-sm font-medium text-on-surface">
                  {FULL_DAYS[pattern.dayOfWeek]} {pattern.startHour}:00-{pattern.endHour}:00
                </span>
                <button
                  onClick={() => handleDeletePattern(pattern.id)}
                  className="p-1 rounded hover:bg-error/10"
                >
                  <X className="w-3 h-3 text-error" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vista de Calendario Visual */}
      {viewMode === 'calendar' && (
        <VisualCalendar
          slots={slots}
          onSlotSelect={(slot) => {
            if (slot.isBooked) {
              handleSlotClick(slot);
            }
          }}
        />
      )}

      {/* Vista de Lista */}
      {viewMode === 'list' && (
        <>
          {/* Slots */}
          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-12 text-on-surface-variant">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tienes slots configurados</p>
              <p className="text-sm mt-2">Crea un patrón semanal o agrega slots manualmente</p>
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(grouped).map(([dateKey, daySlots]) => (
              <div key={dateKey} className="glass-panel rounded-2xl p-4">
                <h3 className="font-semibold text-on-surface mb-3">{dateKey}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {daySlots.map((slot) => (
                    <div
                      key={slot.id}
                      onClick={() => slot.isBooked && handleSlotClick(slot)}
                      className={`p-3 rounded-xl border flex flex-col gap-1 ${
                        slot.isBooked
                      ? "bg-primary/10 border-primary/30 cursor-pointer hover:bg-primary/20"
                      : "bg-surface-container-low border-outline-variant"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-on-surface">
                      {new Date(slot.startAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {!slot.isBooked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSlot(slot.id);
                        }}
                        className="p-1 rounded hover:bg-error-container transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-error" />
                      </button>
                    )}
                  </div>
                  {slot.isBooked && slot.visit && (
                    <div className="text-xs text-on-surface-variant">
                      <p className="font-medium text-primary flex items-center gap-1">
                        <Check className="w-3 h-3" /> Reservado
                      </p>
                      <p className="truncate">{slot.visit.parcel.address}</p>
                      <p>Setter: {slot.visit.setter.name}</p>
                    </div>
                  )}
                  {!slot.isBooked && (
                    <span className="text-xs text-on-surface-variant">
                      {slot.isWorkday !== false ? "Laborable" : "No laborable"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      </>
      )}

      {/* Modal de Patrón Semanal */}
      <Modal
        isOpen={isPatternModalOpen}
        onClose={() => setIsPatternModalOpen(false)}
        title="Nuevo Patrón Semanal"
      >
        <form onSubmit={handleCreatePattern} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Día de la semana
            </label>
            <select
              value={patternDay}
              onChange={(e) => setPatternDay(parseInt(e.target.value))}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface mt-1"
            >
              {DAYS.map((day, idx) => (
                <option key={idx} value={idx}>
                  {FULL_DAYS[idx]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Hora inicio
              </label>
              <select
                value={patternStartHour}
                onChange={(e) => setPatternStartHour(parseInt(e.target.value))}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface mt-1"
              >
                {Array.from({ length: 14 }, (_, i) => i + 6).map((h) => (
                  <option key={h} value={h}>
                    {h}:00
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Hora fin
              </label>
              <select
                value={patternEndHour}
                onChange={(e) => setPatternEndHour(parseInt(e.target.value))}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface mt-1"
              >
                {Array.from({ length: 14 }, (_, i) => i + 7).map((h) => (
                  <option key={h} value={h}>
                    {h}:00
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Duración del slot (minutos)
            </label>
            <select
              value={patternDuration}
              onChange={(e) => setPatternDuration(parseInt(e.target.value))}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface mt-1"
            >
              <option value={30}>30 min</option>
              <option value={60}>1 hora</option>
              <option value={90}>1.5 horas</option>
              <option value={120}>2 horas</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="patternWorkday"
              checked={patternIsWorkday}
              onChange={(e) => setPatternIsWorkday(e.target.checked)}
              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <label htmlFor="patternWorkday" className="text-on-surface">
              Día laborable
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsPatternModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" isLoading={saving}>
              Crear Patrón
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Slot Manual */}
      <Modal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        title="Nuevo Slot"
      >
        <form onSubmit={handleCreateSlot} className="space-y-4">
          <Input
            label="Fecha"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label="Hora de inicio"
            type="time"
            value={hour}
            onChange={(e) => setHour(e.target.value)}
            required
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isWorkday"
              checked={isWorkday}
              onChange={(e) => setIsWorkday(e.target.checked)}
              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <label htmlFor="isWorkday" className="text-on-surface">
              Día laborable
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsSlotModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" isLoading={saving}>
              Crear
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Acciones en Slot Reservado */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title="Cita Reservada"
      >
        {selectedSlot?.visit && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="font-semibold text-on-surface">
                {selectedSlot.visit.parcel.address}
              </p>
              <p className="text-sm text-on-surface-variant">
                Setter: {selectedSlot.visit.setter.name}
              </p>
              <p className="text-sm text-on-surface-variant">
                {new Date(selectedSlot.startAt).toLocaleString()}
              </p>
              {selectedSlot.visit.projects && selectedSlot.visit.projects.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedSlot.visit.projects.map((p) => (
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
              {selectedSlot && selectedSlot.id > 0 && (
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
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Reasignación */}
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

      {/* Modal de Ver Proyecto */}
      <ViewProjectModal
        isOpen={isViewProjectModalOpen}
        onClose={() => setIsViewProjectModalOpen(false)}
        visitId={selectedVisitId}
      />
    </div>
  );
}
