"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ContractModal } from "@/components/quote/ContractModal";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { SlotPicker } from "@/components/calendar/SlotPicker";
import { NotesPanel } from "@/components/lead/NotesPanel";
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
  ChevronDown,
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
  waterSystemType: "Tipo de Tratamiento",
  waterCostPrice: "Costo",
  waterSalePrice: "Precio de Venta",
  waterCommission: "Comisión",
  otherCostPrice: "Costo",
  otherSalePrice: "Precio de Venta",
  otherCommission: "Comisión",
  generalCostPrice: "Costo",
  generalSalePrice: "Precio Total",
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
  "generalCostPrice",
  "generalSalePrice",
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
  waterSystemType: "select",
  generalCostPrice: "number",
  generalSalePrice: "number",
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

const OPTIONAL_FIELDS = [
  "generalCostPrice",
  "generalSalePrice",
  "secondaryRep",
  "secondaryRepCommPct",
  "tertiaryRep",
  "tertiaryRepCommPct"
];

// Campos obligatorios para llegar al 100%
const REQUIRED_COMMON_FIELDS = new Set([
  "closingDate",
  "paymentMethod",
  "primaryRep",
  "primaryRepCommPct",
]);
// Campos secundarios opcionales de COMMON_FIELDS
// (secondaryRep, tertiaryRep, generalCostPrice, generalSalePrice son opcionales)


function calculateProjectCompletion(
  projectDetails: Record<string, unknown> | null | undefined,
  fieldMetas: FieldMeta[],
  stage?: string
): number {
  if (!projectDetails) return 0;

  const isValid = (val: unknown) => {
    if (val === undefined || val === null) return false;
    if (typeof val === 'string' && val.trim() === "") return false;
    return true;
  };

  const requiredCommonFields = COMMON_FIELDS.filter((f) => !OPTIONAL_FIELDS.includes(f));
  let totalFields = requiredCommonFields.length;
  let completedFields = requiredCommonFields.filter((f) => isValid(projectDetails[f])).length;

  const billFields = ['_billClientName', '_billClientEmail', '_billPhone'];
  for (const field of billFields) {
    totalFields++;
    if (isValid(projectDetails[field])) {
      completedFields++;
    }
  }



  for (const meta of fieldMetas) {
    if (COMMON_FIELDS.includes(meta.fieldName) || FILE_FIELD_KEYS.has(meta.fieldName)) continue;
    
    if (meta.isRequired !== false) {
      totalFields++;
      if (isValid(projectDetails[meta.fieldName])) completedFields++;
    }
  }

  if (stage === "PROJECT" || stage === "CLOSED") {
    totalFields += 2;
    if (isValid(projectDetails["idDocumentUrl"])) completedFields++;
    if (isValid(projectDetails["electricBillUrl"])) completedFields++;
  }

  return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
}

