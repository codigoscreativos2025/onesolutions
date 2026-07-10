"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  Loader2,
} from "lucide-react";
import { LocationValidator } from "@/components/map/LocationValidator";
import { SlotPicker } from "@/components/calendar/SlotPicker";

interface Visit {
  id: number;
  parcel: {
    address: string;
    geometry?: string;
    metadata?: string;
    ownerName?: string;
  };
  stage: string;
  projects?: {
    projectType: {
      id: number;
      name: string;
    };
  }[];
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

interface ProjectType {
  id: number;
  name: string;
  description?: string;
}

export default function VisitPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const parcelId = params.parcelId as string;
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const mode = searchParams?.get('mode');

  const [visit, setVisit] = useState<Visit | null>(null);
  const [objections, setObjections] = useState<Objection[]>([]);
  const [closers, setClosers] = useState<Closer[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
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
  const [clientEmail, setClientEmail] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [selectedCloserId, setSelectedCloserId] = useState("");
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<number[]>([]);
  const [proposalNotes, setProposalNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showLocationValidator, setShowLocationValidator] = useState(false);
  const [locationValidated, setLocationValidated] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const isClosingMode =
    session?.user?.role === "CLOSER" && (visit?.stage === "PROPOSAL_ACCEPTED" || mode === "closer");

  useEffect(() => {
    fetchData();
  }, [parcelId]);

  const fetchData = async () => {
    try {
      const [visitRes, objRes, closersRes, projectTypesRes] = await Promise.all([
        fetch(`/api/visits/active?parcelId=${parcelId}`),
        fetch("/api/objections"),
        fetch("/api/closers"),
        fetch("/api/project-types"),
      ]);

      if (!visitRes.ok) {
        setLoading(false);
        return;
      }

      const visitData = await visitRes.json();
      const objData = await objRes.json();
      const closersData = await closersRes.json();
      const projectTypesData = await projectTypesRes.json();

      setVisit(visitData);
      setObjections(objData);
      setClosers(closersData);
      setProjectTypes(projectTypesData);

      if (session?.user?.role === "CLOSER" && closersData.length === 1) {
        setSelectedCloserId(String(closersData[0].id));
      }

      // Cargar proyectos ya seleccionados si existen
      if (visitData?.projects) {
        setSelectedProjectTypes(
          visitData.projects.map((p: { projectType: { id: number } }) => p.projectType.id)
        );
      }

      // Precargar datos de lead manual si existe metadata
      if (visitData?.parcel?.metadata) {
        try {
          const metadata = JSON.parse(visitData.parcel.metadata);
          if (metadata.isManual) {
            setPhone(metadata.phone || "");
            setClientName(visitData.parcel.ownerName || metadata.ownerName || "");
            setClientEmail(metadata.email || "");
            setProposalNotes(metadata.notes || "");
          }
        } catch {}
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotAvailable = async () => {
    if (!scheduledDate || !scheduledTime || !visit) return;

    // Los closers no necesitan validar ubicación
    const isCloser = session?.user?.role === 'CLOSER';

    // Validar ubicación antes de continuar (solo si no es closer)
    if (!locationValidated && !isCloser) {
      setPendingAction('notAvailable');
      setShowLocationValidator(true);
      return;
    }

    setSaving(true);
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    await fetch(`/api/visits/${visit.id}/not-available`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt }),
    });

    setSaving(false);
    router.push("/map");
  };

  const handleObjection = async () => {
    if (selectedObjections.length === 0 || !visit) return;

    // Los closers no necesitan validar ubicación
    const isCloser = session?.user?.role === 'CLOSER';

    // Validar ubicación antes de continuar (solo si no es closer)
    if (!locationValidated && !isCloser) {
      setPendingAction('objection');
      setShowLocationValidator(true);
      return;
    }

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
    router.push("/map");
  };

  const handleProposal = async () => {
    if (!visit) return;

    // Verificar si es un lead manual (sin geometría válida)
    const isManualLead = visit.parcel.geometry === '{"coordinates":[0,0],"type":"Point"}' || !visit.parcel.geometry;

    // Los closers no necesitan validar ubicación (solo los setters)
    const isCloser = session?.user?.role === 'CLOSER';

    // Validar ubicación antes de continuar (solo si no es lead manual y no es closer)
    if (!locationValidated && !isManualLead && !isCloser) {
      setPendingAction('proposal');
      setShowLocationValidator(true);
      return;
    }

    setSaving(true);

    if (isClosingMode) {
      if (billFile) {
        const formData = new FormData();
        formData.append("file", billFile);
        await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
      }

      await fetch(`/api/visits/${visit.id}/close`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: clientName,
        }),
      });

