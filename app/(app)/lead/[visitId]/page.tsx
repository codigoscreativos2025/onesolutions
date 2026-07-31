"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ContractModal } from "@/components/quote/ContractModal";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { SlotPicker } from "@/components/calendar/SlotPicker";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  User,
  FileText,
  MessageSquare,
  Clock,
  Package,
  Pencil,
  Save,
  Upload,
  X,
  Eye,
  BadgeCheck,
  ShieldAlert,
  RotateCcw,
  Trash2,
  CheckCircle,
  Calendar,
  Play,
  Tag,
} from "lucide-react";

const FIELD_LABEL_MAP: Record<string, string> = {
  clientName: "Nombre del Cliente",
  clientEmail: "Email del Cliente",
  address: "Dirección",
  closingDate: "Fecha de Cierre",
  paymentMethod: "Método de Pago",
  primaryRep: "Representante Principal",
  primaryRepCommPct: "% Comisión Principal",
  secondaryRep: "Representante Secundario",
  secondaryRepCommPct: "% Comisión Secundario",
  tertiaryRep: "Representante Terciario",
  tertiaryRepCommPct: "% Comisión Terciario",
  solarFinancier: "Financiadora Solar",
  systemSize: "Tamaño del Sistema",
  hoaInfo: "Información HOA",
  ppwSold: "PPW Vendido",
  umbrella: "Umbrella",
  clientIncentive: "Incentivo al Cliente",
  mpuPanels: "Paneles MPU",
  siteSurveyDate: "Fecha Site Survey",
  panelsUpCount: "Paneles a Subir",
  panelsDownCount: "Paneles a Bajar",
  panelsPhotoUrl: "Fotos de Paneles",
  solarCostPrice: "Precio Costo Solar",
  solarSalePrice: "Precio Venta Solar",
  solarCommission: "Comisión Solar",
  electricBillUrl: "Recibo de Luz",
  closingFormUrl: "Formulario de Cierre",
  homeInsuranceUrl: "Seguro de Hogar",
  homeTitleUrl: "Título de Propiedad",
  idDocumentUrl: "ID del Cliente",
  roofType: "Tipo de Techo",
  roofCostPrice: "Precio Costo Techo",
  roofSalePrice: "Precio Venta Techo",
  roofCommission: "Comisión Techo",
  nocUrl: "NOC",
  materialsOrderUrl: "Orden de Materiales",
  roofReportUrl: "Reporte de Techo",
  exteriorScopeUrl: "Exterior Scope",
  propertyPhotosJson: "Fotos de Propiedad",
  waterSystemType: "Tipo de Sistema de Agua",
  waterCostPrice: "Precio Costo Agua",
  waterSalePrice: "Precio Venta Agua",
  waterCommission: "Comisión Agua",
  otherCostPrice: "Precio Costo Otro",
  otherSalePrice: "Precio Venta Otro",
  otherCommission: "Comisión Otro",
};

const STAGE_LABELS: Record<string, string> = {
  IN_PROGRESS: "Lead",
  PROPOSAL_ACCEPTED: "Leads Potenciales",
  PROJECT: "En Proyecto",
  CLOSED: "Proyecto Cerrado",
  CANCELLED: "Cancelado",
};

const STAGE_COLORS: Record<string, string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-300",
  PROPOSAL_ACCEPTED: "bg-emerald-100 text-emerald-700 border-emerald-300",
  PROJECT: "bg-amber-100 text-amber-700 border-amber-300",
  CLOSED: "bg-violet-100 text-violet-700 border-violet-300",
  CANCELLED: "bg-red-100 text-red-700 border-red-300",
};

const COMMON_FIELDS = [
  "closingDate",
  "paymentMethod",
  "primaryRep",
  "primaryRepCommPct",
  "secondaryRep",
  "secondaryRepCommPct",
  "tertiaryRep",
  "tertiaryRepCommPct",
];

const FIELD_TYPES: Record<string, string> = {
  closingDate: "date",
  paymentMethod: "select",
  primaryRepCommPct: "number",
  secondaryRepCommPct: "number",
  tertiaryRepCommPct: "number",
  umbrella: "select",
  solarCommission: "number",
  roofCommission: "number",
  waterCommission: "number",
  panelsUpCount: "number",
  panelsDownCount: "number",
  solarCostPrice: "number",
  solarSalePrice: "number",
  roofCostPrice: "number",
  roofSalePrice: "number",
  waterCostPrice: "number",
  waterSalePrice: "number",
  siteSurveyDate: "date",
};

const FIELD_GROUPS: Record<string, { label: string; prefix: string }> = {
  solar: { label: "Panel Solar", prefix: "solar" },
  roof: { label: "Techo", prefix: "roof" },
  water: { label: "Purificador de Agua", prefix: "water" },
  panels: { label: "Paneles", prefix: "panels" },
  electric: { label: "Documentos", prefix: "electric" },
  id: { label: "Documentos", prefix: "id" },
  home: { label: "Documentos", prefix: "home" },
  noc: { label: "Documentos", prefix: "noc" },
  exterior: { label: "Documentos", prefix: "exterior" },
  property: { label: "Documentos", prefix: "property" },
  materials: { label: "Documentos", prefix: "materials" },
  closing: { label: "Documentos", prefix: "closing" },
};

const POST_CLOSURE_TAGS = ["En Instalación", "Instalado", "Finalizado"];

function groupFieldsByType(fields: { fieldName: string; fieldLabel?: string; fieldType?: string }[]) {
  const groups: Record<string, { fieldName: string; fieldLabel?: string; fieldType?: string }[]> = {};
  const other: typeof fields = [];
  for (const f of fields) {
    let grouped = false;
    for (const [key, g] of Object.entries(FIELD_GROUPS)) {
      if (f.fieldName.startsWith(g.prefix)) {
        if (!groups[key]) groups[key] = [];
        groups[key].push(f);
        grouped = true;
        break;
      }
    }
    if (!grouped) other.push(f);
  }
  return { groups, other };
}

const FILE_FIELD_KEYS = new Set([
  "electricBillUrl",
  "closingFormUrl",
  "homeInsuranceUrl",
  "homeTitleUrl",
  "idDocumentUrl",
  "nocUrl",
  "materialsOrderUrl",
  "roofReportUrl",
  "exteriorScopeUrl",
  "panelsPhotoUrl",
  "propertyPhotosJson",
]);

