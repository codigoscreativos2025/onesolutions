"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Send, Paperclip, Loader2, MessageSquare, Package, FileText, Pencil, CheckCheck, Search, ArrowLeft, Info, List, X, MapPin, User, PlusCircle, Phone, Folder, Calendar, Activity } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ContractModal } from "@/components/quote/ContractModal";

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
  visit: {
    id: number;
    setterId: number;
    closerId?: number;
    stage?: string;
    createdAt?: string;
    finalizedAt?: string;
    parcel: { id: string; address: string; ownerName?: string };
    setter: { id: number; name: string };
    closer?: { id: number; name: string };
    bill?: { imageUrl: string; phone: string; clientName: string; clientEmail: string; additionalFileUrl?: string; additionalFileName?: string };
    projectDetails?: ProjectDetails;
    projects?: { projectType: ProjectType }[];
    objections?: ObjectionEntry[];
    closerObjections?: ObjectionEntry[];
    commissions?: { id: number; percentage: number; role: string; user: { id: number; name: string } }[];
    notes?: string;
    cancelledAt?: string;
    cancellationReason?: string;
    completedAt?: string;
    scheduledAt?: string;
  };
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

export function ChatInterface({ isAdmin = false, initialRoomId = null, hideRoomList = false }: { isAdmin?: boolean; initialRoomId?: number | null; hideRoomList?: boolean }) {
  const { data: session } = useSession();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(initialRoomId);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [editForm, setEditForm] = useState<ProjectDetails>({});
  const [saving, setSaving] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<{ id: number; name: string; role: string }[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [commonFields, setCommonFields] = useState<CommonField[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [mobileColumn, setMobileColumn] = useState<ColumnView>("list");
  const [fieldMetas, setFieldMetas] = useState<{ fieldName: string; isRequired?: boolean }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (initialRoomId && rooms.length > 0) {
      const room = rooms.find(r => r.id === initialRoomId);
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
    if (selectedRoom?.visit?.projects && selectedRoom.visit.projects.length > 0) {
      const fetchFieldMetas = async () => {
        const allMetas: { fieldName: string; isRequired?: boolean }[] = [];
        const uniqueIds = Array.from(new Set(selectedRoom.visit.projects!.map((p) => p.projectType.id)));
        for (const typeId of uniqueIds) {
          try {
            const res = await fetch(`/api/admin/project-type-fields?projectTypeId=${typeId}`);
            const fields = await res.json();
            if (Array.isArray(fields)) allMetas.push(...fields);
          } catch { /* */ }
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
        } catch { /* */ }

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
      setRooms(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMentionUsers = async (roomId?: number) => {
    try {
      const url = roomId ? `/api/users/mentionable?roomId=${roomId}` : "/api/users/mentionable";
      const res = await fetch(url);
      const data = await res.json();
      setMentionUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMessages = async (roomId: number) => {
    const res = await fetch(`/api/chat/rooms/${roomId}`);
    const data = await res.json();
    setMessages(data.messages);
    setSelectedRoom(data);
  };

  const handleSelectRoom = (room: Room) => {
    setSelectedRoomId(room.id);
    setSelectedRoom(room);
  };

  const fetchCommonFields = async () => {
    try {
      const typesRes = await fetch("/api/project-types");
      const types = await typesRes.json();
      const comunes = types.find((t: { id: number; name: string }) => t.name === "Campos Comunes");
      if (comunes) {
        const fieldsRes = await fetch(`/api/admin/project-type-fields?projectTypeId=${comunes.id}`);
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
    const address = pd.address || selectedRoom?.visit.parcel?.address || "";
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
          visitId: selectedRoom.visit.id,
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
      const res = await fetch(`/api/visits/${selectedRoom.visit.id}/finalize`, { method: 'PATCH' });
      if (res.ok) {
        const updated = await res.json();
        if (selectedRoom) {
          setSelectedRoom({ ...selectedRoom, visit: { ...selectedRoom.visit, finalizedAt: updated.finalizedAt } });
          setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, visit: { ...r.visit, finalizedAt: updated.finalizedAt } } : r));
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
    user.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const renderMessageWithMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            className="font-semibold bg-primary/20 px-1 rounded"
          >
            {part}
          </span>
        );
      }
      return part;
    });
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
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const address = room.visit.parcel.address.toLowerCase();
    const clientName = (room.visit.bill?.clientName || "").toLowerCase();
    return address.includes(q) || clientName.includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const projectDetails = selectedRoom?.visit.projectDetails || {};
  const projects = selectedRoom?.visit.projects || [];
  const bill = selectedRoom?.visit.bill;
  const mergedProjectDetails: Record<string, unknown> = {
    ...projectDetails,
    _billClientName: bill?.clientName || (projectDetails as Record<string, unknown>).clientName,
    _billClientEmail: bill?.clientEmail || (projectDetails as Record<string, unknown>).clientEmail,
    _billPhone: bill?.phone || "",
    electricBillUrl: (projectDetails as Record<string, unknown>).electricBillUrl || bill?.imageUrl,
    idDocumentUrl: (projectDetails as Record<string, unknown>).idDocumentUrl || bill?.additionalFileUrl,
  };

  const calculateCompletion = (): number => {
    if (!mergedProjectDetails || Object.keys(mergedProjectDetails).length === 0) return 0;

    const isValid = (val: unknown) => {
      if (val === undefined || val === null) return false;
      if (typeof val === 'string' && val.trim() === "") return false;
      return true;
    };

    const COMMON_FIELDS_CHAT = [
      "closingDate",
      "paymentMethod",
      "primaryRep",
      "primaryRepCommPct",
      "generalCostPrice",
      "generalSalePrice",
    ];

    const OPTIONAL_FIELDS_CHAT = ["generalCostPrice", "generalSalePrice"];

    const FILE_FIELD_KEYS_CHAT = new Set([
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

    const requiredCommonFields = COMMON_FIELDS_CHAT.filter((f) => !OPTIONAL_FIELDS_CHAT.includes(f));
    let totalFields = requiredCommonFields.length;
    let completedFields = requiredCommonFields.filter((f) => isValid(mergedProjectDetails[f])).length;

    const billFields = ['_billClientName', '_billClientEmail', '_billPhone'];
    for (const field of billFields) {
      totalFields++;
      if (isValid(mergedProjectDetails[field])) {
        completedFields++;
      }
    }

    for (const field of OPTIONAL_FIELDS_CHAT) {
      if (isValid(mergedProjectDetails[field])) {
        totalFields++;
        completedFields++;
      }
    }

    for (const meta of fieldMetas) {
      if (COMMON_FIELDS_CHAT.includes(meta.fieldName) || FILE_FIELD_KEYS_CHAT.has(meta.fieldName)) continue;

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

    if (selectedRoom?.visit?.stage === "PROJECT" || selectedRoom?.visit?.stage === "CLOSED") {
      totalFields += 2;
      if (isValid(mergedProjectDetails["idDocumentUrl"])) completedFields++;
      if (isValid(mergedProjectDetails["electricBillUrl"])) completedFields++;
    }

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
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
            {isAdmin ? "Chats Internos" : "Chat"}
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
          {selectedRoom && (
            <button
              onClick={() => { setShowInfoPanel(!showInfoPanel); setMobileColumn("info"); }}
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
          <p>No hay chats activos</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden flex h-full">
          {/* LEFT COLUMN: Chat list */}
          {!hideRoomList && (
          <div className={`w-full lg:w-72 border-r border-outline-variant/30 flex-shrink-0 min-h-0
            ${mobileColumn !== "list" ? "hidden lg:flex lg:flex-col" : "flex flex-col"}
          `}>
            {/* Search input */}
            <div className="p-3 border-b border-outline-variant/20 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Buscar chat..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-sm text-on-surface"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-0">
              {filteredRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleSelectRoom(room)}
                  className={`w-full text-left p-4 border-b border-outline-variant/20 last:border-0 transition-colors ${
                    selectedRoomId === room.id
                      ? "bg-primary/10 text-on-surface"
                      : (room.messages && room.messages.length > 0 && !room.messages[0].isRead && room.messages[0].userId !== parseInt(session?.user?.id || "0"))
                      ? "bg-primary text-on-primary"
                      : "hover:bg-surface-container-low text-on-surface"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <p className="font-semibold text-sm truncate">
                      {room.visit.bill?.clientName || room.visit.projectDetails?.clientName || room.visit.parcel.ownerName || "Sin Nombre"}
                    </p>
                    <span className="text-[10px] opacity-70 whitespace-nowrap flex-shrink-0 mt-0.5">
                      {room.messages && room.messages.length > 0
                        ? new Date(room.messages[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : (room.visit.createdAt ? new Date(room.visit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "")}
                    </span>
                  </div>
                  <p className="text-xs opacity-80 mt-1 truncate flex items-center gap-1.5" title="Dirección">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{room.visit.parcel.address}</span>
                  </p>
                  <p className="text-xs opacity-80 mt-1 truncate flex items-center gap-1.5" title="Status">
                    <Activity className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      {room.visit.stage === "POTENTIAL_LEAD" ? "Lead Potencial" :
                       room.visit.stage === "IN_PROGRESS" ? "Agendado" :
                       room.visit.stage === "PROJECT" ? "En Proyecto" :
                       room.visit.stage === "CLOSED" ? "Proyecto Cerrado" :
                       room.visit.stage === "CANCELLED" ? "Proyecto Cancelado" : room.visit.stage || "Desconocido"}
                    </span>
                  </p>
                  <p className="text-xs opacity-80 mt-1 truncate flex items-center gap-1.5" title="Fecha">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{room.visit.createdAt ? new Date(room.visit.createdAt).toLocaleDateString() : "N/A"}</span>
                  </p>
                  <p className="text-xs opacity-80 mt-1 truncate flex items-center gap-1.5" title="Registrado por">
                    <User className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{room.visit.setter?.name || "Desconocido"}</span>
                  </p>
                </button>
              ))}
              {filteredRooms.length === 0 && (
                <div className="p-4 text-center text-sm text-on-surface-variant">
                  Sin resultados
                </div>
              )}
            </div>
          </div>
          )}

          {/* CENTER COLUMN: Conversation */}
          <div className={`flex-1 flex flex-col min-h-0
            ${mobileColumn !== "conversation" ? "hidden lg:flex" : "flex"}
          `}>
            {selectedRoom ? (
              <>
                <div className="p-4 border-b border-outline-variant/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setMobileColumn("list"); }}
                          className="lg:hidden p-1 -ml-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <p className="font-semibold text-on-surface">
                          {selectedRoom.visit.bill?.clientName || selectedRoom.visit.projectDetails?.clientName || selectedRoom.visit.parcel.ownerName || "Sin Nombre"}
                        </p>
                      </div>
                      <p className="text-xs text-on-surface-variant ml-0 lg:ml-0 mt-1">
                        {selectedRoom.visit.parcel.address}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Trainee:{' '}
                        <Link href={`/profile/${selectedRoom.visit.setter.id}`} className="hover:underline">
                          {selectedRoom.visit.setter.name}
                        </Link>
                        {selectedRoom.visit.closer && (
                          <>
                            {' • Closer: '}
                            <Link href={`/profile/${selectedRoom.visit.closer.id}`} className="hover:underline">
                              {selectedRoom.visit.closer.name}
                            </Link>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {/* Info toggle for md */}
                      <button
                        onClick={() => setShowInfoPanel(!showInfoPanel)}
                        className="hidden md:flex lg:hidden px-3 py-1 text-xs font-medium rounded-full transition-colors bg-primary/10 text-primary hover:bg-primary/20 items-center gap-1"
                      >
                        <Info className="w-3 h-3" />
                        Info
                      </button>
                      <button
                        onClick={() => setShowContractModal(true)}
                        className="px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1"
                        style={{ backgroundColor: "#f4822120", color: "#f48221" }}
                      >
                        <FileText className="w-3 h-3" />
                        Contratos
                      </button>
                      {(session?.user?.role === "ADMIN" || session?.user?.role === "CLOSER") && (
                        <>
                          <Link
                            href={`/lead/${selectedRoom.visit.id}?tab=archivos`}
                            className="px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1 hover:bg-[#f4822130]"
                            style={{ backgroundColor: "#f4822120", color: "#f48221" }}
                          >
                            <Folder className="w-3 h-3" />
                            Archivos
                          </Link>
                          <Link
                            href={`/lead/${selectedRoom.visit.id}?tab=datos`}
                            className="px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1 hover:bg-[#f4822130]"
                            style={{ backgroundColor: "#f4822120", color: "#f48221" }}
                          >
                            <Pencil className="w-3 h-3" />
                            Editar
                          </Link>
                        </>
                      )}
                      {(session?.user?.role === "ADMIN" || session?.user?.role === "CLOSER") && selectedRoom.visit.stage === 'CLOSED' && !selectedRoom.visit.finalizedAt && (
                        <button
                          onClick={handleFinalize}
                          className="px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors"
                        >
                          <CheckCheck className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {projectDetails && (
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-on-surface-variant">
                          Progreso del proyecto
                        </span>
                        <span className="text-xs font-semibold text-on-surface">
                          {completionPercentage}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            completionPercentage === 100
                              ? 'bg-primary'
                              : completionPercentage >= 50
                              ? 'bg-secondary'
                              : 'bg-tertiary'
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
                                  {msg.fileName || "Ver archivo"}
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
                      placeholder="Escribe un mensaje... usa @ para mencionar"
                      className="w-full"
                    />
                    {showMentionDropdown && filteredMentionUsers.length > 0 && (
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
                <p>Selecciona un chat</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Info Panel */}
          {selectedRoom && (
            <div className={`w-full lg:w-80 border-l border-outline-variant/30 bg-surface-container-low/30 flex-shrink-0 min-h-0 flex flex-col
              ${(!showInfoPanel && mobileColumn !== "info") ? "hidden lg:flex" : "flex"}
            `}>
              <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between flex-shrink-0">
                <h3 className="font-semibold text-on-surface text-sm">Detalles del Proyecto</h3>
                <button
                  onClick={() => { setShowInfoPanel(false); setMobileColumn("conversation"); }}
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
        title="Editar Información del Proyecto"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre del Cliente"
              value={editForm.clientName || ""}
              onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
            />
            <Input
              label="Email del Cliente"
              type="email"
              value={editForm.clientEmail || ""}
              onChange={(e) => setEditForm({ ...editForm, clientEmail: e.target.value })}
            />
          </div>

          <Input
            label="Dirección"
            value={editForm.address || ""}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
          />

          <Input
            label="Teléfono del Cliente"
            type="tel"
            value={(editForm.phone as string) || bill?.phone || ""}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha de Cierre"
              type="date"
              value={editForm.closingDate ? new Date(editForm.closingDate).toISOString().split("T")[0] : ""}
              onChange={(e) => setEditForm({ ...editForm, closingDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
            />
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Método de Pago
              </label>
              <select
                value={editForm.paymentMethod || ""}
                onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface mt-1"
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
          </div>

          {projects.some(p => p.projectType.name === "Panel Solar") && (
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
              <p className="text-sm font-semibold text-on-surface">Panel Solar</p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Financiadora"
                  value={editForm.solarFinancier || ""}
                  onChange={(e) => setEditForm({ ...editForm, solarFinancier: e.target.value })}
                />
                <Input
                  label="Tamaño del Sistema"
                  value={editForm.systemSize || ""}
                  onChange={(e) => setEditForm({ ...editForm, systemSize: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
            <p className="text-sm font-semibold text-on-surface">Comisiones</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Representante Principal"
                value={editForm.primaryRep || ""}
                onChange={(e) => setEditForm({ ...editForm, primaryRep: e.target.value })}
              />
              <Input
                label="Comisión %"
                type="number"
                value={editForm.primaryRepCommPct?.toString() || ""}
                onChange={(e) => setEditForm({ ...editForm, primaryRepCommPct: parseFloat(e.target.value) || undefined })}
              />
            </div>
          </div>

          {commonFields.length > 0 && (() => {
            const alreadyShown = new Set([
              "clientName", "clientEmail", "address", "phone",
              "closingDate", "paymentMethod",
              "primaryRep", "primaryRepCommPct",
            ]);
            const filtered = commonFields.filter((f) => !alreadyShown.has(f.fieldName));
            if (filtered.length === 0) return null;
            return (
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
              <p className="text-sm font-semibold text-on-surface">Campos Comunes</p>
              <div className="grid grid-cols-2 gap-3">
                {filtered.map((field) => (
                  <div key={field.id}>
                    {field.fieldType === "select" ? (
                      <div>
                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                          {field.fieldLabel}
                        </label>
                        <select
                          value={editForm[field.fieldName] as string || ""}
                          onChange={(e) => setEditForm({ ...editForm, [field.fieldName]: e.target.value })}
                          className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface mt-1"
                        >
                          <option value="">Seleccionar...</option>
                          {field.options && JSON.parse(field.options).map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    ) : field.fieldType === "date" ? (
                      <Input
                        label={field.fieldLabel}
                        type="date"
                        value={editForm[field.fieldName] ? new Date(editForm[field.fieldName] as string).toISOString().split("T")[0] : ""}
                        onChange={(e) => setEditForm({ ...editForm, [field.fieldName]: e.target.value })}
                      />
                    ) : field.fieldType === "number" ? (
                      <Input
                        label={field.fieldLabel}
                        type="number"
                        value={editForm[field.fieldName] as string || ""}
                        onChange={(e) => setEditForm({ ...editForm, [field.fieldName]: parseFloat(e.target.value) || undefined })}
                      />
                    ) : (
                      <Input
                        label={field.fieldLabel}
                        value={editForm[field.fieldName] as string || ""}
                        onChange={(e) => setEditForm({ ...editForm, [field.fieldName]: e.target.value })}
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
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveProjectDetails}
              isLoading={saving}
            >
              Guardar Cambios
            </Button>
          </div>
        </div>
      </Modal>

      {selectedRoom && (
        <ContractModal
          isOpen={showContractModal}
          onClose={() => setShowContractModal(false)}
          visitId={selectedRoom.visit.id}
        />
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
  bill?: { imageUrl: string; phone: string; clientName: string; clientEmail: string; additionalFileUrl?: string; additionalFileName?: string };
  stageLabels: Record<string, string>;
}) {
  const { visit } = room;
  const [projectDetails, setProjectDetails] = useState<any>(visit.projectDetails);
  useEffect(() => {
    // Initial fetch
    fetch(`/api/project-details?visitId=${visit.id}&t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setProjectDetails(data);
      })
      .catch(() => {});

    // Polling every 2 seconds to adapt instantly
    const interval = setInterval(() => {
      fetch(`/api/project-details?visitId=${visit.id}&t=${Date.now()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) setProjectDetails(data);
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(interval);
  }, [visit.id]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-4 border-b border-outline-variant/30 flex-shrink-0">
        <h3 className="font-headline text-lg font-bold text-on-surface">Resumen del Proyecto</h3>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        <div className="flex flex-col space-y-3 text-xs">
            {visit.stage && (
              <span className={`self-start px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                visit.stage === 'CLOSED' ? 'bg-primary/10 text-primary' :
                visit.stage === 'CANCELLED' ? 'bg-error/10 text-error' :
                'bg-secondary/10 text-secondary'
              }`}>
                {stageLabels[visit.stage] || visit.stage}
              </span>
            )}
            
            <div className="flex justify-between items-start gap-4">
              <span className="text-on-surface-variant font-medium flex-shrink-0">Tipos de Proyectos:</span>
              <span className="text-on-surface text-right break-words">{projects.length > 0 ? projects.map(p => p.projectType.name).join(", ") : "Ninguno"}</span>
            </div>

            <div className="flex justify-between items-start gap-4">
              <span className="text-on-surface-variant font-medium flex-shrink-0">Nombre:</span>
              <span className="text-on-surface text-right break-words">{bill?.clientName || projectDetails?.clientName || visit.parcel.ownerName || "Sin Nombre"}</span>
            </div>

            <div className="flex justify-between items-start gap-4">
              <span className="text-on-surface-variant font-medium flex-shrink-0">Teléfono:</span>
              <span className="text-on-surface text-right break-words">{bill?.phone || projectDetails?.phone || "N/A"}</span>
            </div>

            <div className="flex justify-between items-start gap-4">
              <span className="text-on-surface-variant font-medium flex-shrink-0">Email:</span>
              <span className="text-on-surface text-right break-words">{bill?.clientEmail || projectDetails?.clientEmail || "N/A"}</span>
            </div>

            <div className="flex justify-between items-start gap-4">
              <span className="text-on-surface-variant font-medium flex-shrink-0">Dirección:</span>
              <span className="text-on-surface text-right break-words">{visit.parcel.address}</span>
            </div>

            <div className="flex justify-between items-start gap-4">
              <span className="text-on-surface-variant font-medium flex-shrink-0">Fecha de Cierre:</span>
              <span className="text-on-surface text-right break-words">{projectDetails?.closingDate ? new Date(String(projectDetails.closingDate)).toLocaleDateString() : "En proceso"}</span>
            </div>

            <div className="flex justify-between items-start gap-4">
              <span className="text-on-surface-variant font-medium flex-shrink-0">Creación del lead:</span>
              <span className="text-on-surface text-right break-words">{visit.createdAt ? new Date(visit.createdAt).toLocaleDateString() : "N/A"}</span>
            </div>

            <div className="flex justify-between items-start gap-4">
              <span className="text-on-surface-variant font-medium flex-shrink-0">Rep. principal:</span>
              <span className="text-on-surface text-right break-words">{projectDetails?.primaryRep || "N/A"}</span>
            </div>

            <div className="flex justify-between items-start gap-4">
              <span className="text-on-surface-variant font-medium flex-shrink-0">Comisión (%):</span>
              <span className="text-on-surface text-right break-words">{projectDetails?.primaryRepCommPct != null ? `${projectDetails.primaryRepCommPct}%` : "N/A"}</span>
            </div>

            <div className="flex justify-between items-start gap-4">
              <span className="text-on-surface-variant font-medium flex-shrink-0">Costo Total:</span>
              <span className="text-on-surface font-semibold text-right break-words">{projectDetails?.generalCostPrice != null ? `$${Number(projectDetails.generalCostPrice).toLocaleString()}` : "N/A"}</span>
            </div>

            <div className="flex justify-between items-start gap-4">
              <span className="text-on-surface-variant font-medium flex-shrink-0">Precio Total:</span>
              <span className="text-on-surface font-semibold text-right break-words">{projectDetails?.generalSalePrice != null ? `$${Number(projectDetails.generalSalePrice).toLocaleString()}` : "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
  );
}