interface VisitDetails {
  id: number;
  stage: string;
  outcome: string | null;
  legacyNotes: string | null;
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
  isRequired?: boolean;
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
  const [startingProject, setStartingProject] = useState(false);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "datos");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams, activeTab]);

  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const hasChangesRef = useRef(false);
  const editFieldsRef = useRef<Record<string, string>>({});

  const [pendingBillFile, setPendingBillFile] = useState<File | null>(null);
  const [pendingIdFile, setPendingIdFile] = useState<File | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const handleFieldChange = (key: string, value: string) => {
    hasChangesRef.current = true;
    editFieldsRef.current = { ...editFieldsRef.current, [key]: value };
    setEditFields((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasChangesRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const [fieldMetas, setFieldMetas] = useState<FieldMeta[]>([]);
  const [fieldMetasByProject, setFieldMetasByProject] = useState<{ projectTypeName: string; projectTypeId: number; fields: FieldMeta[] }[]>([]);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [postCloseTags, setPostCloseTags] = useState<string[]>([]);
  const [tagSaving, setTagSaving] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [leadTags, setLeadTags] = useState<{ name: string; color: string }[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notAvailTags, setNotAvailTags] = useState<any[]>([]);
  const hasInitializedEditFields = useRef(false);

  useEffect(() => {
    hasInitializedEditFields.current = false;
  }, [visitId]);

  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleCloserId, setScheduleCloserId] = useState("");
  const [scheduleSlotId, setScheduleSlotId] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [scheduleClosers, setScheduleClosers] = useState<any[]>([]);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const fetchVisitDetails = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/visits/${visitId}/details`);
      if (!res.ok) throw new Error("Error fetching visit");
      const data = await res.json();
      setVisit(data);
    } catch {
      toast.error("Error al cargar los detalles del proyecto");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const initEditFields = useCallback(() => {
    if (!visit || hasInitializedEditFields.current) return;
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
      else if (pd.clientName) fields._billClientName = String(pd.clientName);
      if (visit.bill.clientEmail) fields._billClientEmail = visit.bill.clientEmail;
      else if (pd.clientEmail) fields._billClientEmail = String(pd.clientEmail);
      if (visit.bill.phone) fields._billPhone = visit.bill.phone;
      if (visit.bill.notes) fields._billNotes = visit.bill.notes;
    } else {
      if (pd.clientName) fields._billClientName = String(pd.clientName);
      if (pd.clientEmail) fields._billClientEmail = String(pd.clientEmail);
    }
    setEditFields(fields);
    editFieldsRef.current = fields;
    hasInitializedEditFields.current = true;
  }, [visit]);

  const fetchFieldMetas = useCallback(async () => {
    if (!visit?.projects?.length) return;
    const allMetas: FieldMeta[] = [];
    const byProject: { projectTypeName: string; projectTypeId: number; fields: FieldMeta[] }[] = [];
    const seen = new Set<number>();
    for (const project of visit.projects) {
      const ptId = project.projectType.id;
      if (seen.has(ptId)) continue;
      seen.add(ptId);
      try {
        const res = await fetch(`/api/admin/project-type-fields?projectTypeId=${ptId}`);
        const fields = await res.json();
        if (Array.isArray(fields)) {
          allMetas.push(...fields);
          byProject.push({ projectTypeName: project.projectType.name, projectTypeId: ptId, fields });
        }
      } catch { /* skip */ }
    }

    try {
      const typesRes = await fetch("/api/project-types");
      const types = await typesRes.json();
      const commons = Array.isArray(types)
        ? types.find((t: { id: number; name: string }) => t.name === "Campos Comunes")
        : null;
      if (commons) {
        const res = await fetch(`/api/admin/project-type-fields?projectTypeId=${commons.id}`);
        const fields = await res.json();
        if (Array.isArray(fields)) {
          for (const f of fields) {
            if (!allMetas.some((m) => m.fieldName === f.fieldName)) {
              allMetas.push(f);
            }
          }
        }
      }
    } catch { /* skip */ }

    setFieldMetas(allMetas);
    setFieldMetasByProject(byProject);
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
      if (visit?.bill?.imageUrl) payload.electricBillUrl = visit.bill.imageUrl;
      if (visit?.bill?.additionalFileUrl) payload.idDocumentUrl = visit.bill.additionalFileUrl;
      if (visit?.bill?.clientName) payload.clientName = visit.bill.clientName;
      if (visit?.bill?.clientEmail) payload.clientEmail = visit.bill.clientEmail;
      if (visit?.parcel?.address) payload.address = visit.parcel.address;
      for (const [key, value] of Object.entries(editFieldsRef.current)) {
        if (key.startsWith("_bill")) continue;
        if (value !== undefined) {
          const trimmed = typeof value === 'string' ? value.trim() : value;
          if ((key === "electricBillUrl" || key === "idDocumentUrl") && trimmed === "" && payload[key]) continue;
          payload[key] = trimmed === "" ? null : trimmed;
        }
      }
      if (payload.closingDate && typeof payload.closingDate === "string") {
        payload.closingDate = new Date(payload.closingDate).toISOString();
      }
      if (payload.siteSurveyDate && typeof payload.siteSurveyDate === "string") {
        payload.siteSurveyDate = new Date(payload.siteSurveyDate).toISOString();
      }
      if (Object.keys(payload).length === 0 && !Object.keys(editFieldsRef.current).some(k => k.startsWith('_bill'))) {
        setSaving(false);
        return;
      }

      // Save Bill data
      const billData: Record<string, string | null> = {
        phone: editFieldsRef.current._billPhone?.trim() || visit.bill?.phone || "",
        clientName: editFieldsRef.current._billClientName?.trim() || visit.bill?.clientName || null,
        clientEmail: editFieldsRef.current._billClientEmail?.trim() || visit.bill?.clientEmail || null,
        notes: editFieldsRef.current._billNotes?.trim() || visit.bill?.notes || null,
        imageUrl: visit.bill?.imageUrl || null,
        additionalFileUrl: visit.bill?.additionalFileUrl || null,
        additionalFileName: visit.bill?.additionalFileName || null,
      };

      await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill: { upsert: { create: billData, update: billData } } }),
      });

      if (Object.keys(payload).length > 0) {
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
        } else {
          if (!silent) toast.error("Error al guardar detalles");
        }
      }
      
      if (!silent) toast.success("Datos guardados");
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

  const handleBillFileUpload = async (type: "imageUrl" | "additionalFileUrl", file: File) => {
    try {
      const url = await handleUpload(file);
      const billData = { [type]: url };
      await fetch(`/api/visits/${visit?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill: { upsert: { create: billData, update: billData } } }),
      });
      setVisit((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          bill: prev.bill ? { ...prev.bill, ...billData } : { ...billData } as any
        };
      });
      toast.success("Archivo subido");
    } catch {
      toast.error("Error al subir archivo");
    }
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
        // Persistir timestamp en contractFields para saber que fue solicitado
        let existing: Record<string, unknown> = {};
        if (visit?.contractFields) {
          try { existing = JSON.parse(visit.contractFields); } catch { /* */ }
        }
        existing.closeRequestedAt = new Date().toISOString();
        await fetch(`/api/visits/${visitId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contractFields: JSON.stringify(existing) }),
        });
        toast.success("Solicitud de cierre enviada a los administradores");
        fetchVisitDetails();
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
    if (!visit || startingProject) return;
    if (!visit.projects?.length) {
      toast.error("Debes seleccionar al menos un tipo de proyecto antes de iniciar el proyecto");
      return;
    }
    setStartingProject(true);
    try {
      let uploadedBillUrl = visit.bill?.imageUrl || null;
      let uploadedIdUrl = visit.bill?.additionalFileUrl || null;

      editFieldsRef.current.electricBillUrl = uploadedBillUrl || "";
      editFieldsRef.current.idDocumentUrl = uploadedIdUrl || "";
      editFieldsRef.current.clientName = visit.bill?.clientName || editFieldsRef.current.clientName || "";
      editFieldsRef.current.clientEmail = visit.bill?.clientEmail || editFieldsRef.current.clientEmail || "";
      editFieldsRef.current.address = visit.parcel?.address || editFieldsRef.current.address || "";

      await saveProjectDetailsAction(true);
      const billData: Record<string, string | null> = {
        phone: editFields._billPhone?.trim() || visit.bill?.phone || "",
        clientName: editFields._billClientName?.trim() || visit.bill?.clientName || null,
        clientEmail: editFields._billClientEmail?.trim() || visit.bill?.clientEmail || null,
        notes: editFields._billNotes?.trim() || visit.bill?.notes || null,
        imageUrl: visit.bill?.imageUrl || null,
        additionalFileUrl: visit.bill?.additionalFileUrl || null,
        additionalFileName: visit.bill?.additionalFileName || null,
      };
      await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill: { upsert: { create: billData, update: billData } } }),
      });

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
    router.replace(`?tab=${tab}`, { scroll: false });
    if (tab === "chat" && visit && !visit.chatRoom?.id && (visit.stage === "PROJECT" || visit.stage === "CLOSED")) {
      createChatIfNeeded();
    }
  };

  const mergedDetails = { 
    ...(visit?.projectDetails as Record<string, unknown> || {}), 
    ...editFields,
    electricBillUrl: editFields.electricBillUrl || (visit?.projectDetails as Record<string, unknown>)?.electricBillUrl || visit?.bill?.imageUrl,
    idDocumentUrl: editFields.idDocumentUrl || (visit?.projectDetails as Record<string, unknown>)?.idDocumentUrl || visit?.bill?.additionalFileUrl,
  };
  const progress = calculateProjectCompletion(mergedDetails as Record<string, unknown>, fieldMetas, visit?.stage);
  const selectedProjectNames = visit?.projects?.map((p) => p.projectType.name) || [];
  const isAdmin = role === "ADMIN";

  // Detectar si ya se solicitó el cierre
  const closeRequested = (() => {
    if (!visit?.contractFields) return false;
    try { return !!(JSON.parse(visit.contractFields)?.closeRequestedAt); } catch { return false; }
  })();

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
        <button
          onClick={() => {
            const metadata = visit.parcel?.metadata ? (() => { try { return JSON.parse(visit.parcel.metadata); } catch { return null; } })() : null;
            if (metadata?.isManual) {
              toast.info("Lead creado manualmente, no tiene parcela");
            } else if (visit.parcel?.id) {
                router.push(`/map?highlight=${visit.parcel.id}&autoOpen=true`);
            }
          }}
          className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 border-transparent text-on-surface-variant hover:text-on-surface transition-all whitespace-nowrap"
        >
          <MapPin className="w-4 h-4" />
          Ver en mapa
        </button>
        {visit.stage === "PROPOSAL_ACCEPTED" && (
          <button
            onClick={handleStartProject}
            disabled={startingProject}
            className="ml-auto flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all whitespace-nowrap shrink-0"
          >
            {startingProject ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
            {startingProject ? "Iniciando..." : "Comenzar Proyecto"}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "datos" && (
          <TabContent key="datos">
            {visit.stage !== "PROJECT" && visit.stage !== "CLOSED" && visit.stage !== "PROPOSAL_ACCEPTED" && (
              <>
                <DatosLeadPanel visit={visit} editFields={editFields} onFieldChange={handleFieldChange} onUpload={handleUpload} onRefresh={() => fetchVisitDetails(true)} leadTags={leadTags} notAvailTags={notAvailTags} onAddTag={handleAddLeadTag} onRemoveTag={handleRemoveLeadTag} onBillFileUpload={handleBillFileUpload} />
                <div className="mt-6">
                  <NotesPanel visitId={visitId} visitCreatedAt={visit?.createdAt} />
                </div>
              </>
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
              <>
                <DatosProjectFieldsPanel
                  visit={visit}
                  editFields={editFields}
                  onFieldChange={handleFieldChange}
                  onSave={saveProjectDetailsAction}
                  saving={saving}
                  fieldMetas={fieldMetas}
                  fieldMetasByProject={fieldMetasByProject}
                  selectedProjectNames={selectedProjectNames}
                  onFileFieldUpload={handleFileUploadField}
                  onUpload={handleUpload}
                  onRefresh={() => fetchVisitDetails(true)}
                  showBillSection
                  leadTags={leadTags}
                  notAvailTags={notAvailTags}
                  onAddTag={handleAddLeadTag}
                  onRemoveTag={handleRemoveLeadTag}
                  onBillFileUpload={handleBillFileUpload}
                />
                <div className="mt-6">
                  <NotesPanel visitId={visitId} visitCreatedAt={visit?.createdAt} />
                </div>
              </>
            )}

            {visit.stage === "PROJECT" && (
              <>
                <DatosProjectPanel
                  visit={visit}
                  editFields={editFields}
                  onFieldChange={handleFieldChange}
                  onSave={saveProjectDetailsAction}
                  saving={saving}
                  fieldMetas={fieldMetas}
                  fieldMetasByProject={fieldMetasByProject}
                  selectedProjectNames={selectedProjectNames}
                  progress={progress}
                  role={role}
                  closeRequested={closeRequested}
                  onRequestClose={handleRequestClose}
                  onCloseProject={handleCloseProject}
                  onCancelProject={handleCancelProjectAction}
                  onFileFieldUpload={handleFileUploadField}
                />
                <div className="mt-6">
                  <NotesPanel visitId={visitId} visitCreatedAt={visit?.createdAt} />
                </div>
              </>
            )}

            {visit.stage === "CLOSED" && (
              <>
                {isAdmin && (
                  <AssignPartnerPanel visitId={visit.id} currentPartnerId={visit.parcel?.partnerId} onRefresh={() => fetchVisitDetails(true)} />
                )}
                <DatosClosedPanel
                visit={visit}
                fieldMetas={fieldMetas}
                fieldMetasByProject={fieldMetasByProject}
                selectedProjectNames={selectedProjectNames}
                postCloseTags={postCloseTags}
                onToggleTag={handleToggleTag}
                tagSaving={tagSaving}
                isAdmin={isAdmin}
              />
              <div className="mt-6">
                <NotesPanel visitId={visitId} visitCreatedAt={visit?.createdAt} />
              </div>
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
          </TabContent>
        )}

        {activeTab === "archivos" && (
          <TabContent key="archivos">
            <ArchivosPanel visit={visit} onUpdate={async () => {
              try {
                const res = await fetch(`/api/visits/${visitId}/details`);
                if (res.ok) setVisit(await res.json());
              } catch {}
            }} />
          </TabContent>
        )}

        {activeTab === "contratos" && (
          <TabContent key="contratos">
            <div className="w-full">
              <ContractModal isOpen={true} onClose={() => {}} visitId={visitId} inline={true} />
            </div>
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

      {activeTab !== "chat" && (
        <>
          <div className="fixed bottom-24 right-6 z-[60]">
            <Button onClick={() => setShowSaveConfirm(true)} className="shadow-xl rounded-full px-6 py-3 gap-2">
              <Save className="w-5 h-5" />
              Guardar Cambios
            </Button>
          </div>
          <Modal isOpen={showSaveConfirm} onClose={() => setShowSaveConfirm(false)} title="Guardar Cambios">
            <div className="space-y-4">
              <p className="text-on-surface">Quieres guardar los cambios realizados?</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowSaveConfirm(false)} className="flex-1">Cancelar</Button>
                <Button
                  onClick={async () => {
                    setShowSaveConfirm(false);
                    setSaving(true);
                    try {
                      let billUrl = editFields.electricBillUrl || visit?.bill?.imageUrl || "";
                      let idUrl = editFields.idDocumentUrl || visit?.bill?.additionalFileUrl || "";
                      if (pendingBillFile) { billUrl = await handleUpload(pendingBillFile); setEditFields(prev => ({ ...prev, electricBillUrl: billUrl })); setPendingBillFile(null); }
                      if (pendingIdFile) { idUrl = await handleUpload(pendingIdFile); setEditFields(prev => ({ ...prev, idDocumentUrl: idUrl })); setPendingIdFile(null); }
                      const payload: Record<string, unknown> = { ...editFields };
                      if (visit?.bill?.imageUrl) payload.electricBillUrl = payload.electricBillUrl || visit.bill.imageUrl;
                      if (visit?.bill?.additionalFileUrl) payload.idDocumentUrl = payload.idDocumentUrl || visit.bill.additionalFileUrl;
                      if (!payload.clientName || payload.clientName === "") payload.clientName = visit?.bill?.clientName || "";
                      if (!payload.clientEmail || payload.clientEmail === "") payload.clientEmail = visit?.bill?.clientEmail || "";
                      if (!payload.address || payload.address === "") payload.address = visit?.parcel?.address || "";
                      Object.keys(payload).forEach(k => { if (k.startsWith("_bill") || payload[k] === "" || payload[k] === null) delete payload[k]; });
                      if (payload.closingDate && typeof payload.closingDate === "string") payload.closingDate = new Date(payload.closingDate).toISOString();
                      if (payload.siteSurveyDate && typeof payload.siteSurveyDate === "string") payload.siteSurveyDate = new Date(payload.siteSurveyDate).toISOString();
                      if (Object.keys(payload).length > 0) { await fetch("/api/project-details", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitId, ...payload }) }); }
                      const billData: Record<string, string | null> = { phone: editFields._billPhone?.trim() || visit?.bill?.phone || "", clientName: editFields._billClientName?.trim() || visit?.bill?.clientName || null, clientEmail: editFields._billClientEmail?.trim() || visit?.bill?.clientEmail || null, notes: editFields._billNotes?.trim() || visit?.bill?.notes || null, imageUrl: billUrl || visit?.bill?.imageUrl || null, additionalFileUrl: idUrl || visit?.bill?.additionalFileUrl || null };
                      await fetch(`/api/visits/${visit?.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bill: { upsert: { create: billData, update: billData } } }) });
                      toast.success("Cambios guardados");
                      fetchVisitDetails(true);
                    } catch { toast.error("Error al guardar"); }
                    finally { setSaving(false); }
                  }}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Si, guardar
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}
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