      setSaving(false);
      router.push("/my-projects");
      return;
    }

    if (!phone || !billFile || !selectedSlotId || !selectedCloserId || selectedProjectTypes.length === 0) {
      setSaving(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", billFile);
    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const uploadData = await uploadRes.json();

    // Guardar propuesta con proyectos seleccionados
    await fetch(`/api/visits/${visit.id}/proposal`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        clientName,
        clientEmail,
        billImageUrl: uploadData.url,
        slotId: selectedSlotId,
        closerId: selectedCloserId,
        projectTypeIds: selectedProjectTypes,
        notes: proposalNotes,
      }),
    });

    setSaving(false);
    router.push("/map");
  };

  const handleLocationValidated = async () => {
    setLocationValidated(true);
    setShowLocationValidator(false);

    // Ejecutar la acción pendiente
    if (pendingAction === 'notAvailable') {
      await handleNotAvailable();
    } else if (pendingAction === 'objection') {
      await handleObjection();
    } else if (pendingAction === 'proposal') {
      await handleProposal();
    }

    setPendingAction(null);
  };

  const handleLocationCancelled = () => {
    setShowLocationValidator(false);
    setPendingAction(null);
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

  const toggleProjectType = (id: number) => {
    setSelectedProjectTypes((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
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
          onClick={() => router.push("/map")}
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
          onClick={() => router.push("/map")}
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
              {isClosingMode ? "Cerrar Proyecto" : "Nueva Oportunidad"}
            </h4>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {isClosingMode
                ? "Adjuntar documento (opcional)"
                : "Paso 1: Subir Recibo de Luz (opcional)"}
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
              <div className="relative">
                <img
                  src={billPreview}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => { setBillFile(null); setBillPreview(""); }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {!isClosingMode && (
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
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                />
              </div>
            </div>
          )}

          {!isClosingMode && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Paso 3: Seleccionar Proyectos
              </label>
              <div className="flex flex-wrap gap-2">
                {projectTypes.map((pt) => (
                  <button
                    key={pt.id}
                    onClick={() => toggleProjectType(pt.id)}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                      selectedProjectTypes.includes(pt.id)
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-surface-container-lowest border-outline-variant text-on-surface hover:border-primary"
                    }`}
                  >
                    {pt.name}
                  </button>
                ))}
              </div>
              {selectedProjectTypes.length === 0 && (
                <p className="text-xs text-secondary italic">
                  Selecciona al menos un proyecto
                </p>
              )}
            </div>
          )}

          {!isClosingMode && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Notas adicionales
              </label>
              <textarea
                value={proposalNotes}
                onChange={(e) => setProposalNotes(e.target.value)}
                className="w-full min-h-[80px] bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-xl p-4 resize-none text-on-surface"
                placeholder="Información adicional sobre el cliente o la visita..."
              />
            </div>
          )}

          {!isClosingMode && (
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Paso 4: Agendar con Closer
                </label>
                <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded uppercase font-bold">
                  Seleccionar Fecha y Hora
                </span>
              </div>
              
              {/* Selector de Closer */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface">Selecciona un Closer</label>
                <select
                  value={selectedCloserId}
                  onChange={(e) => {
                    setSelectedCloserId(e.target.value);
                    setSelectedSlotId("");
                  }}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
                >
                  <option value="">-- Selecciona un Closer --</option>
                  {closers.map((closer) => (
                    <option key={closer.id} value={closer.id}>
                      {closer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Fecha y Hora */}
              {selectedCloserId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface">Selecciona Fecha y Hora</label>
                  <SlotPicker
                    closerId={parseInt(selectedCloserId)}
                    selectedSlotId={selectedSlotId ? parseInt(selectedSlotId) : undefined}
                    onSlotSelect={(slotId) => setSelectedSlotId(String(slotId))}
                  />
                </div>
              )}
            </div>
          )}

          {isClosingMode && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Notas de cierre
              </label>
              <textarea
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full min-h-[120px] bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-xl p-4 resize-none text-on-surface"
                placeholder="Detalles del cierre..."
              />
            </div>
          )}

          <Button
            onClick={handleProposal}
            disabled={
              isClosingMode
                ? saving
                : !phone || !selectedSlotId || !selectedCloserId || selectedProjectTypes.length === 0 || saving
            }
            className="w-full h-14 uppercase tracking-widest"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isClosingMode ? (
              "Cerrar Proyecto"
            ) : (
              "Confirmar Cita"
            )}
          </Button>
        </div>
      )}

      {/* Validador de Ubicación */}
      {showLocationValidator && (
        <LocationValidator
          parcelId={parcelId}
          onValidated={handleLocationValidated}
          onCancel={handleLocationCancelled}
        />
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
