"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Plus, Trash2, Loader2, Calendar as CalendarIcon } from "lucide-react";

interface Slot {
  id: number;
  startAt: string;
  endAt: string;
  isBooked: boolean;
  isWorkday: boolean;
  visit?: {
    parcel: { address: string };
    setter: { name: string };
  };
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("09:00");
  const [isWorkday, setIsWorkday] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user?.role === "SETTER") {
      router.push(`/${locale}/dashboard`);
      return;
    }
    fetchSlots();
  }, [session, locale, router]);

  const fetchSlots = async () => {
    try {
      const res = await fetch("/api/slots");
      const data = await res.json();
      setSlots(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !hour) return;

    setSaving(true);
    const res = await fetch("/api/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, hour: hour.split(":")[0], isWorkday }),
    });

    if (res.ok) {
      setIsModalOpen(false);
      setDate("");
      setHour("09:00");
      fetchSlots();
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este slot?")) return;

    const res = await fetch(`/api/slots/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      fetchSlots();
    }
  };

  const groupSlotsByDate = () => {
    const grouped: Record<string, Slot[]> = {};
    slots.forEach((slot) => {
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
            Gestiona tus horarios disponibles
          </p>
        </div>
        {session?.user?.role === "CLOSER" && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5" />
            Nuevo Slot
          </Button>
        )}
      </div>

      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-12 text-on-surface-variant">
          <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No tienes slots configurados</p>
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
                  className={`p-3 rounded-xl border flex flex-col gap-1 ${
                    slot.isBooked
                      ? "bg-primary/10 border-primary/30"
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
                        onClick={() => handleDelete(slot.id)}
                        className="p-1 rounded hover:bg-error-container transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-error" />
                      </button>
                    )}
                  </div>
                  {slot.isBooked && slot.visit && (
                    <div className="text-xs text-on-surface-variant">
                      <p className="font-medium text-primary">Reservado</p>
                      <p>{slot.visit.parcel.address}</p>
                      <p>Setter: {slot.visit.setter.name}</p>
                    </div>
                  )}
                  {!slot.isBooked && (
                    <span className="text-xs text-on-surface-variant">
                      {slot.isWorkday ? "Laborable" : "No laborable"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Slot"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" isLoading={saving}>
              Crear
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