function RequiredBadge({ required }: { required?: boolean }) {
  if (required === undefined) return null;
  if (required) {
    return (
      <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
        Obligatorio
      </span>
    );
  }
  return (
    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant border border-outline-variant/50">
      Opcional
    </span>
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
  required,
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
  required?: boolean;
}) {
  if (isFile) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center flex-wrap gap-1">
          {label}<RequiredBadge required={required} />
        </label>
        <div className="flex items-center gap-3">
          {fileUrl && (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
              <Eye className="w-4 h-4" /> Ver
            </a>
          )}
          {!readOnly && !fileUrl && (
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
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center flex-wrap gap-1">{label}<RequiredBadge required={required} /></label>
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
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center flex-wrap gap-1">{label}<RequiredBadge required={required} /></label>
        <select value={value} onChange={(e) => onChange?.(field, e.target.value)} onBlur={onBlur} disabled={readOnly}
          className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface transition-colors">
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

  if (field === "waterSystemType") {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center flex-wrap gap-1">{label}<RequiredBadge required={required} /></label>
        <select value={value} onChange={(e) => onChange?.(field, e.target.value)} onBlur={onBlur} disabled={readOnly}
          className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface transition-colors">
          <option value="">Seleccionar...</option>
          <option value="Sistema completo">Sistema completo</option>
          <option value="Softener">Softener</option>
          <option value="R.O">R.O</option>
          <option value="Sistema de pozo">Sistema de pozo</option>
        </select>
      </div>
    );
  }

  if (type === "number" || field.includes("CommPct") || field.includes("Price") || field.includes("Commission")) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center flex-wrap gap-1">{label}<RequiredBadge required={required} /></label>
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
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center flex-wrap gap-1">
        {label}<RequiredBadge required={required} />
      </label>
      <Input
        value={value}
        onChange={(e) => onChange?.(field, (e.target as HTMLInputElement).value)}
        onBlur={onBlur}
        readOnly={readOnly}
      />
    </div>
  );
}

