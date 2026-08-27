"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { formatPhoneNumber } from "@/lib/utils";
import DOMPurify from "dompurify";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/lib/locale-context";
import {
  COMMON_FIELDS,
  OPTIONAL_FIELDS,
  FILE_FIELD_KEYS,
} from "@/lib/project-constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Send,
  Paperclip, Mail,
  Loader2,
  MessageSquare,
  Package,
  FileText,
  Pencil,
  CheckCheck,
  Search,
  ArrowLeft,
  Info,
  List,
  X,
  MapPin,
  User,
  PlusCircle,
  Phone,
  Folder,
  Calendar,
  Activity,
  CheckCircle,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ContractModal } from "@/components/quote/ContractModal";

const getStageBadge = (stage?: string) => {
  const stageMap: Record<string, { label: string; color: string }> = {
    IN_PROGRESS: { label: "Leads", color: "#3b82f6" },
    POTENTIAL_LEAD: { label: "Lead Potencial", color: "#f59e0b" },
    PROPOSAL_ACCEPTED: { label: "Leads Potenciales", color: "#f59e0b" },
    PROJECT: { label: "En Proyecto", color: "#a855f7" },
    CLOSED: { label: "Proyecto Finalizado", color: "#22c55e" },
    CANCELLED: { label: "Proyecto Cancelado", color: "#ef4444" },
  };
  const s = stageMap[stage || ""] || {
    label: stage || "Desconocido",
    color: "#6b7280",
  };
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide"
      style={{
        backgroundColor: `${s.color}20`,
        color: s.color,
        border: `1px solid ${s.color}40`,
      }}
    >
      {s.label}
    </span>
  );
};
interface ProjectDetails {
  [key: string]: string | number | boolean | undefined;
  clientName?: string;
  clientEmail?: string;
  address?: string;
  closingDate?: string;
  paymentMethod?: string;
  solarFinancier?: string;
  systemSize?: string;
  otherSalePrice?: number;
  primaryRep?: string;
  primaryRepCommPct?: number;
}

interface CommonField {
  id: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  options?: string;
  isRequired: boolean;
}

interface ProjectType {
  id: number;
  name: string;
}

interface ObjectionEntry {
  objection?: { name: string; color: string };
  closerObjection?: { name: string; color: string };
}

interface Room {
  id: number;
  type?: string;
  partnerId?: number | null;
  createdAt?: string;
  personalUser?: { id: number; name: string; role: string; email?: string; phone?: string; profile?: { address?: string; profilePhoto?: string } };
  visit?: any;
  messages: {
    userId: number;
    isRead: boolean;
    body: string;
    user: { name: string };
    createdAt: string;
  }[];
}

interface Message {
  id: number;
  body: string;
  fileUrl?: string;
  fileName?: string;
  user: { id: number; name: string };
  createdAt: string;
}

type ColumnView = "list" | "conversation" | "info";

interface ParcelTag {
  name: string;
  color?: string;
  date?: string;
}