function fieldLabel(key: string): string {
  return FIELD_LABEL_MAP[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

function isFileFieldKey(key: string): boolean {
  return FILE_FIELD_KEYS.has(key);
}

function getTimelineColor(action: string): string {
  if (action === "Lead creado") return "#3b82f6";
  if (action === "Propuesta aceptada") return "#22c55e";
  if (action === "Proyecto iniciado") return "#eab308";
  if (action === "Cerrado") return "#8b5cf6";
  if (action === "Cancelado") return "#ef4444";
  if (action === "Objeción") return "#fb7800";
  if (action === "No disponible") return "#6b7280";
  return "#6b7280";
}

const OPTIONAL_FIELDS = ["secondaryRep", "secondaryRepCommPct", "tertiaryRep", "tertiaryRepCommPct"];

function calculateProjectCompletion(
  projectDetails: Record<string, unknown> | null | undefined,
  fieldMetas: { fieldName: string }[]
): number {
  if (!projectDetails) return 0;

  const requiredCommonFields = COMMON_FIELDS.filter((f) => !OPTIONAL_FIELDS.includes(f));
  let totalFields = requiredCommonFields.length;
  let completedFields = requiredCommonFields.filter(
    (f) => projectDetails[f] !== undefined && projectDetails[f] !== "" && projectDetails[f] !== null
  ).length;

  for (const field of OPTIONAL_FIELDS) {
    const val = projectDetails[field];
    if (val !== undefined && val !== "" && val !== null) {
      totalFields++;
      completedFields++;
    }
  }

  for (const meta of fieldMetas) {
    if (COMMON_FIELDS.includes(meta.fieldName) || FILE_FIELD_KEYS.has(meta.fieldName)) continue;
    totalFields++;
    const val = projectDetails[meta.fieldName];
    if (val !== undefined && val !== "" && val !== null) completedFields++;
  }

  return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
}

interface VisitDetails {
  id: number;
  stage: string;
  outcome: string | null;
  notes: string | null;
  scheduledAt?: string | null;
  createdAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  contractSignatures?: string | null;
  contractFields?: string | null;
  parcel: {
    id: string;
    address: string;
    ownerName: string | null;
    partnerId?: number | null;
    metadata: string | null;
    visitHistory?: {
      id: number;
      visitedAt: string;
      status: string;
      notes: string | null;
      setter: { id: number; name: string };
    }[];
  };
  setter: { id: number; name: string; email: string };
  closer?: { id: number; name: string; email: string } | null;
  bill?: {
    id: number;
    imageUrl: string;
    phone: string;
    clientName: string | null;
    clientEmail: string | null;
    notes: string | null;
    additionalFileUrl?: string | null;
    additionalFileName?: string | null;
  } | null;
  projectDetails?: Record<string, unknown> & { createdAt?: string };
  projects: { projectType: { id: number; name: string } }[];
  objections: { objection: { id: number; name: string; color: string }; notes: string | null }[];
  closerObjections: {
    closerObjection: { id: number; name: string; color: string };
    notes: string | null;
  }[];
  commissions?: { id: number; percentage: number; role: string; user: { id: number; name: string } }[];
  chatRoom?: { id: number } | null;
}

interface FieldMeta {
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  options?: string;
}

interface HistoryEntry {
  date: string;
  action: string;
  userName: string;
  userId?: number;
  details: string;
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const visitId = Number(params.visitId);
  const role = session?.user?.role ?? "";

  const [visit, setVisit] = useState<VisitDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("datos");

  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [fieldMetas, setFieldMetas] = useState<FieldMeta[]>([]);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [postCloseTags, setPostCloseTags] = useState<string[]>([]);
  const [tagSaving, setTagSaving] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [leadTags, setLeadTags] = useState<{ name: string; color: string }[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notAvailTags, setNotAvailTags] = useState<any[]>([]);

  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleCloserId, setScheduleCloserId] = useState("");
  const [scheduleSlotId, setScheduleSlotId] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [scheduleClosers, setScheduleClosers] = useState<any[]>([]);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const fetchVisitDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/visits/${visitId}/details`);
      if (!res.ok) throw new Error("Error fetching visit");
      const data = await res.json();
      setVisit(data);
    } catch {
      toast.error("Error al cargar los detalles del proyecto");
    } finally {
      setLoading(false);
    }
  };

  const initEditFields = useCallback(() => {
    if (!visit) return;
    const fields: Record<string, string> = {};
    const pd = visit.projectDetails || {};
    for (const key of COMMON_FIELDS) {
      const val = pd[key];
      if (val !== undefined && val !== null) {
        if (key === "closingDate" && typeof val === "string") {
          fields[key] = val.split("T")[0];
        } else {
          fields[key] = String(val);
        }
      } else {
        fields[key] = "";
      }
    }
    if (visit.bill) {
      if (visit.bill.clientName) fields._billClientName = visit.bill.clientName;
      if (visit.bill.clientEmail) fields._billClientEmail = visit.bill.clientEmail;
      if (visit.bill.phone) fields._billPhone = visit.bill.phone;
      if (visit.bill.notes) fields._billNotes = visit.bill.notes;
    }
    setEditFields(fields);
  }, [visit]);

  const fetchFieldMetas = useCallback(async () => {
    if (!visit?.projects?.length) return;
    const typeIds = visit.projects.map((p) => p.projectType.id);
    const seen = new Set<number>();
    const uniqueIds = typeIds.filter((id: number) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    const allMetas: FieldMeta[] = [];
    for (const typeId of uniqueIds) {
      try {
        const res = await fetch(`/api/admin/project-type-fields?projectTypeId=${typeId}`);
        const fields = await res.json();
        if (Array.isArray(fields)) allMetas.push(...fields);
      } catch { /* skip */ }
    }
    setFieldMetas(allMetas);
  }, [visit?.projects]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/visits/${visitId}/history`);
      if (res.ok) {
        const data = await res.json();
        if (data.history) {
          setHistory(
            data.history.map(
              (h: { date: string; action: string; userName: string; details: string }) => ({
                ...h,
                date: new Date(h.date).toLocaleString(),
              })
            )
          );
        }
      }
    } catch { /* skip */ } finally {
      setHistoryLoading(false);
    }
  };

  const parsePostClosureTags = useCallback(() => {
    if (!visit) return;
    try {
      if (visit.contractFields) {
        const parsed = JSON.parse(visit.contractFields);
        if (parsed.postCloseTags && Array.isArray(parsed.postCloseTags)) {
          setPostCloseTags(parsed.postCloseTags);
          return;
        }
      }
    } catch { /* */ }
    setPostCloseTags([]);
  }, [visit]);

  useEffect(() => { fetchVisitDetails(); }, [visitId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (visit) {
      initEditFields();
      fetchFieldMetas();
      parsePostClosureTags();
    }
  }, [visit, initEditFields, fetchFieldMetas, parsePostClosureTags]);

  useEffect(() => {
    if (visit && activeTab === "historial") fetchHistory();
  }, [visit, activeTab]);

  useEffect(() => {
    if (visit?.parcel?.id) {
      fetch(`/api/parcels/${visit.parcel.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.parcelTags) setLeadTags(JSON.parse(data.parcelTags));
        })
        .catch(() => {});
    }
  }, [visit?.parcel?.id]);

  useEffect(() => {
    fetch("/api/admin/not-available-tags")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setNotAvailTags(d); })
      .catch(() => {});
  }, []);

  const handleFieldChange = (key: string, value: string) => {
    setEditFields((prev) => ({ ...prev, [key]: value }));
  };

  const fetchScheduleClosers = async () => {
    try {
      const res = await fetch("/api/closers");
      const data = await res.json();
      setScheduleClosers(data || []);
      if (data?.length === 1) {
        setScheduleCloserId(String(data[0].id));
      }
    } catch { /* */ }
  };

  const hasPanelSolarForSchedule = visit?.projects?.some((p) => p.projectType.name.toLowerCase().includes("panel solar")) ?? false;
  const showScheduleCloserDropdown = role === "SETTER_JR" || (role === "SETTER" && hasPanelSolarForSchedule);
  const scheduleIsSelfAssigned = role === "CLOSER" || (role === "SETTER" && !hasPanelSolarForSchedule);
  const scheduleCloser = scheduleClosers.find((c: any) => c.id === Number(scheduleCloserId)) ?? null;
  const scheduleSlotsByDate: Record<string, any[]> = scheduleCloser
    ? (scheduleCloser.slots || []).reduce((m: Record<string, any[]>, s: any) => {
        const d = s.startAt.split("T")[0];
        (m[d] ??= []).push(s);
        return m;
      }, {})
    : {};

  const handleScheduleVisit = async () => {
    if (!visit || !scheduleDate || !scheduleTime) {
      toast.error("Selecciona fecha y hora");
      return;
    }
    if (showScheduleCloserDropdown && !scheduleCloserId) {
      toast.error("Selecciona un Closer");
      return;
    }
    setScheduleSaving(true);
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
      await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "PROPOSAL_ACCEPTED",
          scheduledAt,
          ...(scheduleIsSelfAssigned ? { closerId: Number(session?.user?.id) } : { closerId: Number(scheduleCloserId) }),
        }),
      });
      toast.success("Cita agendada");
      fetchVisitDetails();
    } catch {
      toast.error("Error al agendar");
    } finally {
      setScheduleSaving(false);
    }
  };

  useEffect(() => {
    if (visit && visit.stage === "IN_PROGRESS" && !visit.scheduledAt) {
      fetchScheduleClosers();
    }
  }, [visit]);

  const saveProjectDetailsAction = async (silent = false) => {
    if (!visit || !visitId) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      // Save ALL edited fields (both common and specific), exclude _bill* internal fields
      for (const [key, value] of Object.entries(editFields)) {
        if (key.startsWith("_bill")) continue;
        if (value !== undefined && value !== "") {
          payload[key] = value;
        }
      }
      if (payload.closingDate && typeof payload.closingDate === "string") {
        payload.closingDate = new Date(payload.closingDate).toISOString();
      }
      if (payload.siteSurveyDate && typeof payload.siteSurveyDate === "string") {
        payload.siteSurveyDate = new Date(payload.siteSurveyDate).toISOString();
      }
      if (Object.keys(payload).length === 0) { setSaving(false); return; }

      const res = await fetch("/api/project-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId, ...payload }),
      });

      if (res.ok) {
        const updated = await res.json();
        setVisit((prev) =>
          prev ? { ...prev, projectDetails: { ...prev.projectDetails, ...updated } } : prev
        );
        if (!silent) toast.success("Datos guardados");
      } else {
        if (!silent) toast.error("Error al guardar");
      }
    } catch {
      if (!silent) toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  const handleFileUploadField = async (fieldName: string, file: File) => {
    try {
      const url = await handleUpload(file);
      const updated = { ...(visit?.projectDetails || {}), [fieldName]: url };
      setVisit((prev) => (prev ? { ...prev, projectDetails: updated } : prev));
      await fetch("/api/project-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId, [fieldName]: url }),
      });
      toast.success("Archivo subido");
    } catch {
      toast.error("Error al subir archivo");
    }
  };

  const handleRequestClose = async () => {
    try {
      const res = await fetch(`/api/visits/${visitId}/request-close`, { method: "POST" });
      if (res.ok) {
        toast.success("Solicitud de cierre enviada a los administradores");
      } else {
        toast.error("Error al solicitar cierre");
      }
    } catch {
      toast.error("Error al solicitar cierre");
    }
  };

  const handleCloseProject = async () => {
    try {
      const res = await fetch(`/api/visits/${visitId}/close`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        toast.success("Proyecto cerrado exitosamente");
        fetchVisitDetails();
      } else {
        toast.error("Error al cerrar proyecto");
      }
    } catch {
      toast.error("Error al cerrar proyecto");
    }
  };

  const handleCancelProjectAction = async () => {
    const reason = prompt("Motivo de cancelación:");
    if (!reason) return;
    try {
      const res = await fetch(`/api/visits/${visitId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        toast.success("Proyecto cancelado");
        fetchVisitDetails();
      } else {
        toast.error("Error al cancelar proyecto");
      }
    } catch {
      toast.error("Error al cancelar proyecto");
    }
  };

  const handleUncancel = async () => {
    try {
      const res = await fetch(`/api/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "PROJECT", cancelledAt: null, cancellationReason: null }),
      });
      if (res.ok) {
        toast.success("Proyecto descancelado");
        fetchVisitDetails();
      } else {
        toast.error("Error al descancelar");
      }
    } catch {
      toast.error("Error al descancelar");
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm("¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/visits/${visitId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Proyecto eliminado");
        router.push("/dashboard");
      } else {
        toast.error("Error al eliminar");
      }
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleStartProject = async () => {
    if (!visit) return;
    try {
      await saveProjectDetailsAction(true);

      const res = await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: "PROJECT", scheduledAt: null }),
      });
      if (res.ok) {
        toast.success("Proyecto iniciado");
        fetchVisitDetails();

        const chatRes = await fetch(`/api/visits/${visit.id}/create-chat`, { method: "POST" });
        if (chatRes.ok) {
          const chatRoom = await chatRes.json();
          setVisit((prev) =>
            prev ? { ...prev, chatRoom: { id: chatRoom.id } } : prev
          );

          const hasSolar = visit.projects?.some((p) => p.projectType.name.toLowerCase().includes("panel solar")) ?? false;

          if (role === "CLOSER") {
            fetch("/api/notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: "Nuevo proyecto iniciado",
                body: `El closer ha iniciado un nuevo proyecto en ${visit.parcel.address}`,
                link: `/lead/${visit.id}`,
              }),
            }).catch(() => {});
          } else if (role === "SETTER" || role === "SETTER_JR") {
            if (hasSolar && visit.closer) {
              fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: "Nuevo proyecto iniciado",
                  body: `Se ha iniciado un nuevo proyecto en ${visit.parcel.address}`,
                  link: `/lead/${visit.id}`,
                }),
              }).catch(() => {});
              fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: visit.closer.id,
                  title: "Nuevo proyecto iniciado",
                  body: `Se ha iniciado un nuevo proyecto en ${visit.parcel.address}`,
                  link: `/lead/${visit.id}`,
                }),
              }).catch(() => {});
            } else {
              fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: "Nuevo proyecto iniciado",
                  body: `Se ha iniciado un nuevo proyecto en ${visit.parcel.address}`,
                  link: `/lead/${visit.id}`,
                }),
              }).catch(() => {});
            }
          }
        }
      } else {
        toast.error("Error al iniciar proyecto");
      }
    } catch {
      toast.error("Error al iniciar proyecto");
    }
  };

  const handleAddLeadTag = async (tag: { name: string; color: string }) => {
    if (!visit?.parcel?.id) return;
    if (leadTags.some(t => t.name === tag.name)) return;
    const newTags = [...leadTags, { name: tag.name, color: tag.color }];
    setLeadTags(newTags);
    try {
      await fetch(`/api/parcels/${visit.parcel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parcelTags: JSON.stringify(newTags) }),
      });
    } catch {
      toast.error("Error al guardar etiqueta");
      setLeadTags(leadTags);
    }
  };

  const handleRemoveLeadTag = async (tagName: string) => {
    if (!visit?.parcel?.id) return;
    const newTags = leadTags.filter(t => t.name !== tagName);
    setLeadTags(newTags);
    try {
      await fetch(`/api/parcels/${visit.parcel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parcelTags: JSON.stringify(newTags) }),
      });
    } catch {
      toast.error("Error al eliminar etiqueta");
      setLeadTags(leadTags);
    }
  };

  const handleToggleTag = async (tag: string) => {
    if (!visit) return;
    let newTags: string[];
    if (postCloseTags.includes(tag)) {
      newTags = postCloseTags.filter((t) => t !== tag);
    } else {
      if (postCloseTags.length >= 3) {
        toast.error("Máximo 3 tags permitidos");
        return;
      }
      newTags = [...postCloseTags, tag];
    }
    const prevTags = postCloseTags;
    setPostCloseTags(newTags);
    setTagSaving(true);
    try {
      let existing: Record<string, unknown> = {};
      if (visit.contractFields) {
        try { existing = JSON.parse(visit.contractFields); } catch { /* */ }
      }
      existing.postCloseTags = newTags;
      await fetch(`/api/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractFields: JSON.stringify(existing) }),
      });
      toast.success("Tags actualizados");
    } catch {
      toast.error("Error al actualizar tags");
      setPostCloseTags(prevTags);
    } finally {
      setTagSaving(false);
    }
  };

  const createChatIfNeeded = async () => {
    if (!visit) return;
    if (visit.chatRoom?.id) return;
    if (visit.stage !== "PROJECT" && visit.stage !== "CLOSED") return;
    try {
      const res = await fetch(`/api/visits/${visitId}/create-chat`, { method: "POST" });
      if (res.ok) {
        const chatRoom = await res.json();
        setVisit((prev) =>
          prev ? { ...prev, chatRoom: { id: chatRoom.id } } : prev
        );
        toast.success("Chat creado");
      }
    } catch { /* skip */ }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "chat" && visit && !visit.chatRoom?.id && (visit.stage === "PROJECT" || visit.stage === "CLOSED")) {
      createChatIfNeeded();
    }
  };

  const progress = calculateProjectCompletion(visit?.projectDetails, fieldMetas);
  const selectedProjectNames = visit?.projects?.map((p) => p.projectType.name) || [];
  const isAdmin = role === "ADMIN";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!visit) {
    return (
      <motion.div className="text-center py-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-on-surface-variant">No se encontró el proyecto</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard")}>
          Volver
        </Button>
      </motion.div>
    );
  }

  const stageLabel = STAGE_LABELS[visit.stage] || visit.stage;
  const stageColor = STAGE_COLORS[visit.stage] || "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <div className="space-y-6 pb-8">
      <motion.header
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high"
        >
          <ArrowLeft className="w-5 h-5 text-primary" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <MapPin className="w-4 h-4 text-primary" />
            <h1 className="font-headline text-xl font-bold text-on-surface">
              {visit.parcel.address}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${stageColor}`}>
              {stageLabel}
            </span>
          </div>
          {(visit.bill?.clientName || visit.parcel.ownerName) && (
            <p className="text-sm text-on-surface-variant mt-1">
              {visit.bill?.clientName || visit.parcel.ownerName}
            </p>
          )}
        </div>
      </motion.header>

      <div className="flex border-b border-outline-variant/30 overflow-x-auto gap-0">
        {[
          { key: "datos", label: "Datos", icon: Pencil },
          { key: "archivos", label: "Archivos", icon: FileText },
          { key: "contratos", label: "Contratos", icon: FileText },
          { key: "chat", label: "Chat", icon: MessageSquare },
          { key: "historial", label: "Historial", icon: Clock },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
        {visit.stage === "PROPOSAL_ACCEPTED" && (
          <button
            onClick={handleStartProject}
            className="ml-auto flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all whitespace-nowrap shrink-0"
          >
            <Play className="w-4 h-4" />
            Comenzar Proyecto
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "datos" && (
          <TabContent key="datos">
            {visit.stage === "IN_PROGRESS" && (
              <DatosLeadPanel visit={visit} editFields={editFields} onFieldChange={handleFieldChange} onUpload={handleUpload} onRefresh={fetchVisitDetails} leadTags={leadTags} notAvailTags={notAvailTags} onAddTag={handleAddLeadTag} onRemoveTag={handleRemoveLeadTag} />
            )}

            {visit.stage === "IN_PROGRESS" && !visit.scheduledAt && (
              <div className="mt-6 glass-panel rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-on-surface">
                  <Calendar className="w-5 h-5 text-primary" />
                  Agendar Cita
                </h3>

                {showScheduleCloserDropdown && (
                  <select
                    value={scheduleCloserId}
                    onChange={(e) => { setScheduleCloserId(e.target.value); setScheduleDate(""); setScheduleTime(""); }}
                    className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                  >
                    <option value="">-- Selecciona un Closer --</option>
                    {scheduleClosers.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}

                {((showScheduleCloserDropdown && scheduleCloserId) || scheduleIsSelfAssigned) && (
                  <SlotPicker
                    userId={scheduleIsSelfAssigned ? Number(session?.user?.id) : Number(scheduleCloserId)}
                    selectedDate={scheduleDate || undefined}
                    selectedTime={scheduleTime || undefined}
                    onSelect={(date, time) => {
                      setScheduleDate(date);
                      setScheduleTime(time);
                    }}
                  />
                )}

                <Button onClick={handleScheduleVisit} disabled={scheduleSaving || !scheduleDate || !scheduleTime} className="w-full">
                  {scheduleSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calendar className="w-5 h-5" />}
                  Programar Cita
                </Button>
              </div>
            )}

            {visit.stage === "PROPOSAL_ACCEPTED" && (
              <DatosProjectFieldsPanel
                visit={visit}
                editFields={editFields}
                onFieldChange={handleFieldChange}
                onSave={saveProjectDetailsAction}
                saving={saving}
                fieldMetas={fieldMetas}
                selectedProjectNames={selectedProjectNames}
                onFileFieldUpload={handleFileUploadField}
                onUpload={handleUpload}
                onRefresh={fetchVisitDetails}
                showBillSection
                leadTags={leadTags}
                notAvailTags={notAvailTags}
                onAddTag={handleAddLeadTag}
                onRemoveTag={handleRemoveLeadTag}
              />
            )}

            {visit.stage === "PROJECT" && (
              <DatosProjectPanel
                visit={visit}
                editFields={editFields}
                onFieldChange={handleFieldChange}
                onSave={saveProjectDetailsAction}
                saving={saving}
                fieldMetas={fieldMetas}
                selectedProjectNames={selectedProjectNames}
                progress={progress}
                role={role}
                onRequestClose={handleRequestClose}
                onCloseProject={handleCloseProject}
                onCancelProject={handleCancelProjectAction}
                onFileFieldUpload={handleFileUploadField}
              />
            )}

            {visit.stage === "CLOSED" && (
              <>
                {isAdmin && (
                  <AssignPartnerPanel visitId={visit.id} currentPartnerId={visit.parcel?.partnerId} onRefresh={fetchVisitDetails} />
                )}
                <DatosClosedPanel
                visit={visit}
                fieldMetas={fieldMetas}
                selectedProjectNames={selectedProjectNames}
                postCloseTags={postCloseTags}
                onToggleTag={handleToggleTag}
                tagSaving={tagSaving}
                isAdmin={isAdmin}
              />
            </>
            )}

            {visit.stage === "CANCELLED" && (
              <DatosCancelledPanel
                visit={visit}
                isAdmin={isAdmin}
                onUncancel={handleUncancel}
                onDelete={handleDeleteProject}
              />
            )}

            {(visit.stage === "PROJECT" || visit.stage === "CLOSED" || visit.stage === "CANCELLED") && (
              <div className="mt-6 glass-panel rounded-xl p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-on-surface">
                  <Tag className="w-5 h-5 text-primary" />
                  Etiquetas
                </h3>
                {leadTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {leadTags.map((t, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: t.color }}
                      >
                        {t.name}
                        <button
                          onClick={() => handleRemoveLeadTag(t.name)}
                          className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 text-white"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {notAvailTags.map((tag) => {
                    const isSelected = leadTags.some((t) => t.name === tag.name);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => isSelected ? handleRemoveLeadTag(tag.name) : handleAddLeadTag({ name: tag.name, color: tag.color })}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-primary/30"
                        }`}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </TabContent>
        )}

        {activeTab === "archivos" && (
          <TabContent key="archivos">
            <ArchivosPanel visit={visit} />
          </TabContent>
        )}

        {activeTab === "contratos" && (
          <TabContent key="contratos">
            {showContractModal ? (
              <div className="relative rounded-xl overflow-hidden border border-outline-variant/30" style={{ height: "70vh" }}>
                <ContractModal isOpen={true} onClose={() => setShowContractModal(false)} visitId={visitId} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 glass-panel rounded-xl">
                <FileText className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg font-medium text-on-surface mb-4">Documentos del proyecto</p>
                <Button onClick={() => setShowContractModal(true)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Documentos
                </Button>
              </div>
            )}
          </TabContent>
        )}

        {activeTab === "chat" && (
          <TabContent key="chat">
            {visit.stage !== "PROJECT" && visit.stage !== "CLOSED" ? (
              <div className="flex flex-col items-center justify-center py-12 glass-panel rounded-xl">
                <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg font-medium text-on-surface">Chat solo disponible en la etapa En Proyecto</p>
              </div>
            ) : (
              <ChatInterface initialRoomId={visit.chatRoom?.id ?? null} hideRoomList />
            )}
          </TabContent>
        )}

        {activeTab === "historial" && (
          <TabContent key="historial">
            <HistorialPanel history={history} loading={historyLoading} />
          </TabContent>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabContent({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function FieldRow({
  label,
  value,
  field,
  type,
  onChange,
  onBlur,
  readOnly,
  isFile,
  onFileUpload,
  fileUrl,
}: {
  label: string;
  value: string;
  field: string;
  type?: string;
  onChange?: (key: string, v: string) => void;
  onBlur?: () => void;
  readOnly?: boolean;
  isFile?: boolean;
  onFileUpload?: (fieldName: string, file: File) => void;
  fileUrl?: string;
}) {
  if (isFile) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          {label}
        </label>
        <div className="flex items-center gap-3">
          {fileUrl && (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
              <Eye className="w-4 h-4" /> Ver
            </a>
          )}
          {!readOnly && (
            <label className="cursor-pointer text-xs text-on-surface-variant hover:text-primary flex items-center gap-1">
              <Upload className="w-3 h-3" />
              Subir
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file && onFileUpload) onFileUpload(field, file);
                }}
              />
            </label>
          )}
        </div>
      </div>
    );
  }

  if (type === "date") {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{label}</label>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange?.(field, e.target.value)}
          onBlur={onBlur}
          readOnly={readOnly}
          className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface transition-colors"
        />
      </div>
    );
  }

  if (field === "paymentMethod") {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{label}</label>
        <select
          value={value}
          onChange={(e) => onChange?.(field, e.target.value)}
          onBlur={onBlur}
          disabled={readOnly}
          className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface transition-colors"
        >
          <option value="">Seleccionar...</option>
          <option value="Cash">Cash</option>
          <option value="Transferencia">Transferencia</option>
          <option value="Cheques">Cheques</option>
          <option value="LightReach">LightReach</option>
          <option value="SkyLight">SkyLight</option>
          <option value="SunGage">SunGage</option>
          <option value="Sunrise Capital">Sunrise Capital</option>
          <option value="Foundations Finance">Foundations Finance</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
    );
  }

  if (type === "number" || field.includes("CommPct") || field.includes("Price") || field.includes("Commission")) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{label}</label>
        <input
          type="number"
          step={field.includes("Price") || field.includes("Commission") ? "0.01" : "1"}
          value={value}
          onChange={(e) => onChange?.(field, e.target.value)}
          onBlur={onBlur}
          readOnly={readOnly}
          className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface transition-colors"
        />
      </div>
    );
  }

  return (
    <Input
      label={label}
      value={value}
      onChange={(e) => onChange?.(field, (e.target as HTMLInputElement).value)}
      onBlur={onBlur}
      readOnly={readOnly}
    />
  );
}

