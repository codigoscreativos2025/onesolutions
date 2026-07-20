"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  DoorOpen,
  CalendarX,
  XCircle,
  CheckCircle,
  Upload,
  Phone,
  User,
  Loader2,
  FileText,
  Tag,
  MessageSquare,
  Briefcase,
} from "lucide-react";
import { LocationValidator } from "@/components/map/LocationValidator";
import { SlotPicker } from "@/components/calendar/SlotPicker";
import { QuoteModal } from "@/components/quote/QuoteModal";
import { ContractModal } from "@/components/quote/ContractModal";

interface NotAvailableTag {
  id: number;
  name: string;
  color: string;
}

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
  projectDetails?: Record<string, unknown> | null;
  chatRoom?: { id: number } | null;
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

const tabTransition = { duration: 0.35, ease: "easeOut" as const };

function CelebrationOverlay({ onComplete }: { onComplete: () => void }) {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 10 + 6,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.8,
    duration: Math.random() * 1.5 + 1.5,
    color: [
      "#fb7800", "#FFD700", "#FF6B6B", "#4ECDC4", "#A78BFA",
      "#34D399", "#60A5FA", "#F472B6",
    ][Math.floor(Math.random() * 8)],
  }));

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 1200);
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ scale: 0, rotate: 0, opacity: 1 }}
          animate={{
            scale: [0, 1.5, 0],
            rotate: p.rotation + 360,
            opacity: [1, 1, 0],
            y: [0, -200 - Math.random() * 200],
            x: [0, (Math.random() - 0.5) * 150],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
      <motion.div
        className="text-center relative z-10"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <motion.div
          className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl shadow-primary/40"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        <motion.h2
          className="mt-6 text-3xl font-headline font-bold text-white drop-shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          Proyecto Cerrado!
        </motion.h2>
        <motion.p
          className="mt-2 text-white/70 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Excelente trabajo
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

function calculateProjectCompletion(details: Record<string, string>): number {
  const requiredFields = ["clientName", "clientEmail", "address", "closingDate", "paymentMethod"];
  const filled = requiredFields.filter((f) => details[f] && details[f] !== "");
  return filled.length === 0 ? 0 : Math.round((filled.length / requiredFields.length) * 100);
}

export default function VisitPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const parcelId = params.parcelId as string;

  const [visit, setVisit] = useState<Visit | null>(null);
  const [objections, setObjections] = useState<Objection[]>([]);
  const [closerObjections, setCloserObjections] = useState<Objection[]>([]);
  const [closers, setClosers] = useState<Closer[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [notAvailableTags, setNotAvailableTags] = useState<NotAvailableTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const [selectedNotAvailableTags, setSelectedNotAvailableTags] = useState<number[]>([]);
  const [notAvailableNotes, setNotAvailableNotes] = useState("");

  const [selectedObjections, setSelectedObjections] = useState<number[]>([]);
  const [selectedCloserObjections, setSelectedCloserObjections] = useState<number[]>([]);
  const [objectionNotes, setObjectionNotes] = useState("");

  const [billFile, setBillFile] = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState("");
  const [billFileName, setBillFileName] = useState("");

  const [phone, setPhone] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [selectedCloserId, setSelectedCloserId] = useState("");
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<number[]>([]);
  const [proposalNotes, setProposalNotes] = useState("");
  const [closingNotes, setClosingNotes] = useState("");

  const [projectDetailsForm, setProjectDetailsForm] = useState<Record<string, string>>({});
  const [savingProjectDetails, setSavingProjectDetails] = useState(false);

  const [saving, setSaving] = useState(false);
  const [showLocationValidator, setShowLocationValidator] = useState(false);
  const [locationValidated, setLocationValidated] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const [showCelebration, setShowCelebration] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showProjectTypeSelector, setShowProjectTypeSelector] = useState(false);

  const isCloser = session?.user?.role === "CLOSER";
  const isClosingMode = isCloser;

  const isStartProject = visit
    ? visit.stage === "PROPOSAL_ACCEPTED" || visit.stage === "IN_PROGRESS"
    : false;

  const projectCompletion = calculateProjectCompletion(projectDetailsForm);

  useEffect(() => {
    fetchData();
  }, [parcelId]);

  const fetchData = async () => {
    try {
      const fetches: Promise<Response>[] = [
        fetch(`/api/visits/active?parcelId=${parcelId}`),
        fetch("/api/objections"),
        fetch("/api/closers"),
        fetch("/api/project-types"),
        fetch("/api/admin/not-available-tags"),
      ];

      if (isCloser) {
        fetches.push(fetch("/api/closer-objections"));
      }

      const results = await Promise.all(fetches);

      if (!results[0].ok) {
        setLoading(false);
        return;
      }

      const visitData = await results[0].json();
      const objData = await results[1].json();
      const closersData = await results[2].json();
      const projectTypesData = await results[3].json();

      let tagsData: NotAvailableTag[] = [];
      try {
        tagsData = await results[4].json();
      } catch {
        tagsData = [];
      }

      let closerObjData: Objection[] = [];
      if (isCloser && results.length > 5) {
        try {
          closerObjData = await results[5].json();
        } catch {
          closerObjData = [];
        }
      }

      setVisit(visitData);
      setObjections(objData);
      setCloserObjections(closerObjData);
      setClosers(closersData);
      setProjectTypes(projectTypesData);
      setNotAvailableTags(tagsData);

      if (isCloser && closersData.length === 1) {
        setSelectedCloserId(String(closersData[0].id));
      }

      if (visitData?.projects) {
        setSelectedProjectTypes(
          visitData.projects.map((p: { projectType: { id: number } }) => p.projectType.id)
        );
      }

      if (visitData?.parcel?.metadata) {
        try {
          const metadata = JSON.parse(visitData.parcel.metadata);
          if (metadata.isManual) {
            setPhone(metadata.phone || "");
            setClientName(visitData.parcel.ownerName || metadata.ownerName || "");
            setClientEmail(metadata.email || "");
            setProposalNotes(metadata.notes || "");
          }
        } catch {
          // metadata parse failed, ignore
        }
      }

      if (visitData?.bill) {
        if (visitData.bill.clientName) setClientName(visitData.bill.clientName);
        if (visitData.bill.phone) setPhone(visitData.bill.phone);
        if (visitData.bill.clientEmail) setClientEmail(visitData.bill.clientEmail);
      }

      if (visitData?.projectDetails) {
        const raw = visitData.projectDetails as Record<string, unknown>;
        const form: Record<string, string> = {};
        for (const [k, v] of Object.entries(raw)) {
          if (v !== null && v !== undefined) {
            form[k] = String(v);
          }
        }
        setProjectDetailsForm(form);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isManualLead = (() => {
    try {
      const m = JSON.parse(visit?.parcel?.metadata || "{}");
      return m.isManual === true;
    } catch {
      return false;
    }
  })();

  const needsLocationValidation =
    !isCloser && !isManualLead && !locationValidated && session?.user?.locationValidationEnabled !== false;

  const executeWithLocationCheck = (action: string, handler: () => Promise<void>) => {
    if (needsLocationValidation) {
      setPendingAction(action);
      setShowLocationValidator(true);
      return;
    }
    handler();
  };

  const handleNotAvailable = async () => {
    if (selectedNotAvailableTags.length === 0 || !visit) return;

    const doSubmit = async () => {
      setSaving(true);
      try {
        const res = await fetch(`/api/visits/${visit.id}/not-available`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tagIds: selectedNotAvailableTags,
            notes: notAvailableNotes || null,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Error al registrar");
        }

        toast.success("No disponible registrado correctamente");
        router.push("/map");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al registrar");
      } finally {
        setSaving(false);
      }
    };

    executeWithLocationCheck("notAvailable", doSubmit);
  };

  const handleObjection = async () => {
    if (selectedObjections.length === 0 || !visit) return;

    const doSubmit = async () => {
      setSaving(true);
      try {
        const res = await fetch(`/api/visits/${visit.id}/objection`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            objectionIds: selectedObjections,
            notes: objectionNotes,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Error al registrar objeción");
        }

        toast.success("Objeción registrada correctamente");
        router.push("/map");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al registrar");
      } finally {
        setSaving(false);
      }
    };

    executeWithLocationCheck("objection", doSubmit);
  };

  const handleCloserObjection = async () => {
    if (selectedCloserObjections.length === 0 || !visit) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/visits/${visit.id}/closer-objection`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectionIds: selectedCloserObjections,
          notes: objectionNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al registrar objeción");
      }

      toast.success("Objeción registrada correctamente");
      router.push("/map");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al registrar");
    } finally {
      setSaving(false);
    }
  };

  const handleStartProject = async () => {
    if (!visit) return;

    if (!clientName) {
      toast.error("El nombre del cliente es requerido");
      return;
    }

    setSaving(true);
    try {
      let billImageUrl = "";
      if (billFile) {
        const formData = new FormData();
        formData.append("file", billFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        billImageUrl = uploadData.url;
      }

      const res = await fetch(`/api/visits/${visit.id}/close`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: closingNotes || clientName,
          billImageUrl,
          billFileName: billFileName || billFile?.name || "",
          action: "start-project",
          clientName: clientName || undefined,
          clientEmail: clientEmail || undefined,
          clientPhone: phone || undefined,
          projectTypeIds: selectedProjectTypes.length > 0 ? selectedProjectTypes : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al iniciar proyecto");
      }

      await saveProjectDetailsInternal();

      toast.success("Proyecto iniciado correctamente");
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al procesar");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseProject = async () => {
    if (!visit) return;

    setSaving(true);
    try {
      await saveProjectDetailsInternal();

      let billImageUrl = "";
      if (billFile) {
        const formData = new FormData();
        formData.append("file", billFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        billImageUrl = uploadData.url;
      }

      const res = await fetch(`/api/visits/${visit.id}/close`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: closingNotes || clientName,
          billImageUrl,
          billFileName: billFileName || billFile?.name || "",
          clientName: projectDetailsForm.clientName || clientName || undefined,
          clientEmail: projectDetailsForm.clientEmail || clientEmail || undefined,
          clientPhone: phone || undefined,
          projectTypeIds: selectedProjectTypes.length > 0 ? selectedProjectTypes : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al cerrar proyecto");
      }

      setShowCelebration(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al procesar");
    } finally {
      setSaving(false);
    }
  };

  const saveProjectDetailsInternal = async () => {
    if (!visit) return;
    const nonEmpty = Object.fromEntries(
      Object.entries(projectDetailsForm).filter(([, v]) => v !== "" && v !== null && v !== undefined)
    );
    if (Object.keys(nonEmpty).length === 0) return;

    try {
      await fetch("/api/project-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId: visit.id, ...nonEmpty }),
      });
    } catch {
      // silent
    }
  };

  const handleSaveProjectDetails = async () => {
    if (!visit) return;
    setSavingProjectDetails(true);
    try {
      const nonEmpty = Object.fromEntries(
        Object.entries(projectDetailsForm).filter(([, v]) => v !== "" && v !== null && v !== undefined)
      );
      const res = await fetch("/api/project-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId: visit.id, ...nonEmpty }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar");
      }
      toast.success("Detalles guardados correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSavingProjectDetails(false);
    }
  };

  const handleCreateChat = async () => {
    if (!visit) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/visits/${visit.id}/create-chat`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear chat");
      }
      toast.success("Chat creado correctamente");
      router.push("/chat");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear chat");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProjectTypes = async () => {
    if (!visit) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/visits/${visit.id}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId: visit.id, projectTypeIds: selectedProjectTypes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al actualizar proyectos");
      }
      toast.success("Proyectos actualizados correctamente");
      setShowProjectTypeSelector(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleProposal = async () => {
    if (!visit) return;

    const doSubmit = async () => {
      setSaving(true);

      try {
        if (!phone || !selectedSlotId || !selectedCloserId || selectedProjectTypes.length === 0) {
          setSaving(false);
          toast.error("Completa todos los campos requeridos");
          return;
        }

        let billImageUrl = "";
        if (billFile) {
          const formData = new FormData();
          formData.append("file", billFile);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          const uploadData = await uploadRes.json();
          billImageUrl = uploadData.url;
        }

        const res = await fetch(`/api/visits/${visit.id}/proposal`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            clientName,
            clientEmail,
            billImageUrl,
            slotId: selectedSlotId,
            closerId: selectedCloserId,
            projectTypeIds: selectedProjectTypes,
            notes: proposalNotes,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Error al registrar propuesta");
        }

        toast.success("Propuesta registrada correctamente");
        router.push("/map");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al procesar");
      } finally {
        setSaving(false);
      }
    };

    executeWithLocationCheck("proposal", doSubmit);
  };

  const handleCancel = async () => {
    if (!visit) return;
    const reason = prompt("Motivo de cancelación:");
    if (reason === null) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/visits/${visit.id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al cancelar");
      }

      toast.success("Proyecto cancelado");
      router.push("/my-projects");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cancelar");
    } finally {
      setSaving(false);
    }
  };

  const handleLocationValidated = useCallback(async () => {
    setLocationValidated(true);
    setShowLocationValidator(false);

    if (pendingAction === "notAvailable") {
      await handleNotAvailable();
    } else if (pendingAction === "objection") {
      await handleObjection();
    } else if (pendingAction === "proposal") {
      await handleProposal();
    }

    setPendingAction(null);
  }, [pendingAction, visit, selectedNotAvailableTags, notAvailableNotes, selectedObjections, objectionNotes]);

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

  const toggleCloserObjection = (id: number) => {
    setSelectedCloserObjections((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  const toggleProjectType = (id: number) => {
    setSelectedProjectTypes((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleNotAvailableTag = (id: number) => {
    setSelectedNotAvailableTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleProjectDetailChange = (key: string, value: string) => {
    setProjectDetailsForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    toast.success("Proyecto cerrado exitosamente!");
    router.push("/my-projects");
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
      <motion.div
        className="text-center py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-on-surface-variant">No se encontró visita activa</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/map")}
        >
          Volver al mapa
        </Button>
      </motion.div>
    );
  }

  const tabThreeLabel = isClosingMode
    ? isStartProject
      ? "Iniciar Proyecto"
      : "Cerrar Proyecto"
    : "Acepta Propuesta";

  return (
    <div className="space-y-6 pb-8">
      <AnimatePresence>
        {showCelebration && (
          <CelebrationOverlay onComplete={handleCelebrationComplete} />
        )}
      </AnimatePresence>

      <QuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        visitId={visit.id}
      />

      <ContractModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        visitId={visit.id}
      />

      <motion.header
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => router.push("/map")}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-primary" />
        </button>
        <div className="flex-1">
          <h1 className="font-headline text-xl font-bold text-primary">
            One Solutions
          </h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowProjectTypeSelector(!showProjectTypeSelector)}
          className="text-xs gap-1.5"
        >
          <Briefcase className="w-4 h-4" />
          Cambiar Proyectos
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowQuoteModal(true)}
          className="text-xs gap-1.5"
        >
          <FileText className="w-4 h-4" />
          Ver Cotización
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowContractModal(true)}
          className="text-xs gap-1.5"
        >
          <FileText className="w-4 h-4" />
          Documentos
        </Button>
      </motion.header>

      {showProjectTypeSelector && (
        <motion.section
          className="glass-panel rounded-xl p-4 space-y-3"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
              Seleccionar Tipos de Proyecto
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {projectTypes.map((pt) => (
              <motion.button
                key={pt.id}
                onClick={() => toggleProjectType(pt.id)}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
                  selectedProjectTypes.includes(pt.id)
                    ? "bg-primary/10 border-primary text-primary shadow-sm"
                    : "bg-surface-container-lowest border-outline-variant text-on-surface hover:border-primary/30"
                }`}
              >
                {pt.name}
              </motion.button>
            ))}
          </div>
          <Button
            onClick={handleUpdateProjectTypes}
            disabled={saving}
            variant="outline"
            size="sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Cambios"}
          </Button>
        </motion.section>
      )}

      <motion.section
        className="glass-panel rounded-xl p-4 flex justify-between items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary">
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-on-surface">
              {visit.parcel.address}
            </h2>
            <p className="text-sm text-on-surface-variant">Visita en curso</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full border border-primary/20">
          Activa
        </span>
      </motion.section>

      <motion.section
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        <motion.h3
          className="font-headline text-lg font-bold text-on-surface mb-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" as const }}
        >
          Resultado de la Visita
        </motion.h3>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.3, ease: "easeOut" as const }}
        >
          <OutcomeTab
            icon={CalendarX}
            label="No Disponible"
            isActive={activeTab === "no-disponible"}
            onClick={() =>
              setActiveTab(activeTab === "no-disponible" ? null : "no-disponible")
            }
            color="primary"
          />
          <OutcomeTab
            icon={XCircle}
            label="Objeción"
            isActive={activeTab === "objecion"}
            onClick={() =>
              setActiveTab(activeTab === "objecion" ? null : "objecion")
            }
            color="secondary"
          />
          <OutcomeTab
            icon={CheckCircle}
            label={tabThreeLabel}
            isActive={activeTab === "propuesta"}
            onClick={() =>
              setActiveTab(activeTab === "propuesta" ? null : "propuesta")
            }
            color="primary"
          />
        </motion.div>
      </motion.section>

      <AnimatePresence mode="wait">
        {activeTab === "no-disponible" && (
          <motion.div
            key="no-disponible"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={tabTransition}
            className="glass-panel rounded-xl p-6 space-y-6"
          >
            <div className="flex items-center gap-2 text-primary">
              <CalendarX className="w-5 h-5" />
              <h4 className="font-semibold uppercase tracking-wider text-sm">
                No Disponible
              </h4>
            </div>

            {notAvailableTags.length === 0 ? (
              <div className="text-center py-6">
                <Tag className="w-10 h-10 text-on-surface-variant mx-auto mb-3 opacity-40" />
                <p className="text-on-surface-variant text-sm">
                  No hay etiquetas de &quot;No Disponible&quot; configuradas.
                  Contacta a un administrador.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Selecciona el motivo
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {notAvailableTags.map((tag) => {
                      const isSelected = selectedNotAvailableTags.includes(tag.id);
                      return (
                        <motion.button
                          key={tag.id}
                          onClick={() => toggleNotAvailableTag(tag.id)}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
                            isSelected
                              ? "border-primary/60 bg-primary/10 text-primary shadow-sm"
                              : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/30 hover:bg-primary/5"
                          }`}
                        >
                          {tag.name}
                        </motion.button>
                      );
                    })}
                  </div>
                  {selectedNotAvailableTags.length === 0 && (
                    <p className="text-xs text-secondary italic">
                      Selecciona al menos una etiqueta
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notAvailableNotes}
                    onChange={(e) => setNotAvailableNotes(e.target.value)}
                    className="w-full min-h-[80px] bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-xl p-4 resize-none text-on-surface"
                    placeholder="Notas adicionales..."
                  />
                </div>

                <Button
                  onClick={handleNotAvailable}
                  disabled={selectedNotAvailableTags.length === 0 || saving}
                  className="w-full h-14 uppercase tracking-widest"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Registrar"
                  )}
                </Button>
              </>
            )}
          </motion.div>
        )}

        {activeTab === "objecion" && (
          <motion.div
            key="objecion"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={tabTransition}
            className="glass-panel rounded-xl p-6 space-y-6"
          >
            <div className="flex items-center gap-2 text-secondary">
              <XCircle className="w-5 h-5" />
              <h4 className="font-semibold uppercase tracking-wider text-sm">
                Registrar Objeciones
              </h4>
            </div>

            {isClosingMode && closerObjections.length === 0 ? (
              <div className="text-center py-6">
                <Tag className="w-10 h-10 text-on-surface-variant mx-auto mb-3 opacity-40" />
                <p className="text-on-surface-variant text-sm">
                  No hay objeciones de closer configuradas. Contacta a un administrador.
                </p>
              </div>
            ) : !isClosingMode && objections.length === 0 ? (
              <div className="text-center py-6">
                <Tag className="w-10 h-10 text-on-surface-variant mx-auto mb-3 opacity-40" />
                <p className="text-on-surface-variant text-sm">
                  No hay objeciones configuradas. Contacta a un administrador.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {isClosingMode
                    ? closerObjections.map((obj) => (
                        <motion.button
                          key={obj.id}
                          onClick={() => toggleCloserObjection(obj.id)}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
                            selectedCloserObjections.includes(obj.id)
                              ? "bg-secondary/10 border-secondary text-secondary shadow-sm"
                              : "bg-surface-container-lowest border-outline-variant text-on-surface hover:border-secondary/40"
                          }`}
                        >
                          {obj.name}
                        </motion.button>
                      ))
                    : objections.map((obj) => (
                        <motion.button
                          key={obj.id}
                          onClick={() => toggleObjection(obj.id)}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
                            selectedObjections.includes(obj.id)
                              ? "bg-secondary/10 border-secondary text-secondary shadow-sm"
                              : "bg-surface-container-lowest border-outline-variant text-on-surface hover:border-secondary/40"
                          }`}
                        >
                          {obj.name}
                        </motion.button>
                      ))}
                </div>
                {(isClosingMode && selectedCloserObjections.length === 0) ||
                  (!isClosingMode && selectedObjections.length === 0) ? (
                  <p className="text-xs text-secondary italic">
                    Selecciona al menos una objeción
                  </p>
                ) : null}
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
                  onClick={isClosingMode ? handleCloserObjection : handleObjection}
                  disabled={
                    isClosingMode
                      ? selectedCloserObjections.length === 0 || saving
                      : selectedObjections.length === 0 || saving
                  }
                  variant="secondary"
                  className="w-full h-14 uppercase tracking-widest"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Registrar"}
                </Button>
              </>
            )}
          </motion.div>
        )}

        {activeTab === "propuesta" && isClosingMode && (
          <CloserForm
            visit={visit}
            clientName={clientName}
            setClientName={setClientName}
            clientEmail={clientEmail}
            setClientEmail={setClientEmail}
            phone={phone}
            setPhone={setPhone}
            projectTypes={projectTypes}
            selectedProjectTypes={selectedProjectTypes}
            toggleProjectType={toggleProjectType}
            billFile={billFile}
            billPreview={billPreview}
            billFileName={billFileName}
            setBillFileName={setBillFileName}
            handleFileChange={handleFileChange}
            setBillFile={setBillFile}
            setBillPreview={setBillPreview}
            closingNotes={closingNotes}
            setClosingNotes={setClosingNotes}
            saving={saving}
            savingProjectDetails={savingProjectDetails}
            handleStartProject={handleStartProject}
            handleCloseProject={handleCloseProject}
            handleCancel={handleCancel}
            handleSaveProjectDetails={handleSaveProjectDetails}
            handleCreateChat={handleCreateChat}
            projectDetailsForm={projectDetailsForm}
            onProjectDetailChange={handleProjectDetailChange}
            projectCompletion={projectCompletion}
            onUpdateProjectTypes={handleUpdateProjectTypes}
          />
        )}

        {activeTab === "propuesta" && !isClosingMode && (
          <motion.div
            key="propuesta"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={tabTransition}
            className="glass-panel rounded-xl p-6 space-y-6"
          >
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle className="w-5 h-5" />
              <h4 className="font-semibold uppercase tracking-wider text-sm">
                Nueva Oportunidad
              </h4>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Paso 1: Subir Recibo de Luz (opcional)
              </label>
              <label className="w-full h-32 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center bg-surface-container-lowest hover:bg-primary/5 transition-colors cursor-pointer group">
                <Upload className="w-8 h-8 text-on-surface-variant group-hover:text-primary transition-colors" />
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
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <img
                    src={billPreview}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBillFile(null);
                      setBillPreview("");
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </motion.div>
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
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
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

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Paso 3: Seleccionar Proyectos
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProjectTypeSelector(!showProjectTypeSelector)}
                  className="text-[10px] gap-1"
                >
                  <Briefcase className="w-3 h-3" />
                  Cambiar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {projectTypes.map((pt) => (
                  <motion.button
                    key={pt.id}
                    onClick={() => toggleProjectType(pt.id)}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
                      selectedProjectTypes.includes(pt.id)
                        ? "bg-primary/10 border-primary text-primary shadow-sm"
                        : "bg-surface-container-lowest border-outline-variant text-on-surface hover:border-primary/30"
                    }`}
                  >
                    {pt.name}
                  </motion.button>
                ))}
              </div>
              {selectedProjectTypes.length === 0 && (
                <p className="text-xs text-secondary italic">
                  Selecciona al menos un proyecto
                </p>
              )}
            </div>

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

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Paso 4: Agendar con Closer
                </label>
                <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded uppercase font-bold">
                  Seleccionar Fecha y Hora
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface">
                  Selecciona un Closer
                </label>
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

              {selectedCloserId && (
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="text-sm font-medium text-on-surface">
                    Selecciona Fecha y Hora
                  </label>
                  <SlotPicker
                    closerId={parseInt(selectedCloserId)}
                    selectedSlotId={
                      selectedSlotId ? parseInt(selectedSlotId) : undefined
                    }
                    onSlotSelect={(slotId) =>
                      setSelectedSlotId(String(slotId))
                    }
                  />
                </motion.div>
              )}
            </div>

            <Button
              onClick={handleProposal}
              disabled={
                !phone ||
                !selectedSlotId ||
                !selectedCloserId ||
                selectedProjectTypes.length === 0 ||
                saving
              }
              className="w-full h-14 uppercase tracking-widest"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Confirmar Cita"
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

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
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      className={`outcome-tab flex flex-col items-center justify-center p-6 rounded-xl glass-panel border-2 transition-all ${
        isActive
          ? color === "secondary"
            ? "border-secondary bg-secondary/5 shadow-lg shadow-secondary/10"
            : "border-primary bg-primary/5 shadow-lg shadow-primary/10"
          : "border-transparent hover:bg-surface-container-high hover:border-outline-variant"
      }`}
    >
      <Icon
        className={`w-8 h-8 mb-2 transition-colors ${
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
    </motion.button>
  );
}

function CloserForm({
  visit,
  clientName,
  setClientName,
  clientEmail,
  setClientEmail,
  phone,
  setPhone,
  projectTypes,
  selectedProjectTypes,
  toggleProjectType,
  billFile,
  billPreview,
  billFileName,
  setBillFileName,
  handleFileChange,
  setBillFile,
  setBillPreview,
  closingNotes,
  setClosingNotes,
  saving,
  savingProjectDetails,
  handleStartProject,
  handleCloseProject,
  handleCancel,
  handleSaveProjectDetails,
  handleCreateChat,
  projectDetailsForm,
  onProjectDetailChange,
  projectCompletion,
  onUpdateProjectTypes,
}: {
  visit: Visit;
  clientName: string;
  setClientName: (v: string) => void;
  clientEmail: string;
  setClientEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  projectTypes: ProjectType[];
  selectedProjectTypes: number[];
  toggleProjectType: (id: number) => void;
  billFile: File | null;
  billPreview: string;
  billFileName: string;
  setBillFileName: (v: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setBillFile: (f: File | null) => void;
  setBillPreview: (v: string) => void;
  closingNotes: string;
  setClosingNotes: (v: string) => void;
  saving: boolean;
  savingProjectDetails: boolean;
  handleStartProject: () => void;
  handleCloseProject: () => void;
  handleCancel: () => void;
  handleSaveProjectDetails: () => void;
  handleCreateChat: () => void;
  projectDetailsForm: Record<string, string>;
  onProjectDetailChange: (key: string, value: string) => void;
  projectCompletion: number;
  onUpdateProjectTypes: () => void;
}) {
  const isStartProject =
    visit.stage === "PROPOSAL_ACCEPTED" || visit.stage === "IN_PROGRESS";
  const isProject = visit.stage === "PROJECT";
  const isFullyComplete = projectCompletion === 100;

  const PROJECT_DETAIL_FIELDS = [
    { key: "clientName", label: "Nombre del Cliente", type: "text", placeholder: "Nombre completo" },
    { key: "clientEmail", label: "Email del Cliente", type: "email", placeholder: "correo@ejemplo.com" },
    { key: "address", label: "Dirección", type: "text", placeholder: "Dirección del proyecto" },
    { key: "closingDate", label: "Fecha de Cierre", type: "date", placeholder: "" },
    { key: "paymentMethod", label: "Método de Pago", type: "text", placeholder: "Efectivo, Transferencia..." },
  ];

  return (
    <motion.div
      key="closer-form"
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.35, ease: "easeOut" as const }}
      className="glass-panel rounded-xl p-6 space-y-6"
    >
      <div className="flex items-center gap-2 text-primary">
        <CheckCircle className="w-5 h-5" />
        <h4 className="font-semibold uppercase tracking-wider text-sm">
          {isStartProject ? "Iniciar Proyecto" : isProject ? "Cerrar Proyecto" : "Proyecto"}
        </h4>
      </div>

      {isProject && (
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-on-surface-variant font-medium">
            <span>Progreso de Información</span>
            <span>{projectCompletion}%</span>
          </div>
          <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                isFullyComplete ? "bg-green-500" : projectCompletion >= 50 ? "bg-yellow-500" : "bg-red-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${projectCompletion}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {isFullyComplete && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              Información completa — puedes cerrar el proyecto
            </p>
          )}
        </div>
      )}

      {isProject && (
        <div className="space-y-4">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Detalles del Proyecto
          </label>
          {PROJECT_DETAIL_FIELDS.map((field) => (
            <div key={field.key} className="relative">
              <input
                type={field.type}
                value={projectDetailsForm[field.key] || ""}
                onChange={(e) => onProjectDetailChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
              />
            </div>
          ))}
          <Button
            onClick={handleSaveProjectDetails}
            disabled={savingProjectDetails}
            variant="outline"
            className="w-full"
          >
            {savingProjectDetails ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Guardar Detalles"
            )}
          </Button>
        </div>
      )}

      {!isProject && (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Información del Cliente
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nombre del cliente *"
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
            />
          </div>
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Correo electrónico"
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
            />
          </div>
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
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Tipo de Proyecto
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={onUpdateProjectTypes}
            disabled={saving || selectedProjectTypes.length === 0}
            className="text-[10px] gap-1"
          >
            <Briefcase className="w-3 h-3" />
            Actualizar
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {projectTypes.map((pt) => (
            <motion.button
              key={pt.id}
              onClick={() => toggleProjectType(pt.id)}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
                selectedProjectTypes.includes(pt.id)
                  ? "bg-primary/10 border-primary text-primary shadow-sm"
                  : "bg-surface-container-lowest border-outline-variant text-on-surface hover:border-primary/30"
              }`}
            >
              {pt.name}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          Adjuntar documento (opcional)
        </label>
        <label className="w-full h-32 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center bg-surface-container-lowest hover:bg-primary/5 transition-colors cursor-pointer group">
          <Upload className="w-8 h-8 text-on-surface-variant group-hover:text-primary transition-colors" />
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
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <img
              src={billPreview}
              alt="Preview"
              className="w-full h-40 object-cover rounded-xl"
            />
            <button
              type="button"
              onClick={() => {
                setBillFile(null);
                setBillPreview("");
              }}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          Nombre del archivo
        </label>
        <input
          value={billFileName}
          onChange={(e) => setBillFileName(e.target.value)}
          placeholder="Ej: Contrato firmado, Documento de cierre..."
          className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          Notas
        </label>
        <textarea
          value={closingNotes}
          onChange={(e) => setClosingNotes(e.target.value)}
          className="w-full min-h-[120px] bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-xl p-4 resize-none text-on-surface"
          placeholder="Detalles del cierre..."
        />
      </div>

      <div className="space-y-3">
        {isProject && isFullyComplete && (
          <Button
            onClick={handleCreateChat}
            disabled={saving}
            variant="outline"
            className="w-full h-14 gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            Crear Chat
          </Button>
        )}

        <Button
          onClick={isProject ? handleCloseProject : handleStartProject}
          disabled={
            isProject
              ? !isFullyComplete || saving
              : isStartProject
              ? !clientName || saving
              : saving
          }
          className="w-full h-14 uppercase tracking-widest"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isStartProject ? (
            "Iniciar Proyecto"
          ) : (
            "Cerrar Proyecto"
          )}
        </Button>

        {isProject && (
          <Button
            onClick={handleCancel}
            variant="secondary"
            disabled={saving}
            className="w-full h-14 uppercase tracking-widest"
          >
            Cancelar Proyecto
          </Button>
        )}
      </div>
    </motion.div>
  );
}