function parseParcelTags(raw?: string | null): ParcelTag[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getVisitSpecialTag(visit: {
  stage?: string;
  contractFields?: string | null;
}): string {
  if (!visit?.contractFields) return "";
  try {
    const cf = JSON.parse(visit.contractFields);
    if (visit.stage === "CLOSED") {
      return cf.postCloseTags || "";
    }
    if (visit.stage === "PROJECT") {
      if (cf.closeRequestedAt) return "Cierre Solicitado";
      if (cf.returnedAt) return "Proyecto devuelto";
      return "";
    }
    return "";
  } catch {
    return "";
  }
}

export function ChatInterface({
  isAdmin = false,
  initialRoomId = null,
  hideRoomList = false,
}: {
  isAdmin?: boolean;
  initialRoomId?: number | null;
  hideRoomList?: boolean;
}) {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "";
  const { t } = useLocale();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(
    initialRoomId,
  );
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [editForm, setEditForm] = useState<ProjectDetails>({});
  const [saving, setSaving] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<
    { id: number; name: string; role: string }[]
  >([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [commonFields, setCommonFields] = useState<CommonField[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [mobileColumn, setMobileColumn] = useState<ColumnView>("list");
  const [fieldMetas, setFieldMetas] = useState<
    { fieldName: string; isRequired?: boolean }[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (initialRoomId && rooms.length > 0) {
      const room = rooms.find((r) => r.id === initialRoomId);
      if (room) {
        setSelectedRoomId(room.id);
        setSelectedRoom(room);
        setMobileColumn("conversation");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRoomId, rooms]);

  useEffect(() => {
    if (selectedRoomId) {
      fetchMessages(selectedRoomId);
      fetchMentionUsers(selectedRoomId);
      setMobileColumn("conversation");
    }
  }, [selectedRoomId]);

  useEffect(() => {
    if (
      selectedRoom?.visit?.projects &&
      selectedRoom?.visit?.projects.length > 0
    ) {
      const fetchFieldMetas = async () => {
        const allMetas: { fieldName: string; isRequired?: boolean }[] = [];
        const uniqueIds = Array.from(
          new Set(selectedRoom?.visit?.projects!.map((p: any) => p.projectType.id)),
        );
        for (const typeId of uniqueIds) {
          try {
            const res = await fetch(
              `/api/admin/project-type-fields?projectTypeId=${typeId}`,
            );
            const fields = await res.json();
            if (Array.isArray(fields)) allMetas.push(...fields);
          } catch {
            /* */
          }
        }

        try {
          const typesRes = await fetch("/api/project-types");
          const types = await typesRes.json();
          const commons = Array.isArray(types)
            ? types.find(
                (t: { id: number; name: string }) =>
                  t.name === "Campos Comunes",
              )
            : null;
          if (commons) {
            const res = await fetch(
              `/api/admin/project-type-fields?projectTypeId=${commons.id}`,
            );
            const fields = await res.json();
            if (Array.isArray(fields)) {
              for (const f of fields) {
                if (!allMetas.some((m) => m.fieldName === f.fieldName)) {
                  allMetas.push(f);
                }
              }
            }
          }
        } catch {
          /* */
        }

        setFieldMetas(allMetas);
      };
      fetchFieldMetas();
    } else {
      setFieldMetas([]);
    }
  }, [selectedRoom?.visit?.projects]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/chat/rooms");
      const data = await res.json();
      const sorted = Array.isArray(data) ? data : [];
      sorted.sort((a: any, b: any) => {
        if (a.type === "ANNOUNCEMENTS" && b.type !== "ANNOUNCEMENTS") return -1;
        if (a.type !== "ANNOUNCEMENTS" && b.type === "ANNOUNCEMENTS") return 1;
        return 0;
      });
      setRooms(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMentionUsers = async (roomId?: number) => {
    try {
      const url = roomId
        ? `/api/users/mentionable?roomId=${roomId}`
        : "/api/users/mentionable";
      const res = await fetch(url);
      const data = await res.json();
      setMentionUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMessages = async (roomId: number) => {
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}`);
      if (!res.ok) {
        setSelectedRoom(null);
        setSelectedRoomId(null);
        return;
      }
      const data = await res.json();
      setMessages(data.messages);
      setSelectedRoom(data);
    } catch {
      setSelectedRoom(null);
      setSelectedRoomId(null);
    }
  };

  const handleSelectRoom = (room: Room) => {
    setSelectedRoomId(room.id);
    setSelectedRoom(room);
  };

  const fetchCommonFields = async () => {
    try {
      const typesRes = await fetch("/api/project-types");
      const types = await typesRes.json();
      const comunes = types.find(
        (t: { id: number; name: string }) => t.name === "Campos Comunes",
      );
      if (comunes) {
        const fieldsRes = await fetch(
          `/api/admin/project-type-fields?projectTypeId=${comunes.id}`,
        );
        const fields = await fieldsRes.json();
        setCommonFields(fields);
      }
    } catch (error) {
      console.error("Error fetching common fields:", error);
    }
  };

  useEffect(() => {
    if (showEditModal) {
      fetchCommonFields();
    }
  }, [showEditModal]);

  const handleOpenEditModal = () => {
    const pd = projectDetails || {};
    const address = pd.address || selectedRoom?.visit?.parcel?.address || "";
    setEditForm({
      ...pd,
      address,
      clientName: (pd.clientName || bill?.clientName || "") as string,
      clientEmail: (pd.clientEmail || bill?.clientEmail || "") as string,
    });
    setShowEditModal(true);
  };

  const handleSaveProjectDetails = async () => {
    if (!selectedRoom) return;

    setSaving(true);
    try {
      const res = await fetch("/api/project-details", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitId: selectedRoom?.visit?.id,
          ...editForm,
        }),
      });

      if (res.ok) {
        setShowEditModal(false);
        fetchMessages(selectedRoom.id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedRoom) return;
    try {
      const res = await fetch(
        `/api/visits/${selectedRoom?.visit?.id}/finalize`,
        { method: "PATCH" },
      );
      if (res.ok) {
        const updated = await res.json();
        if (selectedRoom) {
          setSelectedRoom({
            ...selectedRoom,
            visit: { ...selectedRoom.visit, finalizedAt: updated.finalizedAt },
          });
          setRooms((prev) =>
            prev.map((r) =>
              r.id === selectedRoom.id
                ? {
                    ...r,
                    visit: { ...r.visit, finalizedAt: updated.finalizedAt },
                  }
                : r,
            ),
          );
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;

    setSending(true);
    const res = await fetch(`/api/chat/rooms/${selectedRoom.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newMessage }),
    });

    if (res.ok) {
      setNewMessage("");
      setShowMentionDropdown(false);
      fetchMessages(selectedRoom.id);
      fetchRooms();
    }
    setSending(false);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    const isPartnerRoom =
      (selectedRoom as any)?.type === "PARTNER" || role === "PARTNER";
    if (isPartnerRoom) {
      setShowMentionDropdown(false);
      return;
    }

    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const textAfterAt = value.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(" ")) {
        setMentionSearch(textAfterAt);
        setShowMentionDropdown(true);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleMentionSelect = (user: { id: number; name: string }) => {
    const lastAtIndex = newMessage.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const beforeAt = newMessage.slice(0, lastAtIndex);
      const newMsg = `${beforeAt}@${user.name} `;
      setNewMessage(newMsg);
      setShowMentionDropdown(false);
      setMentionSearch("");
    }
  };

  const filteredMentionUsers = mentionUsers.filter((user) =>
    user.name.toLowerCase().includes(mentionSearch.toLowerCase()),
  );

  const renderMessageWithMentions = (text: string) => {
    if (text.trim().startsWith("<") && text.includes("</")) {
      const cleanHtml = DOMPurify.sanitize(text);
      return <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
    }
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        return <span key={index} className="font-semibold bg-primary/20 px-1 rounded">{part}</span>;
      }
      return part;
    });
  };

  const openTemplatesModal = async () => {
    setShowTemplatesModal(true);
    if (templates.length === 0) {
      setLoadingTemplates(true);
      try {
        const res = await fetch("/api/admin/templates");
        const data = await res.json();
        if (Array.isArray(data)) setTemplates(data.filter((t: any) => t.isActive));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTemplates(false);
      }
    }
  };

  const handleSendTemplate = async (tmpl: any) => {
    setShowTemplatesModal(false);
    if (!selectedRoom) return;

    setSending(true);
    const messageBody = `<div style="text-align: center; margin-bottom: 15px;"><img src="/logo-company.png" alt="OneSolutions" style="max-height: 60px; display: inline-block;" /></div>${tmpl.content}`;

    try {
      const res = await fetch(`/api/chat/rooms/${selectedRoom.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: messageBody }),
      });

      if (res.ok) {
        fetchMessages(selectedRoom.id);
        fetchRooms();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoom) return;

    setSending(true);
    const formData = new FormData();
    formData.append("file", file);
    const uploadRes = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const uploadData = await uploadRes.json();

    await fetch(`/api/chat/rooms/${selectedRoom.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: `Archivo: ${file.name}`,
        fileUrl: uploadData.url,
        fileName: file.name,
      }),
    });

    fetchMessages(selectedRoom.id);
    fetchRooms();
    setSending(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const filteredRooms = rooms.filter((room) => {
    const q = searchQuery.trim().toLowerCase();
    const address = (room.visit?.parcel?.address || "").toLowerCase();
    const clientName = (room.visit?.bill?.clientName || room.personalUser?.name || "").toLowerCase();
    const matchesSearch = !q || address.includes(q) || clientName.includes(q);
    const matchesStage = !stageFilter || room.visit?.stage === stageFilter;
    const matchesTag =
      !tagFilter || getVisitSpecialTag(room.visit) === tagFilter;
    return matchesSearch && matchesStage && matchesTag;
  });

  const isAdminRole = role === "ADMIN";

  const adminGroups = useMemo(() => {
    if (!isAdminRole) return [];
    const map = new Map<
      number,
      { visit: Room["visit"]; general?: Room; partners: Room[] }
    >();
    for (const r of rooms) {
      if (!r.visit) continue;
      if (!map.has(r.visit.id))
        map.set(r.visit.id, { visit: r.visit, partners: [] });
      const g = map.get(r.visit.id)!;
      if (r.type === "GENERAL") g.general = r;
      else g.partners.push(r);
    }
    return Array.from(map.values());
  }, [rooms, isAdminRole]);

  const availableTags = useMemo(() => {
    if (!stageFilter) return [];
    if (stageFilter === "CLOSED") {
      return [
        { name: "En permisos", color: "#f59e0b" },
        { name: "Instalado", color: "#06b6d4" },
        { name: "Finalizado", color: "#22c55e" },
      ];
    }
    if (stageFilter === "PROJECT") {
      return [
        { name: "Cierre Solicitado", color: "#10b981" },
        { name: "Proyecto devuelto", color: "#f97316" },
      ];
    }
    return [];
  }, [stageFilter]);

  const filteredAdminGroups = adminGroups.filter((g) => {
    const q = searchQuery.trim().toLowerCase();
    const address = g.visit.parcel.address.toLowerCase();
    const clientName = (g.visit.bill?.clientName || "").toLowerCase();
    const matchesSearch = !q || address.includes(q) || clientName.includes(q);
    const matchesStage = !stageFilter || g.visit.stage === stageFilter;
    const matchesTag = !tagFilter || getVisitSpecialTag(g.visit) === tagFilter;
    return matchesSearch && matchesStage && matchesTag;
  });

  const openRoom = (room?: Room) => {
    if (!room) return;
    setSelectedRoomId(room.id);
    setSelectedRoom(room);
    setSelectedVisitId(null);
  };

  const handleSelectVisit = (visitId: number) => {
    setSelectedVisitId(visitId);
    setSelectedRoom(null);
    setSelectedRoomId(null);
    setMobileColumn("conversation");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const projectDetails = selectedRoom?.visit?.projectDetails || {};
  const projects = selectedRoom?.visit?.projects || [];
  const bill = selectedRoom?.visit?.bill;
  const mergedProjectDetails: Record<string, unknown> = {
    ...projectDetails,
    _billClientName:
      bill?.clientName ||
      (projectDetails as Record<string, unknown>).clientName,
    _billClientEmail:
      bill?.clientEmail ||
      (projectDetails as Record<string, unknown>).clientEmail,
    _billPhone: bill?.phone || "",
    electricBillUrl:
      (projectDetails as Record<string, unknown>).electricBillUrl ||
      bill?.imageUrl,
    idDocumentUrl:
      (projectDetails as Record<string, unknown>).idDocumentUrl ||
      bill?.additionalFileUrl,
  };

  const calculateCompletion = (): number => {
    if (!mergedProjectDetails || Object.keys(mergedProjectDetails).length === 0)
      return 0;

    const isValid = (val: unknown) => {
      if (val === undefined || val === null) return false;
      if (typeof val === "string" && val.trim() === "") return false;
      return true;
    };

    const requiredCommonFields = COMMON_FIELDS.filter(
      (f) => !OPTIONAL_FIELDS.includes(f),
    );
    let totalFields = requiredCommonFields.length;
    let completedFields = requiredCommonFields.filter((f) =>
      isValid(mergedProjectDetails[f]),
    ).length;

    const billFields = ["_billClientName", "_billClientEmail", "_billPhone"];
    for (const field of billFields) {
      totalFields++;
      if (isValid(mergedProjectDetails[field])) {
        completedFields++;
      }
    }

    for (const field of OPTIONAL_FIELDS) {
      if (isValid(mergedProjectDetails[field])) {
        totalFields++;
        completedFields++;
      }
    }

    for (const meta of fieldMetas) {
      if (
        COMMON_FIELDS.includes(meta.fieldName) ||
        FILE_FIELD_KEYS.has(meta.fieldName)
      )
        continue;

      if (meta.isRequired === false) {
        if (isValid(mergedProjectDetails[meta.fieldName])) {
          totalFields++;
          completedFields++;
        }
      } else {
        totalFields++;
        if (isValid(mergedProjectDetails[meta.fieldName])) completedFields++;
      }
    }

    if (
      selectedRoom?.visit?.stage === "PROJECT" ||
      selectedRoom?.visit?.stage === "CLOSED"
    ) {
      totalFields += 2;
      if (isValid(mergedProjectDetails["idDocumentUrl"])) completedFields++;
      if (isValid(mergedProjectDetails["electricBillUrl"])) completedFields++;
    }

    return totalFields > 0
      ? Math.round((completedFields / totalFields) * 100)
      : 0;
  };

  const completionPercentage = calculateCompletion();

  const stageLabels: Record<string, string> = {
    IN_PROGRESS: "En Progreso",
    PROPOSAL_ACCEPTED: "Propuesta Aceptada",
    PROJECT: "En Proyecto",
    CLOSED: "Cerrado",
    CANCELLED: "Cancelado",
  };

  return (
    <div className="space-y-4 h-[calc(100dvh-180px)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            {isAdmin ? t.chat.adminTitle : t.chat.title}
          </h1>
          <p className="text-on-surface-variant">
            {isAdmin
              ? "Monitorea las conversaciones de proyectos aprobados"
              : "Comunicación interna de proyectos"}
          </p>
        </div>
        {/* Mobile nav buttons */}
        <div className="flex gap-2 lg:hidden">
          <button
            onClick={() => setMobileColumn("list")}
            className={`p-2 rounded-lg ${mobileColumn === "list" ? "bg-primary/10 text-primary" : "text-on-surface-variant"}`}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileColumn("conversation")}
            className={`p-2 rounded-lg ${mobileColumn === "conversation" ? "bg-primary/10 text-primary" : "text-on-surface-variant"}`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          {selectedRoom && role !== "SETTER" && role !== "SETTER_JR" && (
            <button
              onClick={() => {
                setShowInfoPanel(!showInfoPanel);
                setMobileColumn("info");
              }}
              className={`p-2 rounded-lg ${mobileColumn === "info" && showInfoPanel ? "bg-primary/10 text-primary" : "text-on-surface-variant"}`}
            >
              <Info className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant">
          <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
          <p>{t.chat.noChats}</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden flex h-full">
          {/* LEFT COLUMN: Chat list */}
          {!hideRoomList && (
            <div
              className={`w-full lg:w-72 border-r border-outline-variant/30 flex-shrink-0 min-h-0
            ${mobileColumn !== "list" ? "hidden lg:flex lg:flex-col" : "flex flex-col"}
          `}
            >
              {/* Search input */}
              <div className="p-3 border-b border-outline-variant/20 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input
                    type="text"
                    placeholder={
                      isAdminRole
                        ? t.common.search + "..."
                        : t.common.search + "..."
                    }
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-sm text-on-surface"
                  />
                </div>
                {role !== "PARTNER" && (
                  <div className="flex gap-2 mt-2">
                    <select
                      value={stageFilter}
                      onChange={(e) => {
                        setStageFilter(e.target.value);
                        setTagFilter("");
                      }}
                      className="h-9 px-2 rounded-lg bg-surface-container-low border border-outline-variant text-xs text-on-surface flex-1 min-w-0"
                    >
                      <option value="">Todas las etapas</option>
                      <option value="PROJECT">En Proyecto</option>
                      <option value="CLOSED">Proyecto finalizado</option>
                    </select>
                    <select
                      value={tagFilter}
                      onChange={(e) => setTagFilter(e.target.value)}
                      className="h-9 px-2 rounded-lg bg-surface-container-low border border-outline-variant text-xs text-on-surface flex-1 min-w-0"
                      disabled={!stageFilter}
                    >
                      <option value="">Todas las etiquetas</option>
                      {availableTags.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    {(stageFilter || tagFilter) && (
                      <button
                        onClick={() => {
                          setStageFilter("");
                          setTagFilter("");
                        }}
                        className="px-2 rounded-lg text-on-surface-variant hover:text-primary flex-shrink-0"
                        title="Limpiar filtros"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                {isAdminRole
                  ? (
                      <>
                        {filteredRooms.filter(r => !r.visit).map((room) => (
                          <button
                            key={room.id}
                            onClick={() => { setSelectedVisitId(null); handleSelectRoom(room); }}
                            className={`w-full text-left p-4 border-b border-outline-variant/20 last:border-0 transition-colors ${
                              selectedRoomId === room.id
                                ? "bg-primary/10 text-on-surface"
                                : room.messages &&
                                    room.messages.length > 0 &&
                                    !room.messages[0].isRead &&
                                    room.messages[0].userId !==
                                      parseInt(session?.user?.id || "0")
                                  ? "bg-primary text-on-primary"
                                  : "hover:bg-surface-container-low text-on-surface"
                            } ${room.type === "ANNOUNCEMENTS" ? "bg-orange-50 dark:bg-orange-950/20 border border-orange-400" : ""}`}
                          >
                            <div className="flex justify-between items-start mb-1 gap-2">
                              <p className="font-semibold text-sm truncate">
                                {room.type === "ANNOUNCEMENTS" ? (
                                  <span className="flex items-center gap-1 text-orange-600 font-bold">📢 Chat Informativo • {room.personalUser?.name || "Usuario"}</span>
                                ) : (
                                  <span className="flex items-center gap-1"><User className="w-4 h-4 text-blue-500" /> {room.personalUser?.name || "Privado"}</span>
                                )}
                              </p>
                            </div>
                            <p className="text-xs text-blue-400 font-semibold mt-1">
                                {room.type === "PERSONAL" ? `{room.type === "PERSONAL" ? "Chat Personal • " : ""}{room.personalUser?.role || "Usuario"}` : room.personalUser?.role || "Usuario"}
                            </p>
                          </button>
                        ))}
                        {filteredAdminGroups.map((g) => {
                      const partnerNames = g.partners.map((pr) => {
                        const pp = pr.visit.projects?.find(
                          (p: any) => p.partner?.id === pr.partnerId,
                        );
                        return pp?.partner?.name || "Partner";
                      });
                      const uniqPartnerNames = Array.from(
                        new Set(partnerNames),
                      );
                      return (
                        <button
                          key={g.visit.id}
                          onClick={() => handleSelectVisit(g.visit.id)}
                          className={`w-full text-left p-4 border-b border-outline-variant/20 last:border-0 transition-colors ${
                            selectedVisitId === g.visit.id
                              ? "bg-primary/10 text-on-surface"
                              : "hover:bg-surface-container-low text-on-surface"
                          }`}
                        >
                          <p className="font-semibold text-sm truncate">
                            {g.visit.bill?.clientName ||
                              g.visit.projectDetails?.clientName ||
                              g.visit.parcel.ownerName ||
                              t.common.none}
                          </p>
                          <p
                            className="text-xs opacity-80 mt-1 truncate flex items-center gap-1.5"
                            title={t.chat.address}
                          >
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{g.visit.parcel.address}</span>
                          </p>
                          <p
                            className="text-xs opacity-80 mt-1 truncate flex items-center gap-1.5"
                            title="Iniciado por"
                          >
                            <User className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>
                              Iniciado por{" "}
                              {g.visit.setter?.name || "Desconocido"}
                              {g.visit.closer
                                ? ` • ${g.visit.closer.name}`
                                : ""}
                            </span>
                          </p>
                          <p
                            className="text-xs mt-1 truncate flex items-center gap-1.5"
                            title="Partner"
                          >
                            <span className="text-amber-500 font-medium">
                              🤝
                            </span>
                            <span
                              className={
                                uniqPartnerNames.length > 0
                                  ? "text-amber-600"
                                  : "text-on-surface-variant"
                              }
                            >
                              {uniqPartnerNames.length > 0
                                ? uniqPartnerNames.join(", ")
                                : "En espera del partner"}
                            </span>
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            {getStageBadge(g.visit.stage)}
                          </div>
                          </button>
                        );
                      })}
                      </>
                    )
                  : filteredRooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => handleSelectRoom(room)}
                        className={`w-full text-left p-4 border-b border-outline-variant/20 last:border-0 transition-colors ${
                          selectedRoomId === room.id
                            ? "bg-primary/10 text-on-surface"
                            : room.messages &&
                                room.messages.length > 0 &&
                                !room.messages[0].isRead &&
                                room.messages[0].userId !==
                                  parseInt(session?.user?.id || "0")
                              ? "bg-primary text-on-primary"
                              : "hover:bg-surface-container-low text-on-surface"
                        } ${room.type === "ANNOUNCEMENTS" ? "bg-orange-50 dark:bg-orange-950/20 border border-orange-400" : ""}`}
                      >
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <p className="font-semibold text-sm truncate">
                            {room.type === "ANNOUNCEMENTS" ? (
                              <span className="flex items-center gap-1 text-orange-600 font-bold">📢 Chat Informativo • {room.personalUser?.name || "Usuario"}</span>
                            ) : room.type === "PERSONAL" ? (
                              <span className="flex items-center gap-1"><User className="w-4 h-4 text-blue-500" /> {room.personalUser?.name || "Privado"}</span>
                            ) : (
                              <>
                                {room.type === "PARTNER" ? "🤝 " : ""}
                                {room.visit?.bill?.clientName ||
                                  room.visit?.projectDetails?.clientName ||
                                  room.visit?.parcel?.ownerName ||
                                  t.common.none}
                              </>
                            )}
                          </p>
                          <span className="text-[10px] opacity-70 whitespace-nowrap flex-shrink-0 mt-0.5">
                            {room.messages && room.messages.length > 0
                              ? new Date(
                                  room.messages[0].createdAt,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : room.visit?.createdAt
                                ? new Date(
                                    room.visit?.createdAt,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : room.createdAt
                                ? new Date(
                                    room.createdAt,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                          </span>
                        </div>
                        
                        {room.type !== "PERSONAL" && room.type !== "ANNOUNCEMENTS" && (
                          <p
                            className="text-xs opacity-80 mt-1 truncate flex items-center gap-1.5"
                            title={t.chat.address}
                          >
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{room.visit?.parcel?.address || "Sin dirección"}</span>
                          </p>
                        )}
                        
                        {room.type !== "PERSONAL" && room.type !== "ANNOUNCEMENTS" ? (
                          <p
                            className="text-xs opacity-80 mt-1 truncate flex items-center gap-1.5"
                            title="Status"
                          >
                            <Activity className="w-3.5 h-3.5 flex-shrink-0" />
                            {getStageBadge(room.visit?.stage)}
                          </p>
                        ) : (
                          <p className="text-xs text-blue-400 font-semibold mt-1">
                            {room.type === "PERSONAL" ? "Chat Personal • " : ""}{room.personalUser?.role || "Usuario"}
                          </p>
                        )}
                        {room.visit?.stage === "CLOSED" &&
                          (() => {
                            try {
                              const cf = room.visit.contractFields
                                ? JSON.parse(room.visit.contractFields)
                                : {};
                              const tag = cf.postCloseTags;
                              if (tag && typeof tag === "string") {
                                const tagColor =
                                  tag === "En permisos"
                                    ? "#f59e0b"
                                    : tag === "Permisos aprobados"
                                      ? "#3b82f6"
                                      : tag === "Instalado"
                                        ? "#06b6d4"
                                        : tag === "PTO"
                                          ? "#a855f7"
                                          : tag === "Finalizado"
                                            ? "#22c55e"
                                            : "#6b7280";
                                return (
                                  <p
                                    className="text-[10px] font-semibold mt-1 px-1.5 py-0.5 rounded-full inline-flex w-fit items-center gap-1"
                                    style={{
                                      backgroundColor: tagColor + "15",
                                      color: tagColor,
                                      border: `1px solid ${tagColor}30`,
                                    }}
                                  >
                                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                                    <span>{tag}</span>
                                  </p>
                                );
                              }
                            } catch {}
                            return null;
                          })()}
                        <p
                          className="text-xs opacity-80 mt-1 truncate flex items-center gap-1.5"
                          title="Fecha"
                        >
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>
                            {room.visit?.createdAt
                              ? new Date(
                                  room.visit?.createdAt,
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </p>
                        <p
                          className="text-xs opacity-80 mt-1 truncate flex items-center gap-1.5"
                          title="Registrado por"
                        >
                          <User className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>
                            {room.visit?.setter?.name || "Desconocido"}
                          </span>
                        </p>
                      </button>
                    ))}
                {isAdminRole
                  ? filteredAdminGroups.length === 0 && filteredRooms.filter(r => !r.visit).length === 0 && (
                      <div className="p-4 text-center text-sm text-on-surface-variant">
                        Sin resultados
                      </div>
                    )
                  : filteredRooms.length === 0 && (
                      <div className="p-4 text-center text-sm text-on-surface-variant">
                        Sin resultados
                      </div>
                    )}
              </div>
            </div>
          )}

          {/* CENTER COLUMN: Conversation */}
          <div
            className={`flex-1 flex flex-col min-h-0
            ${mobileColumn !== "conversation" ? "hidden lg:flex" : "flex"}
          `}
          >
            {isAdminRole && selectedVisitId && !selectedRoom ? (
              <AdminRoomSelector
                group={adminGroups.find((g) => g.visit.id === selectedVisitId)}
                onOpenRoom={openRoom}
              />
            ) : selectedRoom ? (
              <>
                <div className="p-4 border-b border-outline-variant/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setMobileColumn("list");
                          }}
                          className="lg:hidden p-1 -ml-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0 mt-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <p className="font-headline font-bold text-lg text-primary truncate">
                              {selectedRoom?.type === "ANNOUNCEMENTS" ? (
                                  <span className="flex items-center gap-1.5 text-orange-600 font-bold"><MessageSquare className="w-5 h-5" /> Chat Informativo • {selectedRoom.personalUser?.name || "Usuario"}</span>
                                ) : selectedRoom?.type === "PERSONAL" ? (
                                  <span className="flex items-center gap-1.5"><User className="w-5 h-5 text-blue-500" /> {selectedRoom.personalUser?.name || "Chat Privado"}</span>
                                ) : (
                                <>
                                  {selectedRoom?.visit?.bill?.clientName ||
                                    selectedRoom?.visit?.projectDetails?.clientName ||
                                    selectedRoom?.visit?.parcel?.ownerName ||
                                    t.common.none}
                                </>
                              )}
                            </p>
                            {selectedRoom?.type !== "PERSONAL" && selectedRoom?.type !== "ANNOUNCEMENTS" && (
                              <span className="px-2 py-0.5 bg-brand-orange/10 text-brand-orange rounded-full text-[10px] font-bold">
                                {selectedRoom?.visit?.parcel?.address || "Sin dirección"}
                              </span>
                            )}
                          </div>
                          
                          {selectedRoom?.type !== "PERSONAL" ? (
                            <div className="flex flex-col gap-0.5">
                              {selectedRoom?.type === "PARTNER" &&
                                (() => {
                                  const covered = selectedRoom?.visit?.projects
                                    ?.filter(
                                      (p: any) => p.partner?.id === selectedRoom?.partnerId,
                                    )
                                    .map((p: any) => p.projectType.name)
                                    .join(", ");
                                  return covered ? (
                                    <p className="text-xs text-on-surface-variant font-medium">
                                      Proyecto: {covered}
                                    </p>
                                  ) : null;
                                })()}
                              <p className="text-xs text-on-surface-variant flex items-center gap-1">
                                {selectedRoom?.visit?.setter && (
                                  <>
                                    Setter:{" "}
                                    <Link
                                      href={`/profile/${selectedRoom?.visit?.setter.id}`}
                                      className="hover:underline"
                                    >
                                      {selectedRoom?.visit?.setter.name}
                                    </Link>
                                  </>
                                )}
                                {selectedRoom?.visit?.closer && (
                                  <>
                                    {" • Closer: "}
                                    <Link
                                      href={`/profile/${selectedRoom?.visit?.closer.id}`}
                                      className="hover:underline"
                                    >
                                      {selectedRoom?.visit?.closer.name}
                                    </Link>
                                  </>
                                )}
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <p className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                                {selectedRoom.personalUser?.role || "Usuario"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-shrink-0">
                      {/* Info toggle for md */}
                        {role !== "SETTER" && role !== "SETTER_JR" && (
                      <button
                        onClick={() => setShowInfoPanel(!showInfoPanel)}
                        className="hidden md:flex lg:hidden px-3 py-1 text-xs font-medium rounded-full transition-colors bg-primary/10 text-primary hover:bg-primary/20 items-center gap-1"
                      >
                        <Info className="w-3 h-3" />
                        Info
                      </button>
                      )}
                      {role !== "PARTNER" && selectedRoom?.type !== "ANNOUNCEMENTS" && (
                        <button
                          onClick={() => setShowContractModal(true)}
                          className="px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1"
                          style={{
                            backgroundColor: "#f4822120",
                            color: "#f48221",
                          }}
                        >
                          <FileText className="w-3 h-3" />
                          Contratos
                        </button>
                      )}
                      {(session?.user?.role === "ADMIN" ||
                        session?.user?.role === "CLOSER") && selectedRoom?.type !== "ANNOUNCEMENTS" && (
                        <>
                          <Link
                            href={`/lead/${selectedRoom?.visit?.id}?tab=archivos`}
                            className="px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1 hover:bg-[#f4822130]"
                            style={{
                              backgroundColor: "#f4822120",
                              color: "#f48221",
                            }}
                          >
                            <Folder className="w-3 h-3" />
                            Archivos
                          </Link>
                          <Link
                            href={`/lead/${selectedRoom?.visit?.id}?tab=datos`}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                              session?.user?.role === "ADMIN"
                                ? "hover:bg-emerald-100"
                                : "hover:bg-[#f4822130]"
                            }`}
                            style={{
                              backgroundColor:
                                session?.user?.role === "ADMIN"
                                  ? "#10b98120"
                                  : "#f4822120",
                              color:
                                session?.user?.role === "ADMIN"
                                  ? "#10b981"
                                  : "#f48221",
                            }}
                          >
                            {session?.user?.role === "ADMIN" ? (
                              <FileText className="w-3 h-3" />
                            ) : (
                              <Pencil className="w-3 h-3" />
                            )}
                            {session?.user?.role === "ADMIN"
                              ? "Datos"
                              : t.chat.editProject}
                          </Link>
                        </>
                      )}
                      {(session?.user?.role === "ADMIN" ||
                        session?.user?.role === "CLOSER") &&
                        selectedRoom?.visit?.stage === "CLOSED" &&
                        !selectedRoom?.visit?.finalizedAt && (
                          <button
                            onClick={handleFinalize}
                            className="px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors"
                          >
                            <CheckCheck className="w-3 h-3" />
                          </button>
                        )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center">
                    {selectedRoom?.type === "PARTNER" ? (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold tracking-wider"
                        style={{
                          backgroundColor: "#f4822120",
                          color: "#f48221",
                          border: "1px solid #f4822140",
                        }}
                      >
                        CHAT PARTNER '
                        {selectedRoom?.visit?.projects?.find(
                          (p: any) => p.partner?.id === selectedRoom.partnerId,
                        )?.partner?.name || "Desconocido"}
                        '
                      </span>
                    ) : (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold tracking-wider"
                        style={{
                          backgroundColor: "#22c55e20",
                          color: "#22c55e",
                          border: "1px solid #22c55e40",
                        }}
                      >
                        CHAT INTERNO
                      </span>
                    )}
                  </div>

                  {projectDetails && selectedRoom?.type !== "ANNOUNCEMENTS" && (
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-on-surface-variant">
                          {t.chat.projectProgress}
                        </span>
                        <span className="text-xs font-semibold text-on-surface">
                          {completionPercentage}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            completionPercentage === 100
                              ? "bg-primary"
                              : completionPercentage >= 50
                                ? "bg-secondary"
                                : "bg-tertiary"
                          }`}
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => {
                    const isMe =
                      msg.user.id === parseInt(session?.user?.id || "0");
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl flex flex-col ${
                            isMe
                              ? "bg-primary text-on-primary rounded-br-sm"
                              : "bg-surface-container-high text-on-surface rounded-bl-sm"
                          }`}
                        >
                          {!isMe && (
                            <p className="text-xs opacity-70 mb-1 font-semibold">
                              {session?.user?.role === "PARTNER"
                                ? "OneSolutions"
                                : msg.user.name}
                            </p>
                          )}
                          <div className="flex items-end justify-between gap-3">
                            <div className="text-sm break-words whitespace-pre-wrap">
                              {renderMessageWithMentions(msg.body)}
                              {msg.fileUrl && (
                                <a
                                  href={msg.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs underline mt-1 block"
                                >
                                  {msg.fileName || t.chat.viewFile}
                                </a>
                              )}
                            </div>
                            <span className="text-[10px] opacity-60 whitespace-nowrap mb-[-2px] text-right">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={handleSend}
                  className="p-4 border-t border-outline-variant/30 flex gap-2 relative"
                >
                  <button type="button" onClick={openTemplatesModal} className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors cursor-pointer flex-shrink-0" title="Enviar Plantilla"><FileText className="w-5 h-5" /></button>
                    <label className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors cursor-pointer flex-shrink-0">
                    <Paperclip className="w-5 h-5" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <div className="flex-1 relative">
                    <Input
                      value={newMessage}
                      onChange={handleMessageChange}
                      placeholder={
                        (selectedRoom as any)?.type === "PARTNER" ||
                        role === "PARTNER"
                          ? t.chat.writeMessage
                          : `${t.chat.writeMessage} usa @ para mencionar`
                      }
                      className="w-full"
                    />
                    {showMentionDropdown &&
                      (selectedRoom as any)?.type !== "PARTNER" &&
                      role !== "PARTNER" &&
                      filteredMentionUsers.length > 0 && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                          {filteredMentionUsers.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleMentionSelect(user)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <span className="font-medium">{user.name}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {user.role}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="w-11 h-11 p-0 flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-on-surface-variant">
                <p>{t.chat.selectChat}</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Info Panel */}
          {selectedRoom && (selectedRoom.type === "PERSONAL" || selectedRoom.type === "ANNOUNCEMENTS") ? (
                <div
                  className={`w-full lg:w-80 border-l border-outline-variant/30 bg-surface-container-low/30 flex-shrink-0 min-h-0 flex flex-col
                  ${role === "SETTER" || role === "SETTER_JR" ? "hidden" : (!showInfoPanel && mobileColumn !== "info" ? "hidden lg:flex" : "flex")}
                  ${mobileColumn === "info" ? "absolute inset-0 z-10 bg-surface/95 backdrop-blur-md" : ""}`}
                >
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                      {selectedRoom.personalUser?.profile?.profilePhoto ? (
                        <img src={selectedRoom.personalUser.profile.profilePhoto} alt={selectedRoom.personalUser?.name || ""} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-blue-500" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold">{selectedRoom.personalUser?.name}</h3>
                    <p className="text-sm text-on-surface-variant mb-6">{selectedRoom.personalUser?.role}</p>

                    <div className="w-full space-y-4 text-left mt-4 border-t border-outline-variant/20 pt-4">
                      <div>
                            <p className="text-xs text-on-surface-variant mb-1 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Correo</p>
                            <p className="text-sm">{selectedRoom.personalUser?.email || "No registrado"}</p>
                          </div>
                      <div>
                            <p className="text-xs text-on-surface-variant mb-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Teléfono</p>
                            <p className="text-sm">{selectedRoom.personalUser?.phone || "No registrado"}</p>
                          </div>
                      <div>
                            <p className="text-xs text-on-surface-variant mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Vivienda</p>
                            <p className="text-sm">{selectedRoom.personalUser?.profile?.address || "No registrada"}</p>
                          </div>
                    </div>
                    
                    
                    
                    {mobileColumn === "info" && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setMobileColumn("conversation");
                          setShowInfoPanel(false);
                        }}
                        className="mt-6 lg:hidden w-full"
                      >
                        Cerrar
                      </Button>
                    )}
                  </div>
                </div>
          ) : selectedRoom && (
            <div
              className={`w-full lg:w-80 border-l border-outline-variant/30 bg-surface-container-low/30 flex-shrink-0 min-h-0 flex flex-col
              ${role === "SETTER" || role === "SETTER_JR" ? "hidden" : (!showInfoPanel && mobileColumn !== "info" ? "hidden lg:flex" : "flex")}
            `}
            >
              <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between flex-shrink-0">
                <h3 className="font-semibold text-on-surface text-sm">
                  {t.chat.projectInfo}
                </h3>
                <button
                  onClick={() => {
                    setShowInfoPanel(false);
                    setMobileColumn("conversation");
                  }}
                  className="lg:hidden p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                <InfoPanelContent
                  room={selectedRoom}
                  projects={projects}
                  bill={bill}
                  stageLabels={stageLabels}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Edición de ProjectDetails */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t.chat.editProjectInfo}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t.chat.clientName}
              value={editForm.clientName || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, clientName: e.target.value })
              }
            />
            <Input
              label={t.chat.clientEmail}
              type="email"
              value={editForm.clientEmail || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, clientEmail: e.target.value })
              }
            />
          </div>

          <Input
            label={t.chat.address}
            value={editForm.address || ""}
            onChange={(e) =>
              setEditForm({ ...editForm, address: e.target.value })
            }
          />

          <Input
            label="Teléfono del Cliente"
            type="tel"
            value={(editForm.phone as string) || bill?.phone || ""}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                phone: formatPhoneNumber(e.target.value),
              })
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t.chat.closingDate}
              type="date"
              value={
                editForm.closingDate
                  ? new Date(editForm.closingDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  closingDate: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : undefined,
                })
              }
            />
          </div>

          {projects.some((p: any) => p.projectType.name === "Panel Solar") && (
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
              <p className="text-sm font-semibold text-on-surface">
                {t.chat.solarPanel}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t.chat.financier}
                  value={editForm.solarFinancier || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, solarFinancier: e.target.value })
                  }
                />
                <Input
                  label={t.chat.systemSize}
                  value={editForm.systemSize || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, systemSize: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
            <p className="text-sm font-semibold text-on-surface">
              {t.chat.commissions}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Representante Principal"
                value={editForm.primaryRep || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, primaryRep: e.target.value })
                }
              />
              <Input
                label="Comisión %"
                type="number"
                value={editForm.primaryRepCommPct?.toString() || ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    primaryRepCommPct: parseFloat(e.target.value) || undefined,
                  })
                }
              />
            </div>
          </div>

          {commonFields.length > 0 &&
            (() => {
              const alreadyShown = new Set([
                "clientName",
                "clientEmail",
                "address",
                "phone",
                "closingDate",
                "primaryRep",
                "primaryRepCommPct",
              ]);
              const filtered = commonFields.filter(
                (f) => !alreadyShown.has(f.fieldName),
              );
              if (filtered.length === 0) return null;
              return (
                <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                  <p className="text-sm font-semibold text-on-surface">
                    Campos Comunes
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {filtered.map((field) => (
                      <div key={field.id}>
                        {field.fieldType === "select" ? (
                          <div>
                            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                              {field.fieldLabel}
                            </label>
                            <select
                              value={
                                (editForm[field.fieldName] as string) || ""
                              }
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  [field.fieldName]: e.target.value,
                                })
                              }
                              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface mt-1"
                            >
                              <option value="">{t.common.selectOption}</option>
                              {field.options &&
                                JSON.parse(field.options).map((opt: string) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                            </select>
                          </div>
                        ) : field.fieldType === "date" ? (
                          <Input
                            label={field.fieldLabel}
                            type="date"
                            value={
                              editForm[field.fieldName]
                                ? new Date(editForm[field.fieldName] as string)
                                    .toISOString()
                                    .split("T")[0]
                                : ""
                            }
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                [field.fieldName]: e.target.value,
                              })
                            }
                          />
                        ) : field.fieldType === "number" ? (
                          <Input
                            label={field.fieldLabel}
                            type="number"
                            value={(editForm[field.fieldName] as string) || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                [field.fieldName]:
                                  parseFloat(e.target.value) || undefined,
                              })
                            }
                          />
                        ) : (
                          <Input
                            label={field.fieldLabel}
                            value={(editForm[field.fieldName] as string) || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                [field.fieldName]: e.target.value,
                              })
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowEditModal(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveProjectDetails}
              isLoading={saving}
            >
              {t.chat.saveChanges}
            </Button>
          </div>
        </div>
      </Modal>

      {selectedRoom && (
        

        <Modal isOpen={showTemplatesModal} onClose={() => setShowTemplatesModal(false)} title="Plantillas Disponibles">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto p-4">
            {loadingTemplates ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : templates.length === 0 ? (
              <div className="text-center p-8 text-on-surface-variant">No hay plantillas disponibles</div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {templates.map(tmpl => (
                  <div key={tmpl.id} className="p-4 border border-outline-variant/30 rounded-xl hover:border-primary/50 transition-colors cursor-pointer flex justify-between items-center bg-surface-container-low" onClick={() => handleSendTemplate(tmpl)}>
                    <div>
                      <h4 className="font-bold text-on-surface">{tmpl.title}</h4>
                    </div>
                    <Send className="w-4 h-4 text-primary" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function InfoPanelContent({
  room,
  projects,
  bill,
  stageLabels,
}: {
  room: Room;
  projects: { projectType: ProjectType }[];
  bill?: {
    imageUrl: string;
    phone: string;
    clientName: string;
    clientEmail: string;
    additionalFileUrl?: string;
    additionalFileName?: string;
  };
  stageLabels: Record<string, string>;
}) {
  const { data: session } = useSession();
  const { t } = useLocale();
  const isPartner = session?.user?.role === "PARTNER";
  const { visit } = room;
  const [projectDetails, setProjectDetails] = useState<any>(
    visit?.projectDetails || {},
  );
  useEffect(() => {
    if (!visit?.id) return;
    // Initial fetch
    fetch(`/api/project-details?visitId=${visit.id}&t=${Date.now()}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) setProjectDetails(data);
      })
      .catch(() => {});

    // Polling every 2 seconds to adapt instantly
    const interval = setInterval(() => {
      fetch(`/api/project-details?visitId=${visit.id}&t=${Date.now()}`, {
        cache: "no-store",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) setProjectDetails(data);
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, [visit?.id]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-outline-variant/30 flex-shrink-0">
        <h3 className="font-headline text-lg font-bold text-on-surface">
          {t.chat.projectInfo}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        <div className="flex flex-col space-y-3 text-xs">
          {visit.stage && (
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                  visit.stage === "CLOSED"
                    ? "bg-primary/10 text-primary"
                    : visit.stage === "CANCELLED"
                      ? "bg-error/10 text-error"
                      : "bg-secondary/10 text-secondary"
                }`}
              >
                {stageLabels[visit.stage] || visit.stage}
              </span>
              {visit.stage === "CLOSED" &&
                (() => {
                  try {
                    const cf = visit.contractFields
                      ? JSON.parse(visit.contractFields)
                      : {};
                    const tag = cf.postCloseTags;
                    if (tag && typeof tag === "string") {
                      const tagColor =
                        tag === "En permisos"
                          ? "#f59e0b"
                          : tag === "Permisos aprobados"
                            ? "#3b82f6"
                            : tag === "Instalado"
                              ? "#06b6d4"
                              : tag === "PTO"
                                ? "#a855f7"
                                : tag === "Finalizado"
                                  ? "#22c55e"
                                  : "#6b7280";
                      return (
                        <span
                          className="px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"
                          style={{
                            backgroundColor: tagColor + "15",
                            color: tagColor,
                            border: `1px solid ${tagColor}30`,
                          }}
                        >
                          <CheckCircle className="w-3 h-3 flex-shrink-0" />
                          {tag}
                        </span>
                      );
                    }
                  } catch {}
                  return null;
                })()}
            </div>
          )}

          {!isPartner &&
            parseParcelTags(visit.parcel.parcelTags).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {parseParcelTags(visit.parcel.parcelTags).map((tag, i) => (
                  <span
                    key={`${tag.name}-${i}`}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium border"
                    style={{
                      backgroundColor: `${tag.color || "#3b82f6"}1a`,
                      color: tag.color || "#3b82f6",
                      borderColor: `${tag.color || "#3b82f6"}40`,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

          <div className="flex justify-between items-start gap-4">
            <span className="text-on-surface-variant font-medium flex-shrink-0">
              {t.chat.projects}:
            </span>
            <span className="text-on-surface text-right break-words">
              {projects.length > 0
                ? projects.map((p: any) => p.projectType.name).join(", ")
                : t.common.none}
            </span>
          </div>

          <div className="flex justify-between items-start gap-4">
            <span className="text-on-surface-variant font-medium flex-shrink-0">
              {t.chat.client}:
            </span>
            <span className="text-on-surface text-right break-words">
              {bill?.clientName ||
                projectDetails?.clientName ||
                visit.parcel.ownerName ||
                t.common.none}
            </span>
          </div>

          {!isPartner && (
            <div className="flex justify-between items-start gap-4">
              <span className="text-on-surface-variant font-medium flex-shrink-0">
                Teléfono:
              </span>
              <span className="text-on-surface text-right break-words">
                {bill?.phone || projectDetails?.phone || "N/A"}
              </span>
            </div>
          )}

          {!isPartner && (
            <div className="flex justify-between items-start gap-4">
              <span className="text-on-surface-variant font-medium flex-shrink-0">
                {t.chat.email}:
              </span>
              <span className="text-on-surface text-right break-words">
                {bill?.clientEmail || projectDetails?.clientEmail || "N/A"}
              </span>
            </div>
          )}

          <div className="flex justify-between items-start gap-4">
            <span className="text-on-surface-variant font-medium flex-shrink-0">
              {t.chat.address}:
            </span>
            <span className="text-on-surface text-right break-words">
              {visit.parcel.address}
            </span>
          </div>

          <div className="flex justify-between items-start gap-4">
            <span className="text-on-surface-variant font-medium flex-shrink-0">
              {t.chat.closingDate}:
            </span>
            <span className="text-on-surface text-right break-words">
              {projectDetails?.closingDate
                ? new Date(
                    String(projectDetails.closingDate),
                  ).toLocaleDateString()
                : "En proceso"}
            </span>
          </div>

          <div className="flex justify-between items-start gap-4">
            <span className="text-on-surface-variant font-medium flex-shrink-0">
              Creación del lead:
            </span>
            <span className="text-on-surface text-right break-words">
              {visit.createdAt
                ? new Date(visit.createdAt).toLocaleDateString()
                : "N/A"}
            </span>
          </div>

          <div className="flex justify-between items-start gap-4">
            <span className="text-on-surface-variant font-medium flex-shrink-0">
              Rep. principal:
            </span>
            <span className="text-on-surface text-right break-words">
              {projectDetails?.primaryRep || "N/A"}
            </span>
          </div>

          {!isPartner && (
            <div className="flex justify-between items-start gap-4">
              <span className="text-on-surface-variant font-medium flex-shrink-0">
                {t.chat.commissions} (%):
              </span>
              <span className="text-on-surface text-right break-words">
                {projectDetails?.primaryRepCommPct != null
                  ? `${projectDetails.primaryRepCommPct}%`
                  : "N/A"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminRoomSelector({
  group,
  onOpenRoom,
}: {
  group?: { visit: Room["visit"]; general?: Room; partners: Room[] };
  onOpenRoom: (room?: Room) => void;
}) {
  const { t } = useLocale();
  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center text-on-surface-variant">
        <p>{t.chat.selectChat}</p>
      </div>
    );
  }

  const clientName =
    group.visit.bill?.clientName ||
    group.visit.projectDetails?.clientName ||
    group.visit.parcel.ownerName ||
    t.common.none;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
      <div className="text-center">
        <p className="font-semibold text-lg text-on-surface">{clientName}</p>
        <p className="text-sm text-on-surface-variant">
          {group.visit.parcel.address}
        </p>
      </div>

      <button
        onClick={() => onOpenRoom(group.general)}
        disabled={!group.general}
        className="w-full max-w-sm p-4 rounded-xl border border-green-500/40 bg-green-500/10 text-left hover:bg-green-500/20 transition-colors flex items-center gap-3 disabled:opacity-50"
      >
        <MessageSquare className="w-6 h-6 text-green-600" />
        <div>
          <p className="font-semibold text-green-700">Interno</p>
          <p className="text-xs text-on-surface-variant">
            Chat con setter/closer/trainee
          </p>
        </div>
      </button>

      {group.partners.map((pr) => {
        const pp = pr.visit.projects?.find(
          (p: any) => p.partner?.id === pr.partnerId,
        );
        const partnerName = pp?.partner?.name || "Partner";
        const coveredContracts = pr.visit.projects
          ?.filter((p: any) => p.partner?.id === pr.partnerId)
          .map((p: any) => p.projectType.name)
          .join(", ");
        return (
          <button
            key={pr.id}
            onClick={() => onOpenRoom(pr)}
            className="w-full max-w-sm p-4 rounded-xl border border-orange-500/40 bg-orange-500/10 text-left hover:bg-orange-500/20 transition-colors flex items-center gap-3"
          >
            <MessageSquare className="w-6 h-6 text-orange-600" />
            <div>
              <p className="font-semibold text-orange-700">🤝 {partnerName}</p>
              <p className="text-xs text-on-surface-variant">
                {coveredContracts ? `Cubre: ${coveredContracts}` : "Partner"}
              </p>
            </div>
          </button>
        );
      })}

      {group.partners.length === 0 && (
        <p className="text-sm text-on-surface-variant">En espera del partner</p>
      )}
    </div>
  );
}






