function DatosLeadPanel({
  visit,
  editFields,
  onFieldChange,
  onUpload,
  onRefresh,
  leadTags,
  notAvailTags,
  onAddTag,
  onRemoveTag,
}: {
  visit: VisitDetails;
  editFields: Record<string, string>;
  onFieldChange: (key: string, v: string) => void;
  onUpload: (file: File) => Promise<string>;
  onRefresh: () => void;
  leadTags: { name: string; color: string }[];
  notAvailTags: { id: number; name: string; color: string }[];
  onAddTag: (tag: { name: string; color: string }) => void;
  onRemoveTag: (tagName: string) => void;
}) {
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState(visit.bill?.additionalFileUrl || "");
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState(visit.bill?.imageUrl || "");
  const [saving, setSaving] = useState(false);
  const [editProjectTypes, setEditProjectTypes] = useState<{ id: number; name: string }[]>([]);
  const [selectedPTIds, setSelectedPTIds] = useState<number[]>([]);

  useEffect(() => {
    fetch("/api/project-types")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setEditProjectTypes(d.filter((pt: { name: string }) => pt.name !== "Campos Comunes")); })
      .catch(() => {});
    setSelectedPTIds(visit.projects.map((p) => p.projectType.id));
  }, [visit.id]);

  const toggleProjectType = async (ptId: number) => {
    const next = selectedPTIds.includes(ptId)
      ? selectedPTIds.filter((id) => id !== ptId)
      : [...selectedPTIds, ptId];
    setSelectedPTIds(next);
    try {
      await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectTypeIds: next }),
      });
      onRefresh();
    } catch { /* */ }
  };

  const handleSaveAll = async () => {
    if (!visit) return;
    setSaving(true);
    try {
      let billUrl = billPreview;
      let idUrl = idPreview;
      if (billFile) billUrl = await onUpload(billFile);
      if (idFile) idUrl = await onUpload(idFile);

      const billData: Record<string, string | null> = {
        phone: editFields._billPhone?.trim() || visit.bill?.phone || "",
        clientName: editFields._billClientName?.trim() || visit.bill?.clientName || null,
        clientEmail: editFields._billClientEmail?.trim() || visit.bill?.clientEmail || null,
        imageUrl: billUrl || visit.bill?.imageUrl || null,
        notes: editFields._billNotes?.trim() || visit.bill?.notes || null,
        additionalFileUrl: idUrl || visit.bill?.additionalFileUrl || null,
        additionalFileName: idFile?.name || visit.bill?.additionalFileName || null,
      };

      await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill: { upsert: { create: billData, update: billData } } }),
      });

      if (editFields._billNotes !== undefined) {
        await fetch(`/api/visits/${visit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: editFields._billNotes?.trim() || null }),
        });
      }

      toast.success("Datos guardados");
      setIdFile(null);
      setBillFile(null);
      onRefresh();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Panel title="Información del Cliente" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nombre" value={editFields._billClientName || ""} onChange={(e) => onFieldChange("_billClientName", (e.target as HTMLInputElement).value)} placeholder="Nombre del cliente" />
          <Input label="Correo" type="email" value={editFields._billClientEmail || ""} onChange={(e) => onFieldChange("_billClientEmail", (e.target as HTMLInputElement).value)} placeholder="Correo electrónico" />
          <Input label="Teléfono" type="tel" value={editFields._billPhone || ""} onChange={(e) => onFieldChange("_billPhone", (e.target as HTMLInputElement).value)} placeholder="Número de teléfono" />
        </div>
      </Panel>

      <Panel title="Etiquetas" icon={Tag}>
        {leadTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {leadTags.map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: t.color }}
              >
                {t.name}
                <button
                  onClick={() => onRemoveTag(t.name)}
                  className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 text-white"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {notAvailTags.map((tag) => {
            const isSelected = leadTags.some((t) => t.name === tag.name);
            return (
              <button
                key={tag.id}
                onClick={() => isSelected ? onRemoveTag(tag.name) : onAddTag({ name: tag.name, color: tag.color })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-primary/30"
                }`}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="Documentos" icon={FileText}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UploadField
            label="ID del Cliente"
            preview={idPreview}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setIdFile(f); setIdPreview(URL.createObjectURL(f)); }
            }}
            onClear={() => { setIdFile(null); setIdPreview(""); }}
          />
          <UploadField
            label="Recibo de Luz"
            preview={billPreview}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setBillFile(f); setBillPreview(URL.createObjectURL(f)); }
            }}
            onClear={() => { setBillFile(null); setBillPreview(""); }}
          />
        </div>
      </Panel>

      <Panel title="Tipos de Proyecto" icon={Package}>
        <div className="flex flex-wrap gap-2">
          {editProjectTypes.map((pt) => {
            const isSelected = selectedPTIds.includes(pt.id);
            return (
              <button key={pt.id} type="button" onClick={() => toggleProjectType(pt.id)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                  isSelected ? "bg-primary/10 border-primary text-primary" : "bg-surface-container lowest border-outline-variant text-on-surface-variant hover:border-primary/30"
                }`}
              >
                {isSelected && <CheckCircle className="w-3 h-3 inline mr-1" />}
                {pt.name}
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="Notas" icon={Pencil}>
        <textarea
          value={editFields._billNotes || ""}
          onChange={(e) => onFieldChange("_billNotes", e.target.value)}
          placeholder="Notas adicionales..."
          className="w-full min-h-[100px] bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-xl p-4 resize-none text-on-surface"
        />
      </Panel>

      <Button onClick={handleSaveAll} disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        Guardar Cambios
      </Button>
    </div>
  );
}

function DatosProjectFieldsPanel({
  visit,
  editFields,
  onFieldChange,
  onSave,
  saving,
  fieldMetas,
  selectedProjectNames,
  onFileFieldUpload,
  onUpload,
  onRefresh,
  showBillSection,
  leadTags,
  notAvailTags,
  onAddTag,
  onRemoveTag,
}: {
  visit: VisitDetails;
  editFields: Record<string, string>;
  onFieldChange: (key: string, v: string) => void;
  onSave: () => void;
  saving: boolean;
  fieldMetas: FieldMeta[];
  selectedProjectNames: string[];
  onFileFieldUpload: (fieldName: string, file: File) => void;
  onUpload: (file: File) => Promise<string>;
  onRefresh: () => void;
  showBillSection?: boolean;
  leadTags: { name: string; color: string }[];
  notAvailTags: { id: number; name: string; color: string }[];
  onAddTag: (tag: { name: string; color: string }) => void;
  onRemoveTag: (tagName: string) => void;
}) {
  const pd = visit.projectDetails || {};
  const nonCommonFields = fieldMetas.filter((m) => !COMMON_FIELDS.includes(m.fieldName));

  const [allProjectTypes, setAllProjectTypes] = useState<{ id: number; name: string }[]>([]);
  const [selectedProjectTypeIds, setSelectedProjectTypeIds] = useState<number[]>([]);
  const [projectTypesSaving, setProjectTypesSaving] = useState(false);

  useEffect(() => {
    const fetchAllProjectTypes = async () => {
      try {
        const res = await fetch("/api/project-types");
        const data = await res.json();
        if (Array.isArray(data)) setAllProjectTypes(data);
      } catch { /* */ }
    };
    fetchAllProjectTypes();
    setSelectedProjectTypeIds(visit.projects.map((p) => p.projectType.id));
  }, [visit.id, visit.projects]);

  const toggleProjectType = async (ptId: number) => {
    let next: number[];
    if (selectedProjectTypeIds.includes(ptId)) {
      next = selectedProjectTypeIds.filter((id) => id !== ptId);
    } else {
      next = [...selectedProjectTypeIds, ptId];
    }
    setSelectedProjectTypeIds(next);
    setProjectTypesSaving(true);
    try {
      await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectTypeIds: next }),
      });
      onRefresh();
    } catch {
      toast.error("Error al actualizar tipos de proyecto");
      setSelectedProjectTypeIds(visit.projects.map((p) => p.projectType.id));
    } finally {
      setProjectTypesSaving(false);
    }
  };

  const getValue = (key: string): string => {
    if (editFields[key] !== undefined) return editFields[key];
    const val = pd[key];
    if (val === undefined || val === null) return "";
    if (key === "closingDate" && typeof val === "string") return val.split("T")[0];
    return String(val);
  };

  const getType = (key: string): string => {
    if (FIELD_TYPES[key]) return FIELD_TYPES[key];
    const meta = fieldMetas.find((m: { fieldName: string }) => m.fieldName === key);
    return meta?.fieldType || "text";
  };

  const isFieldFile = (key: string): boolean => {
    const meta = fieldMetas.find((m) => m.fieldName === key);
    return meta?.fieldType === "file" || meta?.fieldType === "photos" || isFileFieldKey(key);
  };

  return (
    <div className="space-y-6">
      {showBillSection && (
        <DatosLeadPanel visit={visit} editFields={editFields} onFieldChange={onFieldChange} onUpload={onUpload} onRefresh={onRefresh} leadTags={leadTags} notAvailTags={notAvailTags} onAddTag={onAddTag} onRemoveTag={onRemoveTag} />
      )}

      <Panel title="Campos del Proyecto" icon={Pencil}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMMON_FIELDS.map((key) => (
            <FieldRow
              key={key}
              label={fieldLabel(key)}
              value={getValue(key)}
              field={key}
              type={getType(key)}
              onChange={(_, v) => onFieldChange(key, v)}
              onBlur={onSave}
              isFile={isFieldFile(key)}
              onFileUpload={onFileFieldUpload}
              fileUrl={pd[key] ? String(pd[key]) : undefined}
            />
          ))}
        </div>

        {nonCommonFields.length > 0 && (() => {
          const { groups, other } = groupFieldsByType(nonCommonFields as { fieldName: string; fieldLabel?: string; fieldType?: string }[]);
          return (
            <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-4">
              {Object.entries(groups).map(([key, fields]) => (
                <div key={key}>
                  <h4 className="text-sm font-semibold text-on-surface mb-2">{FIELD_GROUPS[key]?.label || key}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map((meta) => (
                      <FieldRow key={meta.fieldName} label={meta.fieldLabel || meta.fieldName}
                        value={getValue(meta.fieldName)} field={meta.fieldName}
                        type={meta.fieldType || "text"} onChange={(_, v) => onFieldChange(meta.fieldName, v)}
                        onBlur={onSave} isFile={meta.fieldType === "file" || meta.fieldType === "photos"}
                        onFileUpload={onFileFieldUpload} fileUrl={pd[meta.fieldName] ? String(pd[meta.fieldName]) : undefined} />
                    ))}
                  </div>
                </div>
              ))}
              {other.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-on-surface mb-2">Otros</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {other.map((meta) => (
                      <FieldRow key={meta.fieldName} label={meta.fieldLabel || meta.fieldName}
                        value={getValue(meta.fieldName)} field={meta.fieldName}
                        type={meta.fieldType || "text"} onChange={(_, v) => onFieldChange(meta.fieldName, v)}
                        onBlur={onSave} isFile={meta.fieldType === "file" || meta.fieldType === "photos"}
                        onFileUpload={onFileFieldUpload} fileUrl={pd[meta.fieldName] ? String(pd[meta.fieldName]) : undefined} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Panel>

      <Button onClick={onSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        Guardar Cambios
      </Button>
    </div>
  );
}

function DatosProjectPanel({
  visit,
  editFields,
  onFieldChange,
  onSave,
  saving,
  fieldMetas,
  selectedProjectNames,
  progress,
  role,
  onRequestClose,
  onCloseProject,
  onCancelProject,
  onFileFieldUpload,
}: {
  visit: VisitDetails;
  editFields: Record<string, string>;
  onFieldChange: (key: string, v: string) => void;
  onSave: () => void;
  saving: boolean;
  fieldMetas: FieldMeta[];
  selectedProjectNames: string[];
  progress: number;
  role: string;
  onRequestClose: () => void;
  onCloseProject: () => void;
  onCancelProject: () => void;
  onFileFieldUpload: (fieldName: string, file: File) => void;
}) {
  const pd = visit.projectDetails || {};
  const nonCommonFields = fieldMetas.filter((m) => !COMMON_FIELDS.includes(m.fieldName));

  const [idDocPreview, setIdDocPreview] = useState(pd.idDocumentUrl ? String(pd.idDocumentUrl) : "");
  const [billUploadPreview, setBillUploadPreview] = useState(pd.electricBillUrl ? String(pd.electricBillUrl) : "");

  const handleIdDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setIdDocPreview(URL.createObjectURL(f));
      await onFileFieldUpload("idDocumentUrl", f);
    }
  };

  const handleBillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setBillUploadPreview(URL.createObjectURL(f));
      await onFileFieldUpload("electricBillUrl", f);
    }
  };

  const handleClearIdDoc = () => setIdDocPreview("");
  const handleClearBill = () => setBillUploadPreview("");

  const getValue = (key: string): string => {
    if (editFields[key] !== undefined) return editFields[key];
    const val = pd[key];
    if (val === undefined || val === null) return "";
    if (key === "closingDate" && typeof val === "string") return val.split("T")[0];
    return String(val);
  };

  const getType = (key: string): string => {
    if (FIELD_TYPES[key]) return FIELD_TYPES[key];
    const meta = fieldMetas.find((m: { fieldName: string }) => m.fieldName === key);
    return meta?.fieldType || "text";
  };

  const isFieldFile = (key: string): boolean => {
    const meta = fieldMetas.find((m) => m.fieldName === key);
    return meta?.fieldType === "file" || meta?.fieldType === "photos" || isFileFieldKey(key);
  };

  const isTraineeOrCloser = role === "SETTER" || role === "SETTER_JR" || role === "CLOSER";
  const isAdmin = role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UploadField
          label="ID del Cliente"
          preview={idDocPreview}
          onChange={handleIdDocUpload}
          onClear={handleClearIdDoc}
        />
        <UploadField
          label="Recibo de Luz"
          preview={billUploadPreview}
          onChange={handleBillUpload}
          onClear={handleClearBill}
        />
      </div>

      <Panel title="Progreso del Proyecto" icon={BadgeCheck}>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant">Completitud</span>
            <span className="font-bold text-on-surface">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress === 100 ? "bg-primary" : progress >= 50 ? "bg-secondary" : "bg-tertiary"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {progress === 100 && (
          <div className="mt-4 flex gap-3 flex-wrap">
            {isTraineeOrCloser && (
              <Button onClick={onRequestClose} variant="outline">
                <BadgeCheck className="w-4 h-4" />
                Solicitar Cierre
              </Button>
            )}
            {isAdmin && (
              <Button onClick={onCloseProject}>
                <CheckCircle className="w-4 h-4" />
                Cerrar Proyecto
              </Button>
            )}
          </div>
        )}
      </Panel>

      <Panel title="Campos Comunes" icon={Pencil}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMMON_FIELDS.map((key) => (
            <FieldRow
              key={key}
              label={fieldLabel(key)}
              value={getValue(key)}
              field={key}
              type={getType(key)}
              onChange={(_, v) => onFieldChange(key, v)}
              onBlur={onSave}
              isFile={isFieldFile(key)}
              onFileUpload={onFileFieldUpload}
              fileUrl={pd[key] ? String(pd[key]) : undefined}
            />
          ))}
        </div>
      </Panel>

      {nonCommonFields.length > 0 && (
        <Panel title={`Campos de ${selectedProjectNames.join(", ")}`} icon={Package}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nonCommonFields.map((meta) => (
              <FieldRow
                key={meta.fieldName}
                label={meta.fieldLabel}
                value={getValue(meta.fieldName)}
                field={meta.fieldName}
                type={meta.fieldType}
                onChange={(_, v) => onFieldChange(meta.fieldName, v)}
                onBlur={onSave}
                isFile={meta.fieldType === "file" || meta.fieldType === "photos"}
                onFileUpload={onFileFieldUpload}
                fileUrl={pd[meta.fieldName] ? String(pd[meta.fieldName]) : undefined}
              />
            ))}
          </div>
        </Panel>
      )}

      <div className="flex gap-3">
        <Button onClick={onSave} disabled={saving} className="flex-1">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Cambios
        </Button>
        <Button onClick={onCancelProject} variant="danger" disabled={saving}>
          <X className="w-4 h-4" />
          Cancelar Proyecto
        </Button>
      </div>
    </div>
  );
}

function DatosClosedPanel({
  visit,
  fieldMetas,
  selectedProjectNames,
  postCloseTags,
  onToggleTag,
  tagSaving,
  isAdmin,
}: {
  visit: VisitDetails;
  fieldMetas: FieldMeta[];
  selectedProjectNames: string[];
  postCloseTags: string[];
  onToggleTag: (tag: string) => void;
  tagSaving: boolean;
  isAdmin: boolean;
}) {
  const pd = visit.projectDetails || {};

  const nonCommonFields = fieldMetas.filter((m) => !COMMON_FIELDS.includes(m.fieldName));

  return (
    <div className="space-y-6">
      {isAdmin && (
        <Panel title="Estado Post-Cierre" icon={BadgeCheck}>
          <div className="flex flex-wrap gap-2">
            {POST_CLOSURE_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => onToggleTag(tag)}
                disabled={tagSaving}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                  postCloseTags.includes(tag)
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-surface-container-low border-outline-variant text-on-surface-variant hover:border-primary/30"
                }`}
              >
                {postCloseTags.includes(tag) && <CheckCircle className="w-3 h-3 inline mr-1" />}
                {tag}
              </button>
            ))}
          </div>
          {postCloseTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {postCloseTags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Panel>
      )}

      <Panel title="Campos del Proyecto" icon={Pencil}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMMON_FIELDS.map((key) => (
            <ReadOnlyField
              key={key}
              label={fieldLabel(key)}
              value={
                pd[key] !== undefined && pd[key] !== null && pd[key] !== ""
                  ? key === "closingDate"
                    ? new Date(String(pd[key])).toLocaleDateString()
                    : String(pd[key])
                  : "-"
              }
            />
          ))}
        </div>
      </Panel>

      <Panel title="Resumen del Proyecto" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReadOnlyField label="Nombre" value={String(pd.clientName || visit.bill?.clientName || "-")} />
          <ReadOnlyField label="Email" value={String(pd.clientEmail || visit.bill?.clientEmail || "-")} />
          <ReadOnlyField label="Dirección" value={String(pd.address || visit.parcel.address)} />
        </div>
      </Panel>

      {nonCommonFields.length > 0 && (() => {
        const { groups } = groupFieldsByType(nonCommonFields as { fieldName: string; fieldLabel?: string; fieldType?: string }[]);
        return (
          <div className="space-y-4">
            {Object.entries(groups).map(([key, fields]) => (
              <Panel key={key} title={FIELD_GROUPS[key]?.label || key} icon={Package}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields
                    .filter((meta) => pd[meta.fieldName] !== undefined && pd[meta.fieldName] !== null && pd[meta.fieldName] !== "")
                    .map((meta) => (
                      <ReadOnlyField
                        key={meta.fieldName}
                        label={meta.fieldLabel || meta.fieldName}
                        value={
                          meta.fieldType === "file" || meta.fieldType === "photos"
                            ? ""
                            : String(pd[meta.fieldName])
                        }
                        linkUrl={
                          meta.fieldType === "file" || meta.fieldType === "photos"
                            ? String(pd[meta.fieldName])
                            : undefined
                        }
                      />
                    ))}
                </div>
              </Panel>
            ))}
          </div>
        );
      })()}

      {visit.bill?.notes && (
        <Panel title="Notas" icon={Pencil}>
          <p className="text-sm text-on-surface whitespace-pre-wrap">{visit.bill.notes}</p>
        </Panel>
      )}
    </div>
  );
}

