"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ArrowLeft,
  Calendar,
  DoorOpen,
  CalendarX,
  XCircle,
  CheckCircle,
  Upload,
  Phone,
  User,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface Visit {
  id: number;
  parcel: {
    address: string;
  };
  stage: string;
}

interface Objection {
  id: number;
  name: string;
  color: string;
}

interface Closer {
  id: number;
  name: string;
  email: string;
  slots: {
    id: number;
    startAt: string;
    endAt: string;
  }[];
}

export default function VisitPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const parcelId = params.parcelId as string;

  const [visit, setVisit] = useState<Visit | null>(null);
  const [objections, setObjections] = useState<Objection[]>([]);
  const [closers, setClosers] = useState<Closer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Form states
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [selectedObjections, setSelectedObjections] = useState<number[]>([]);
  const [objectionNotes, setObjectionNotes] = useState("");
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState("");
  const [phone, setPhone] = useState("");
  const [clientName, setClientName] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [selectedCloserId, setSelectedCloserId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [parcelId]);

  const fetchData = async () => {
    try {
      const [visitRes, objRes, closersRes] = await Promise.all([
        fetch(`/api/visits/active?parcelId=${parcelId}`),
        fetch("/api/objections"),
        fetch("/api/closers"),
      ]);

      const visitData = await visitRes.json();
      const objData = await objRes.json();
      const closersData = await closersRes.json();

      setVisit(visitData);
      setObjections(objData);
      setClosers(closersData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotAvailable = async () => {
    if (!scheduledDate || !scheduledTime || !visit) return;

    setSaving(true);
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    await fetch(`/api/visits/${visit.id}/not-available`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt }),
    });

    setSaving(false);
    router.push(`/${locale}/map`);
  };

  const handleObjection = async () => {
    if (selectedObjections.length === 0 || !visit) return;

    setSaving(true);
    await fetch(`/api/visits/${visit.id}/objection`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        objectionIds: selectedObjections,
        notes: objectionNotes,
      }),
    });

    setSaving(false);
    router.push(`/${locale}/map`);
  };

  const handleProposal = async () => {
    if (!phone || !billFile || !selectedSlotId || !selectedCloserId || !visit) {
      return;
    }

    setSaving(true);

    const formData = new FormData();
    formData.append("file", billFile);
    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const uploadData = await uploadRes.json();

    await fetch(`/api/visits/${visit.id}/proposal`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        clientName,
        billImageUrl: uploadData.url,
        slotId: selectedSlotId,
        closerId: selectedCloserId,
      }),
    });

    setSaving(false);
    router.push(`/${locale}/map`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBillFile(file);
      setBillPreview(URL.createObjectURL(file));
    }
  };

  const toggleObjection = (id: number) => {
    setSelectedObjections((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="text-center py-12">
        <p className="text-on-surface-variant">No se encontró visita activa</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/${locale}/map`)}
        >
          Volver al mapa
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/${locale}/map`)}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-primary" />
        </button>
        <div>
          <h1 className="font-headline text-xl font-bold text-primary">
            One Solutions
          </h1>
        </div>
      </header>

      <section className="glass-panel rounded-xl p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-on-surface">
              {visit.parcel.address}
            </h2>
            <p className="text-sm text-on-surface-variant">Visita en curso</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full">
          Activa
        </span>
      </section>

      <section>
        <h3 className="font-headline text-lg font-bold text-on-surface mb-4">
          Resultado de la Visita
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <OutcomeTab
            icon={CalendarX}
            label="No Disponible"
            isActive={activeTab === "no-disponible"}
            onClick={() => setActiveTab("no-disponible")}
            color="primary"
          />
          <OutcomeTab
            icon={XCircle}
            label="Objeción"
            isActive={activeTab === "objecion"}
            onClick={() => setActiveTab("objecion")}
            color="secondary"
          />
          <OutcomeTab
            icon={CheckCircle}
            label="Acepta Propuesta"
            isActive={activeTab === "propuesta"}
            onClick={() => setActiveTab("propuesta")}
            color="primary"
          />
        </div>
      </section>

      {activeTab === "no-disponible" && (
        <div className="glass-panel rounded-xl p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 text-primary">
            <Calendar className="w-5 h-5" />
            <h4 className="font-semibold uppercase tracking-wider text-sm">
              Reagendar Visita
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Fecha"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
            <Input
              label="Hora"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>
          <p className="text-sm text-primary italic bg-primary/5 p-4 rounded-lg border border-primary/10">
            El cliente no se encontraba en casa o solicitó volver en otro
            momento.
          </p>
          <Button
            onClick={handleNotAvailable}
            disabled={!scheduledDate || !scheduledTime || saving}
            className="w-full h-14 uppercase tracking-widest"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar"}
          </Button>
        </div>
      )}

      {activeTab === "objecion" && (
        <div className="glass-panel rounded-xl p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 text-secondary">
            <XCircle className="w-5 h-5" />
            <h4 className="font-semibold uppercase tracking-wider text-sm">
              Registrar Objeciones
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {objections.map((obj) => (
              <button
                key={obj.id}
                onClick={() => toggleObjection(obj.id)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                  selectedObjections.includes(obj.id)
                    ? "bg-secondary/10 border-secondary text-secondary"
                    : "bg-surface-container-lowest border-outline-variant text-on-surface hover:border-secondary"
                }`}
              >
                {obj.name}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Notas adicionales
            </label>
            <textarea
              value={objectionNotes}
              onChange={(e) => setObjectionNotes(e.target.value)}
              className="w-full min-h-[120px] bg-surface-container-low border border-outline-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none rounded-xl p-4 resize-none text-on-surface"
              placeholder="Escribe detalles adicionales..."
            />
          </div>
          <Button
            onClick={handleObjection}
            disabled={selectedObjections.length === 0 || saving}
            variant="secondary"
            className="w-full h-14 uppercase tracking-widest"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Registrar"}
          </Button>
        </div>
      )}

      {activeTab === "propuesta" && (
        <div className="glass-panel rounded-xl p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle className="w-5 h-5" />
            <h4 className="font-semibold uppercase tracking-wider text-sm">
              Nueva Oportunidad
            </h4>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Paso 1: Subir Recibo de Luz
            </label>
            <label className="w-full h-32 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center bg-surface-container-lowest hover:bg-primary/5 transition-colors cursor-pointer group">
              <Upload className="w-8 h-8 text-on-surface-variant group-hover:text-primary" />
              <span className="text-sm text-on-surface-variant mt-2">
                {billFile ? billFile.name : "Haz clic para subir archivo"}
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {billPreview && (
              <img
                src={billPreview}
                alt="Preview"
                className="w-full h-40 object-cover rounded-xl"
              />
            )}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Paso 2: Información de Contacto
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Número de teléfono"
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
              />
            </div>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Paso 3: Agendar con Closer
              </label>
              <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded uppercase font-bold">
                Slots Disponibles
              </span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {closers.map((closer) =>
                closer.slots.map((slot) => (
                  <div
                    key={slot.id}
                    onClick={() => {
                      setSelectedSlotId(String(slot.id));
                      setSelectedCloserId(String(closer.id));
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedSlotId === String(slot.id)
                        ? "border-primary bg-primary/5"
                        : "border-glass-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold text-sm">
                        {closer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface">
                          {closer.name}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {new Date(slot.startAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 transition-transform ${
                        selectedSlotId === String(slot.id)
                          ? "text-primary translate-x-1"
                          : "text-primary"
                      }`}
                    />
                  </div>
                ))
              )}
              {closers.every((c) => c.slots.length === 0) && (
                <p className="text-center text-on-surface-variant py-4">
                  No hay slots disponibles
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={handleProposal}
            disabled={
              !phone || !billFile || !selectedSlotId || !selectedCloserId || saving
            }
            className="w-full h-14 uppercase tracking-widest"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Confirmar Cita"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function OutcomeTab({
  icon: Icon,
  label,
  isActive,
  onClick,
  color,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  color: "primary" | "secondary";
}) {
  return (
    <button
      onClick={onClick}
      className={`outcome-tab flex flex-col items-center justify-center p-6 rounded-xl glass-panel border-2 transition-all active:scale-95 ${
        isActive
          ? color === "secondary"
            ? "border-secondary bg-secondary/5"
            : "border-primary bg-primary/5"
          : "border-transparent hover:bg-surface-container-high"
      }`}
    >
      <Icon
        className={`w-8 h-8 mb-2 ${
          isActive
            ? color === "secondary"
              ? "text-secondary"
              : "text-primary"
            : "text-on-surface-variant"
        }`}
      />
      <span className="font-semibold text-sm uppercase tracking-wider text-on-surface">
        {label}
      </span>
    </button>
  );
}