function ClientInfoPanel({
  editFields,
  onFieldChange,
  onSave,
  isReadOnly,
  visit,
}: {
  editFields?: Record<string, string>;
  onFieldChange?: (key: string, v: string) => void;
  onSave?: () => void;
  isReadOnly?: boolean;
  visit?: VisitDetails;
}) {
  if (isReadOnly && visit) {
    return (
      <Panel title="Información del Cliente" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReadOnlyField label="Nombre" value={visit.bill?.clientName || "-"} />
          <ReadOnlyField label="Correo" value={visit.bill?.clientEmail || "-"} />
          <ReadOnlyField label="Teléfono" value={visit.bill?.phone || "-"} />
        </div>
      </Panel>
    );
  }
  return (
    <Panel title="Información del Cliente" icon={User}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center flex-wrap gap-1">Nombre<RequiredBadge required={true} /></label>
          <Input value={editFields?._billClientName || ""} onChange={(e) => onFieldChange?.("_billClientName", (e.target as HTMLInputElement).value)} onBlur={onSave} placeholder="Nombre del cliente" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center flex-wrap gap-1">Correo<RequiredBadge required={true} /></label>
          <Input type="email" value={editFields?._billClientEmail || ""} onChange={(e) => onFieldChange?.("_billClientEmail", (e.target as HTMLInputElement).value)} onBlur={onSave} placeholder="Correo electrónico" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center flex-wrap gap-1">Teléfono<RequiredBadge required={true} /></label>
          <Input type="tel" value={editFields?._billPhone || ""} onChange={(e) => onFieldChange?.("_billPhone", (e.target as HTMLInputElement).value)} onBlur={onSave} placeholder="Número de teléfono" />
        </div>
      </div>
    </Panel>
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
  onBillFileUpload,
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
  onBillFileUpload?: (type: "imageUrl" | "additionalFileUrl", file: File) => Promise<void>;
}) {
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
    } catch { /* */ }
  };

  const handleSaveAll = async () => {
    if (!visit) return;
    setSaving(true);
    try {
      const billData: Record<string, string | null> = {
        phone: editFields._billPhone?.trim() || visit.bill?.phone || "",
        clientName: editFields._billClientName?.trim() || visit.bill?.clientName || null,
        clientEmail: editFields._billClientEmail?.trim() || visit.bill?.clientEmail || null,
        imageUrl: visit.bill?.imageUrl || null,
        notes: editFields._billNotes?.trim() || visit.bill?.notes || null,
        additionalFileUrl: visit.bill?.additionalFileUrl || null,
        additionalFileName: visit.bill?.additionalFileName || null,
      };

      await fetch(`/api/visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill: { upsert: { create: billData, update: billData } } }),
      });

      if (editFields._billNotes !== undefined) {
        const fetchRes = await fetch(`/api/visits/${visit.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ legacyNotes: editFields._billNotes?.trim() || null }),
        });
        if (!fetchRes.ok) throw new Error("Error al guardar notas");
      }

      toast.success("Datos guardados");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ClientInfoPanel editFields={editFields} onFieldChange={onFieldChange} />

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
            preview={visit.bill?.additionalFileUrl || ""}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f && onBillFileUpload) await onBillFileUpload("additionalFileUrl", f);
            }}
            onClear={() => {}}
          />
          <UploadField
            label="Recibo de Luz"
            preview={visit.bill?.imageUrl || ""}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f && onBillFileUpload) await onBillFileUpload("imageUrl", f);
            }}
            onClear={() => {}}
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
  fieldMetasByProject,
  selectedProjectNames,
  onFileFieldUpload,
  onUpload,
  onRefresh,
  showBillSection,
  leadTags,
  notAvailTags,
  onAddTag,
  onRemoveTag,
  onBillFileUpload,
}: {
  visit: VisitDetails;
  editFields: Record<string, string>;
  onFieldChange: (key: string, v: string) => void;
  onSave: () => void;
  saving: boolean;
  fieldMetas: FieldMeta[];
  fieldMetasByProject: { projectTypeName: string; projectTypeId: number; fields: FieldMeta[] }[];
  selectedProjectNames: string[];
  onFileFieldUpload: (fieldName: string, file: File) => void;
  onUpload: (file: File) => Promise<string>;
  onRefresh: () => void;
  showBillSection?: boolean;
  leadTags: { name: string; color: string }[];
  notAvailTags: { id: number; name: string; color: string }[];
  onAddTag: (tag: { name: string; color: string }) => void;
  onRemoveTag: (tagName: string) => void;
  onBillFileUpload?: (type: "imageUrl" | "additionalFileUrl", file: File) => Promise<void>;
}) {
  const pd = visit.projectDetails || {};
  const nonCommonFields = fieldMetas.filter((m) => !COMMON_FIELDS.includes(m.fieldName));

  const [allProjectTypes, setAllProjectTypes] = useState<{ id: number; name: string }[]>([]);
  const [selectedProjectTypeIds, setSelectedProjectTypeIds] = useState<number[]>([]);
  const [projectTypesSaving, setProjectTypesSaving] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());

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
    } catch {
      toast.error("Error al actualizar tipos de proyecto");
      setSelectedProjectTypeIds(visit.projects.map((p) => p.projectType.id));
    } finally {
      setProjectTypesSaving(false);
    }
  };

  const toggleExpandProject = (ptId: number) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(ptId)) next.delete(ptId); else next.add(ptId);
      return next;
    });
  };

  const getValue = (key: string): string => {
    if (editFields[key] !== undefined) return editFields[key];
    const val = pd[key];
    if (val === undefined || val === null) return "";
    if ((key === "closingDate" || key === "siteSurveyDate") && typeof val === "string") return val.split("T")[0];
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
        <DatosLeadPanel visit={visit} editFields={editFields} onFieldChange={onFieldChange} onUpload={onUpload} onRefresh={onRefresh} leadTags={leadTags} notAvailTags={notAvailTags} onAddTag={onAddTag} onRemoveTag={onRemoveTag} onBillFileUpload={onBillFileUpload} />
      )}

      <Panel title="Campos Generales" icon={Pencil}>
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
              required={OPTIONAL_FIELDS.includes(key) ? false : REQUIRED_COMMON_FIELDS.has(key) ? true : false}
            />
          ))}
        </div>
      </Panel>

      {fieldMetasByProject.length > 0 && fieldMetasByProject.map((project) => {
        const isExpanded = expandedProjects.has(project.projectTypeId);
        const projectFields = project.fields.filter((m) => !COMMON_FIELDS.includes(m.fieldName));
        return (
          <div key={project.projectTypeId} className="glass-panel rounded-xl">
            <button
              onClick={() => toggleExpandProject(project.projectTypeId)}
              className="w-full p-6 flex items-center justify-between text-left"
            >
              <h3 className="font-semibold text-lg flex items-center gap-2 text-on-surface">
                <Package className="w-5 h-5 text-primary" />
                {project.projectTypeName}
              </h3>
              <ChevronDown className={`w-5 h-5 text-on-surface-variant transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            </button>
            {isExpanded && (
              <div className="px-6 pb-6">
                {projectFields.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projectFields.map((meta) => (
                      <FieldRow key={meta.fieldName} label={meta.fieldLabel || meta.fieldName}
                        value={getValue(meta.fieldName)} field={meta.fieldName}
                        type={meta.fieldType || "text"} onChange={(_, v) => onFieldChange(meta.fieldName, v)}
                        onBlur={onSave} isFile={meta.fieldType === "file" || meta.fieldType === "photos"}
                        onFileUpload={onFileFieldUpload} fileUrl={pd[meta.fieldName] ? String(pd[meta.fieldName]) : undefined}
                        required={meta.isRequired === false ? false : meta.isRequired === true ? true : undefined} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant">Sin campos específicos para este proyecto</p>
                )}
              </div>
            )}
          </div>
        );
      })}
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
  fieldMetasByProject,
  selectedProjectNames,
  progress,
  role,
  closeRequested,
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
  fieldMetasByProject: { projectTypeName: string; projectTypeId: number; fields: FieldMeta[] }[];
  selectedProjectNames: string[];
  progress: number;
  role: string;
  closeRequested: boolean;
  onRequestClose: () => void;
  onCloseProject: () => void;
  onCancelProject: () => void;
  onFileFieldUpload: (fieldName: string, file: File) => void;
}) {
  const pd = visit.projectDetails || {};
  const nonCommonFields = fieldMetas.filter((m) => !COMMON_FIELDS.includes(m.fieldName));

  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());

  const toggleExpandProject = (ptId: number) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(ptId)) next.delete(ptId); else next.add(ptId);
      return next;
    });
  };

  const getValue = (key: string): string => {
    if (editFields[key] !== undefined) return editFields[key];
    const val = pd[key];
    if (val === undefined || val === null) return "";
    if ((key === "closingDate" || key === "siteSurveyDate") && typeof val === "string") return val.split("T")[0];
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
      <Panel
        title="Progreso del Proyecto"
        icon={BadgeCheck}
        className="sticky top-4 z-10 shadow-lg border-2 border-primary/20 backdrop-blur-xl bg-surface/80"
      >
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
          <div className="mt-4 flex gap-3 flex-wrap items-center">
            {isTraineeOrCloser && (
              closeRequested ? (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-600 dark:text-amber-400">
                  <BadgeCheck className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-semibold">Cierre Solicitado</span>
                </div>
              ) : (
                <Button onClick={onRequestClose} variant="outline">
                  <BadgeCheck className="w-4 h-4" />
                  Solicitar Cierre
                </Button>
              )
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

      <ClientInfoPanel editFields={editFields} onFieldChange={onFieldChange} onSave={onSave} />

      <Panel title="Documentos" icon={FileText}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldRow
            label="ID del Cliente"
            value={getValue("idDocumentUrl")}
            field="idDocumentUrl"
            isFile
            required={true}
            onFileUpload={onFileFieldUpload}
            fileUrl={pd["idDocumentUrl"] ? String(pd["idDocumentUrl"]) : undefined}
          />
          <FieldRow
            label="Recibo de Luz"
            value={getValue("electricBillUrl")}
            field="electricBillUrl"
            isFile
            required={true}
            onFileUpload={onFileFieldUpload}
            fileUrl={pd["electricBillUrl"] ? String(pd["electricBillUrl"]) : undefined}
          />
        </div>
      </Panel>

      <Panel title="Campos Generales" icon={Pencil}>
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
              required={OPTIONAL_FIELDS.includes(key) ? false : REQUIRED_COMMON_FIELDS.has(key) ? true : false}
            />
          ))}
        </div>
      </Panel>

      {fieldMetasByProject.length > 0 && fieldMetasByProject.map((project) => {
        const isExpanded = expandedProjects.has(project.projectTypeId);
        const projectFields = project.fields.filter((m) => !COMMON_FIELDS.includes(m.fieldName));
        return (
          <div key={project.projectTypeId} className="glass-panel rounded-xl">
            <button
              onClick={() => toggleExpandProject(project.projectTypeId)}
              className="w-full p-6 flex items-center justify-between text-left"
            >
              <h3 className="font-semibold text-lg flex items-center gap-2 text-on-surface">
                <Package className="w-5 h-5 text-primary" />
                {project.projectTypeName}
              </h3>
              <ChevronDown className={`w-5 h-5 text-on-surface-variant transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            </button>
            {isExpanded && (
              <div className="px-6 pb-6">
                {projectFields.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projectFields.map((meta) => (
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
                        required={meta.isRequired === false ? false : meta.isRequired === true ? true : undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant">Sin campos específicos para este proyecto</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex gap-3">
        <Button onClick={onCancelProject} variant="danger" disabled={saving} className="flex-1">
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
  fieldMetasByProject,
  selectedProjectNames,
  postCloseTags,
  onToggleTag,
  tagSaving,
  isAdmin,
}: {
  visit: VisitDetails;
  fieldMetas: FieldMeta[];
  fieldMetasByProject: { projectTypeName: string; projectTypeId: number; fields: FieldMeta[] }[];
  selectedProjectNames: string[];
  postCloseTags: string[];
  onToggleTag: (tag: string) => void;
  tagSaving: boolean;
  isAdmin: boolean;
}) {
  const pd = visit.projectDetails || {};

  const nonCommonFields = fieldMetas.filter((m) => !COMMON_FIELDS.includes(m.fieldName));
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());

  const toggleExpandProject = (ptId: number) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(ptId)) next.delete(ptId); else next.add(ptId);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <ClientInfoPanel isReadOnly visit={visit} />
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

      <Panel title="Campos Generales" icon={Pencil}>
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

      {fieldMetasByProject.length > 0 && fieldMetasByProject.map((project) => {
        const isExpanded = expandedProjects.has(project.projectTypeId);
        const projectFields = project.fields
          .filter((m) => !COMMON_FIELDS.includes(m.fieldName))
          .filter((meta) => pd[meta.fieldName] !== undefined && pd[meta.fieldName] !== null && pd[meta.fieldName] !== "");
        return (
          <div key={project.projectTypeId} className="glass-panel rounded-xl">
            <button
              onClick={() => toggleExpandProject(project.projectTypeId)}
              className="w-full p-6 flex items-center justify-between text-left"
            >
              <h3 className="font-semibold text-lg flex items-center gap-2 text-on-surface">
                <Package className="w-5 h-5 text-primary" />
                {project.projectTypeName}
              </h3>
              <ChevronDown className={`w-5 h-5 text-on-surface-variant transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
            </button>
            {isExpanded && (
              <div className="px-6 pb-6">
                {projectFields.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projectFields.map((meta) => (
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
                ) : (
                  <p className="text-sm text-on-surface-variant">Sin campos específicos para este proyecto</p>
                )}
              </div>
            )}
          </div>
        );
      })}

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
      <ClientInfoPanel isReadOnly visit={visit} />
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
          {visit.legacyNotes && <ReadOnlyField label="Notas" value={visit.legacyNotes} multiline />}
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

function ArchivosPanel({ visit, onUpdate }: { visit: VisitDetails; onUpdate?: () => void }) {
  const router = useRouter();
  const pd = visit.projectDetails || {};
  const bill = visit.bill;

  const [docName, setDocName] = useState("");
  const [customName, setCustomName] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [customDocs, setCustomDocs] = useState<{ name: string; url: string }[]>([]);
  const [fileToDelete, setFileToDelete] = useState<FileEntry | null>(null);

  const DOCUMENT_OPTIONS = [
    "ID del Cliente",
    "Recibo de Luz",
    "Seguro de Hogar",
    "Título de Propiedad",
    "NOC",
    "Exterior Scope",
    "Reporte de Techo",
    "Fotos de Paneles",
    "Formulario de Cierre",
    "Orden de Materiales",
    "Fotos de Propiedad"
  ];

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
    fieldKey?: string;
  }

  const allFilesFlat: FileEntry[] = [];

  const addFile = (name: string, url: string | undefined | null, fieldKey?: string) => {
    if (!url) return;
    allFilesFlat.push({ name, url, fieldKey });
  };

  const hasIdUrl = pd.idDocumentUrl || bill?.additionalFileUrl;
  const hasBillUrl = pd.electricBillUrl || bill?.imageUrl;

  if (hasIdUrl) addFile("ID del Cliente", String(hasIdUrl), "idDocumentUrl");
  if (hasBillUrl) addFile("Recibo de Luz", String(hasBillUrl), "electricBillUrl");
  addFile("Seguro de Hogar", pd.homeInsuranceUrl ? String(pd.homeInsuranceUrl) : undefined, "homeInsuranceUrl");
  addFile("Título de Propiedad", pd.homeTitleUrl ? String(pd.homeTitleUrl) : undefined, "homeTitleUrl");
  addFile("NOC", pd.nocUrl ? String(pd.nocUrl) : undefined, "nocUrl");
  addFile("Exterior Scope", pd.exteriorScopeUrl ? String(pd.exteriorScopeUrl) : undefined, "exteriorScopeUrl");
  addFile("Reporte de Techo", pd.roofReportUrl ? String(pd.roofReportUrl) : undefined, "roofReportUrl");
  addFile("Fotos de Paneles", pd.panelsPhotoUrl ? String(pd.panelsPhotoUrl) : undefined, "panelsPhotoUrl");
  addFile("Formulario de Cierre", pd.closingFormUrl ? String(pd.closingFormUrl) : undefined, "closingFormUrl");
  addFile("Orden de Materiales", pd.materialsOrderUrl ? String(pd.materialsOrderUrl) : undefined, "materialsOrderUrl");

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

  const handleDeleteFile = async (file: FileEntry) => {
    try {
      if (file.fieldKey) {
        // Project/Bill required file — clear the field
        if (file.fieldKey === "idDocumentUrl" || file.fieldKey === "additionalFileUrl") {
          await fetch("/api/project-details", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visitId: visit.id, idDocumentUrl: null }),
          });
          await fetch(`/api/visits/${visit.id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bill: { upsert: { create: { additionalFileUrl: null }, update: { additionalFileUrl: null } } } }),
          });
        } else if (file.fieldKey === "electricBillUrl" || file.fieldKey === "imageUrl") {
          await fetch("/api/project-details", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visitId: visit.id, electricBillUrl: null }),
          });
          await fetch(`/api/visits/${visit.id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bill: { upsert: { create: { imageUrl: null }, update: { imageUrl: null } } } }),
          });
        } else {
          await fetch("/api/project-details", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visitId: visit.id, [file.fieldKey]: null }),
          });
        }
      } else {
        // Custom document — remove from customDocs
        const updatedDocs = customDocs.filter(d => d.url !== file.url);
        setCustomDocs(updatedDocs);
        await fetch("/api/project-details", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitId: visit.id, customDocs: JSON.stringify(updatedDocs) }),
        });
      }
      toast.success("Archivo eliminado");
      if (onUpdate) onUpdate();
      else router.refresh();
    } catch { toast.error("Error al eliminar"); }
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setDocFile(f);
  };

  const finalDocName = docName === "Otro" ? customName : docName;
  const isOptUploaded = (opt: string) => allFilesFlat.some(f => f.name === opt || (opt === "Fotos de Propiedad" && f.name.startsWith("Foto de Propiedad")));
  const isAlreadyUploaded = docName !== "Otro" && docName !== "" && isOptUploaded(docName);

  const uploadDocument = async () => {
    if (!finalDocName.trim() || !docFile || isAlreadyUploaded) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", docFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const data = await uploadRes.json();
      const url = data.url;

      const updatedDocs = [...customDocs, { name: finalDocName.trim(), url }];
      setCustomDocs(updatedDocs);

      await fetch("/api/project-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId: visit.id, customDocs: JSON.stringify(updatedDocs) }),
      });

      setDocName("");
      setCustomName("");
      setDocFile(null);
      toast.success("Documento subido");
      if (onUpdate) onUpdate();
      else router.refresh();
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
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 flex-wrap">
              <select
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="flex-1 min-w-[200px] h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-sm"
              >
                <option value="">Selecciona un documento</option>
                {DOCUMENT_OPTIONS.map(opt => {
                  const uploaded = isOptUploaded(opt);
                  return (
                    <option key={opt} value={opt} disabled={uploaded}>
                      {opt}{uploaded ? " (Ya subido)" : ""}
                    </option>
                  );
                })}
                <option value="Otro">Otro (Especificar)</option>
              </select>
              {docName === "Otro" && (
                <input
                  type="text"
                  placeholder="Nombre del documento"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="flex-1 min-w-[200px] h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-sm"
                />
              )}
              <input
                type="file"
                onChange={handleDocUpload}
                className="text-sm text-on-surface file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-on-primary file:text-xs"
              />
              <Button onClick={uploadDocument} disabled={uploading || !finalDocName.trim() || !docFile || isAlreadyUploaded}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subir"}
              </Button>
            </div>
            {isAlreadyUploaded && (
              <p className="text-xs text-red-500 font-medium">ya se encuentra el archivo no se necesita otro</p>
            )}
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
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap">
            <select
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="flex-1 min-w-[200px] h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-sm"
            >
              <option value="">Selecciona un documento</option>
              {DOCUMENT_OPTIONS.map(opt => {
                const uploaded = isOptUploaded(opt);
                return (
                  <option key={opt} value={opt} disabled={uploaded}>
                    {opt}{uploaded ? " (Ya subido)" : ""}
                  </option>
                );
              })}
              <option value="Otro">Otro (Especificar)</option>
            </select>
            {docName === "Otro" && (
              <input
                type="text"
                placeholder="Nombre del documento"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="flex-1 min-w-[200px] h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-sm"
              />
            )}
            <input
              type="file"
              onChange={handleDocUpload}
              className="text-sm text-on-surface file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-on-primary file:text-xs"
            />
            <Button onClick={uploadDocument} disabled={uploading || !finalDocName.trim() || !docFile || isAlreadyUploaded}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subir"}
            </Button>
          </div>
          {isAlreadyUploaded && (
            <p className="text-xs text-red-500 font-medium">ya se encuentra el archivo no se necesita otro</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {allFilesFlat.map((file, i) => {
          const isImage = /\.(jpg|jpeg|png|gif|webp|svg|heic|heif)$/i.test(file.url);
          return (
            <motion.div
              key={i}
              className="glass-panel rounded-xl overflow-hidden border border-outline-variant/30 relative group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <button
                onClick={() => setFileToDelete(file)}
                className="absolute top-1 left-1 z-10 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Eliminar archivo"
              >
                <X className="w-3 h-3" />
              </button>
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

      <AnimatePresence>
        {fileToDelete && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-deep-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-surface rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center border border-outline-variant/30 relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-xl font-bold text-on-surface mb-2">Eliminar Documento</h3>
              <p className="text-on-surface-variant mb-6 text-sm">
                ¿Quieres eliminar este documento?
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setFileToDelete(null)}
                  className="flex-1"
                >
                  No
                </Button>
                <Button
                  onClick={async () => {
                    await handleDeleteFile(fileToDelete);
                    setFileToDelete(null);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0"
                >
                  Sí
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
  className = "",
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass-panel rounded-xl p-6 ${className}`}>
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