function DatosCancelledPanel({
  visit,
  isAdmin,
  onUncancel,
  onDelete,
}: {
  visit: VisitDetails;
  isAdmin: boolean;
  onUncancel: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-xl p-6 border border-error/30 bg-error/5">
        <div className="flex items-center gap-3 mb-4">
          <ShieldAlert className="w-6 h-6 text-error" />
          <h3 className="text-lg font-bold text-error">Proyecto Cancelado</h3>
        </div>
        <div className="space-y-3">
          <ReadOnlyField label="Motivo de Cancelación" value={visit.cancellationReason || "No especificado"} />
          {visit.cancelledAt && (
            <ReadOnlyField label="Fecha de Cancelación" value={new Date(visit.cancelledAt).toLocaleDateString()} />
          )}
          {visit.notes && <ReadOnlyField label="Notas" value={visit.notes} multiline />}
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-3">
          <Button onClick={onUncancel} variant="outline" className="flex-1">
            <RotateCcw className="w-4 h-4" />
            Descancelar
          </Button>
          <Button onClick={onDelete} variant="danger" className="flex-1">
            <Trash2 className="w-4 h-4" />
            Eliminar
          </Button>
        </div>
      )}
    </div>
  );
}

function ArchivosPanel({ visit }: { visit: VisitDetails }) {
  const pd = visit.projectDetails || {};
  const bill = visit.bill;

  const [docName, setDocName] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [customDocs, setCustomDocs] = useState<{ name: string; url: string }[]>([]);

  useEffect(() => {
    try {
      const raw = pd.customDocs as string;
      if (raw) setCustomDocs(JSON.parse(raw));
    } catch {
      setCustomDocs([]);
    }
  }, [pd.customDocs]);

  interface FileEntry {
    name: string;
    url: string;
  }

  const allFilesFlat: FileEntry[] = [];

  const addFile = (name: string, url: string | undefined | null) => {
    if (!url) return;
    allFilesFlat.push({ name, url });
  };

  addFile(bill?.additionalFileName || "ID del Cliente", bill?.additionalFileUrl);
  addFile("Recibo de Luz", bill?.imageUrl);
  addFile("ID del Cliente (Proyecto)", pd.idDocumentUrl ? String(pd.idDocumentUrl) : undefined);
  addFile("Recibo de Luz (Proyecto)", pd.electricBillUrl ? String(pd.electricBillUrl) : undefined);
  addFile("Seguro de Hogar", pd.homeInsuranceUrl ? String(pd.homeInsuranceUrl) : undefined);
  addFile("Título de Propiedad", pd.homeTitleUrl ? String(pd.homeTitleUrl) : undefined);
  addFile("NOC", pd.nocUrl ? String(pd.nocUrl) : undefined);
  addFile("Exterior Scope", pd.exteriorScopeUrl ? String(pd.exteriorScopeUrl) : undefined);
  addFile("Reporte de Techo", pd.roofReportUrl ? String(pd.roofReportUrl) : undefined);
  addFile("Fotos de Paneles", pd.panelsPhotoUrl ? String(pd.panelsPhotoUrl) : undefined);
  addFile("Formulario de Cierre", pd.closingFormUrl ? String(pd.closingFormUrl) : undefined);
  addFile("Orden de Materiales", pd.materialsOrderUrl ? String(pd.materialsOrderUrl) : undefined);

  if (pd.propertyPhotosJson) {
    try {
      const photos = JSON.parse(String(pd.propertyPhotosJson));
      if (Array.isArray(photos)) {
        photos.forEach((url: string, i: number) => {
          allFilesFlat.push({ name: `Foto de Propiedad ${i + 1}`, url });
        });
      }
    } catch {
      allFilesFlat.push({ name: "Fotos de Propiedad", url: String(pd.propertyPhotosJson) });
    }
  }

  customDocs.forEach((doc) => {
    allFilesFlat.push({ name: doc.name, url: doc.url });
  });

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setDocFile(f);
  };

  const uploadDocument = async () => {
    if (!docName.trim() || !docFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", docFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const data = await uploadRes.json();
      const url = data.url;

      const updatedDocs = [...customDocs, { name: docName.trim(), url }];
      setCustomDocs(updatedDocs);

      await fetch("/api/project-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId: visit.id, customDocs: JSON.stringify(updatedDocs) }),
      });

      setDocName("");
      setDocFile(null);
      toast.success("Documento subido");
    } catch {
      toast.error("Error al subir documento");
    } finally {
      setUploading(false);
    }
  };

  const noFiles = allFilesFlat.length === 0;

  if (noFiles && !bill && !pd.idDocumentUrl && !pd.electricBillUrl && customDocs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="mb-6 p-4 glass-panel rounded-xl">
          <h4 className="text-sm font-semibold mb-3">Agregar Documento</h4>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Nombre del documento"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="flex-1 h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-sm"
            />
            <input
              type="file"
              onChange={handleDocUpload}
              className="text-sm text-on-surface file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-on-primary file:text-xs"
            />
            <Button onClick={uploadDocument} disabled={uploading || !docName.trim() || !docFile}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subir"}
            </Button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
          <FileText className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">No hay archivos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-6 p-4 glass-panel rounded-xl">
        <h4 className="text-sm font-semibold mb-3">Agregar Documento</h4>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Nombre del documento"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="flex-1 h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-sm"
          />
          <input
            type="file"
            onChange={handleDocUpload}
            className="text-sm text-on-surface file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-on-primary file:text-xs"
          />
          <Button onClick={uploadDocument} disabled={uploading || !docName.trim() || !docFile}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subir"}
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {allFilesFlat.map((file, i) => {
          const isImage = /\.(jpg|jpeg|png|gif|webp|svg|heic|heif)$/i.test(file.url);
          return (
            <motion.div
              key={i}
              className="glass-panel rounded-xl overflow-hidden border border-outline-variant/30"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="aspect-square bg-surface-container-low flex items-center justify-center overflow-hidden">
                {isImage ? (
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                ) : (
                  <FileText className="w-12 h-12 text-on-surface-variant opacity-40" />
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-on-surface truncate">{file.name}</p>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs flex items-center gap-1 mt-1"
                >
                  <Eye className="w-3 h-3" /> Ver
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function HistorialPanel({ history, loading }: { history: HistoryEntry[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
        <Clock className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">No hay historial disponible</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-outline-variant/40" />
      <div className="space-y-6">
        {history.map((entry, idx) => (
          <div key={idx} className="relative pl-12">
            <div
              className="absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center border-2"
              style={{
                backgroundColor: getTimelineColor(entry.action) + "20",
                borderColor: getTimelineColor(entry.action),
              }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getTimelineColor(entry.action) }} />
            </div>
            <div className="glass-panel rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: getTimelineColor(entry.action) + "20",
                    color: getTimelineColor(entry.action),
                  }}
                >
                  {entry.action}
                </span>
                <span className="text-xs text-on-surface-variant">{entry.date}</span>
              </div>
              <p className="text-sm font-medium text-on-surface">{entry.userName}</p>
              {entry.details && (
                <p className="text-xs text-on-surface-variant mt-1">{entry.details}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-panel rounded-xl p-6">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-on-surface">
        <Icon className="w-5 h-5 text-primary" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function UploadField({
  label,
  preview,
  onChange,
  onClear,
}: {
  label: string;
  preview: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  if (preview) {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{label}</label>
        <motion.div className="relative" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{label}</label>
      <label className="w-full h-32 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center bg-surface-container-lowest hover:bg-primary/5 transition-colors cursor-pointer group">
        <Upload className="w-6 h-6 text-on-surface-variant group-hover:text-primary transition-colors" />
        <span className="text-xs text-on-surface-variant mt-1">Haz clic para subir archivo</span>
        <input type="file" accept="image/*,.pdf" onChange={onChange} className="hidden" />
      </label>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  linkUrl,
  multiline,
}: {
  label: string;
  value: string;
  linkUrl?: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{label}</label>
      {linkUrl ? (
        <div className="mt-1">
          <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
            <Eye className="w-3 h-3" /> Ver
          </a>
        </div>
      ) : multiline ? (
        <p className="mt-1 text-on-surface whitespace-pre-wrap">{value}</p>
      ) : (
        <p className="mt-1 text-on-surface">{value}</p>
      )}
    </div>
  );
}

function AssignPartnerPanel({ visitId, currentPartnerId, onRefresh }: { visitId: number; currentPartnerId?: number | null; onRefresh: () => void }) {
  const [partners, setPartners] = useState<{ id: number; name: string }[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState(String(currentPartnerId ?? ""));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedPartnerId(String(currentPartnerId ?? ""));
  }, [currentPartnerId]);

  useEffect(() => {
    fetch("/api/users/transferable?all=true")
      .then((r) => r.json())
      .then((users: { id: number; name: string; role: string }[]) => {
        setPartners(users.filter((u) => u.role === "PARTNER"));
      })
      .catch(() => {});
  }, []);

  const handleAssignPartner = async () => {
    setSaving(true);
    try {
      const pid = selectedPartnerId ? parseInt(selectedPartnerId) : null;
      const res = await fetch(`/api/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: pid }),
      });
      if (res.ok) {
        toast.success(pid ? "Partner asignado" : "Partner removido");
        onRefresh();
      } else {
        toast.error("Error al asignar");
      }
    } catch { toast.error("Error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 mb-4">
      <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">Asignar Partner</h4>
      <div className="flex gap-2">
        <select value={selectedPartnerId} onChange={(e) => setSelectedPartnerId(e.target.value)}
          className="flex-1 h-9 px-2 rounded-lg border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-sm">
          <option value="">Sin partner</option>
          {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <Button onClick={handleAssignPartner} disabled={saving} size="sm" className="gap-1">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
