"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Send, Paperclip, Loader2, MessageSquare, Package, FileText, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

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
    parcel: { id: string; address: string };
    setter: { id: number; name: string };
    closer?: { id: number; name: string };
    bill?: { imageUrl: string; phone: string; clientName: string; clientEmail: string; additionalFileUrl?: string; additionalFileName?: string };
    projectDetails?: ProjectDetails;
    projects?: { projectType: ProjectType }[];
    objections?: ObjectionEntry[];
    closerObjections?: ObjectionEntry[];
    notes?: string;
    cancelledAt?: string;
    cancellationReason?: string;
    completedAt?: string;
    scheduledAt?: string;
  };
  messages: {
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

export function ChatInterface({ isAdmin = false }: { isAdmin?: boolean }) {
  const { data: session } = useSession();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showFullInfo, setShowFullInfo] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<ProjectDetails>({});
  const [saving, setSaving] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<{ id: number; name: string; role: string }[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [commonFields, setCommonFields] = useState<CommonField[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      fetchMessages(selectedRoomId);
      fetchMentionUsers(selectedRoomId);
    }
  }, [selectedRoomId]);

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
    if (projectDetails) {
      setEditForm(projectDetails);
      setShowEditModal(true);
    }
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

    // Detectar si se está escribiendo una mención
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const textAfterAt = value.slice(lastAtIndex + 1);
      // Si no hay espacios después de @, mostrar dropdown
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

  // Función para resaltar menciones en el texto
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const projectDetails = selectedRoom?.visit.projectDetails;
  const projects = selectedRoom?.visit.projects || [];
  const bill = selectedRoom?.visit.bill;

  // Calcular porcentaje de completitud del proyecto
  const calculateCompletion = () => {
    if (!projectDetails) return 0;

    const requiredFields = [
      'clientName',
      'clientEmail',
      'address',
      'closingDate',
      'paymentMethod',
    ];

    const projectSpecificFields: Record<string, string[]> = {
      'Panel Solar': ['solarFinancier', 'systemSize'],
    };

    let totalFields = requiredFields.length;
    let completedFields = requiredFields.filter(field => 
      projectDetails[field as keyof ProjectDetails]
    ).length;

    // Agregar campos específicos según los proyectos seleccionados
    projects.forEach(p => {
      const fields = projectSpecificFields[p.projectType.name];
      if (fields) {
        totalFields += fields.length;
        completedFields += fields.filter(field => 
          projectDetails[field as keyof ProjectDetails]
        ).length;
      }
    });

    // Agregar comisiones
    totalFields += 2;
    if (projectDetails.primaryRep) completedFields++;
    if (projectDetails.primaryRepCommPct) completedFields++;

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  };

  const completionPercentage = calculateCompletion();

  return (
    <div className="space-y-4 h-[calc(100dvh-180px)]">
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

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant">
          <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
          <p>No hay chats activos</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col md:flex-row h-full">
          <div className="w-full md:w-80 border-r border-outline-variant/30 overflow-y-auto max-h-48 md:max-h-full">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleSelectRoom(room)}
                className={`w-full text-left p-4 border-b border-outline-variant/20 last:border-0 transition-colors ${
                  selectedRoomId === room.id
                    ? "bg-primary/10"
                    : "hover:bg-surface-container-low"
                }`}
              >
                <p className="font-semibold text-on-surface text-sm">
                  {room.visit.parcel.address}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {room.messages[0]?.body || "Sin mensajes"}
                </p>
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {selectedRoom ? (
              <>
                <div className="p-4 border-b border-outline-variant/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-on-surface">
                        {selectedRoom.visit.parcel.address}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        Setter:{' '}
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowFullInfo(!showFullInfo)}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                          showFullInfo
                            ? 'bg-primary text-on-primary'
                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                        }`}
                      >
                        <Package className="w-3 h-3 inline mr-1" />
                        Info Proyecto
                      </button>
                      {(session?.user?.role === "ADMIN" || session?.user?.role === "CLOSER") && (
                        <button
                          onClick={handleOpenEditModal}
                          className="px-3 py-1 text-xs font-medium bg-secondary/10 text-secondary rounded-full hover:bg-secondary/20 transition-colors"
                        >
                          <Pencil className="w-3 h-3 inline mr-1" />
                          Editar
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Barra de progreso de completitud */}
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

                {/* Collapsible Full Project Info Panel */}
                {showFullInfo && selectedRoom && (
                  <div className="border-b border-outline-variant/30 bg-surface-container-low/50">
                    <ProjectInfoPanel
                      room={selectedRoom}
                      projects={projects}
                      bill={bill}
                    />
                  </div>
                )}

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
                          className={`max-w-[80%] p-3 rounded-2xl ${
                            isMe
                              ? "bg-primary text-on-primary rounded-br-md"
                              : "bg-surface-container-high text-on-surface rounded-bl-md"
                          }`}
                        >
                          <p className="text-xs opacity-70 mb-1">
                            {msg.user.name}
                          </p>
                          <p className="text-sm">{renderMessageWithMentions(msg.body)}</p>
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
                          <p className="text-[10px] opacity-50 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
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
                  <label className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors cursor-pointer">
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
                    {/* Dropdown de menciones */}
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
                    className="w-11 h-11 p-0"
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
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="cheque">Cheque</option>
                <option value="financiamiento">Financiamiento</option>
                <option value="tarjeta de credito">Tarjeta de Crédito</option>
              </select>
            </div>
          </div>

          {/* Panel Solar */}
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

          {/* Comisiones */}
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

          {/* Campos Comunes */}
          {commonFields.length > 0 && (
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
              <p className="text-sm font-semibold text-on-surface">Campos Comunes</p>
              <div className="grid grid-cols-2 gap-3">
                {commonFields.map((field) => (
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
          )}

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
    </div>
  );
}

function ProjectInfoPanel({
  room,
  projects,
  bill,
}: {
  room: Room;
  projects: { projectType: ProjectType }[];
  bill?: { imageUrl: string; phone: string; clientName: string; clientEmail: string; additionalFileUrl?: string; additionalFileName?: string };
}) {
  const { visit } = room;
  const projectDetails = visit.projectDetails;
  const stageLabels: Record<string, string> = {
    IN_PROGRESS: "En Progreso",
    PROPOSAL_ACCEPTED: "Propuesta Aceptada",
    PROJECT: "En Proyecto",
    CLOSED: "Cerrado",
    CANCELLED: "Cancelado",
  };

  return (
    <div className="p-4 max-h-64 overflow-y-auto">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {visit.stage && (
          <div className="col-span-2 md:col-span-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              visit.stage === 'CLOSED' ? 'bg-primary/10 text-primary' :
              visit.stage === 'CANCELLED' ? 'bg-error/10 text-error' :
              'bg-secondary/10 text-secondary'
            }`}>
              {stageLabels[visit.stage] || visit.stage}
            </span>
          </div>
        )}

        {bill?.clientName && (
          <div>
            <p className="text-xs text-on-surface-variant">Cliente</p>
            <p className="font-medium text-on-surface text-sm">{bill.clientName}</p>
          </div>
        )}
        {bill?.phone && (
          <div>
            <p className="text-xs text-on-surface-variant">Teléfono</p>
            <p className="font-medium text-on-surface text-sm">{bill.phone}</p>
          </div>
        )}
        {bill?.clientEmail && (
          <div>
            <p className="text-xs text-on-surface-variant">Email</p>
            <p className="font-medium text-on-surface text-sm truncate">{bill.clientEmail}</p>
          </div>
        )}

        <div>
          <p className="text-xs text-on-surface-variant">Dirección</p>
          <p className="font-medium text-on-surface text-sm">{visit.parcel.address}</p>
        </div>

        {projects.length > 0 && (
          <div>
            <p className="text-xs text-on-surface-variant">Proyectos</p>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {projects.map((p) => (
                <span
                  key={p.projectType.id}
                  className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {p.projectType.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {projectDetails?.closingDate && (
          <div>
            <p className="text-xs text-on-surface-variant">Fecha de Cierre</p>
            <p className="font-medium text-on-surface text-sm">
              {new Date(projectDetails.closingDate).toLocaleDateString()}
            </p>
          </div>
        )}
        {projectDetails?.paymentMethod && (
          <div>
            <p className="text-xs text-on-surface-variant">Método de Pago</p>
            <p className="font-medium text-on-surface text-sm capitalize">{projectDetails.paymentMethod}</p>
          </div>
        )}
        {projectDetails?.solarFinancier && (
          <div>
            <p className="text-xs text-on-surface-variant">Financiadora Solar</p>
            <p className="font-medium text-on-surface text-sm">{projectDetails.solarFinancier}</p>
          </div>
        )}
        {projectDetails?.systemSize && (
          <div>
            <p className="text-xs text-on-surface-variant">Tamaño del Sistema</p>
            <p className="font-medium text-on-surface text-sm">{projectDetails.systemSize}</p>
          </div>
        )}
        {projectDetails?.otherSalePrice !== undefined && (
          <div>
            <p className="text-xs text-on-surface-variant">Precio de Venta</p>
            <p className="font-medium text-on-surface text-sm">${projectDetails.otherSalePrice?.toLocaleString()}</p>
          </div>
        )}
        {projectDetails?.primaryRep && (
          <div>
            <p className="text-xs text-on-surface-variant">Rep. Principal</p>
            <p className="font-medium text-on-surface text-sm">
              {projectDetails.primaryRep}
              {projectDetails.primaryRepCommPct !== undefined && ` (${projectDetails.primaryRepCommPct}%)`}
            </p>
          </div>
        )}

        {visit.objections && visit.objections.length > 0 && (
          <div className="col-span-2 md:col-span-3">
            <p className="text-xs text-on-surface-variant mb-1">Objeciones (Setter)</p>
            <div className="flex flex-wrap gap-1">
              {visit.objections.map((o, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: o.objection?.color ? `${o.objection.color}20` : undefined,
                    color: o.objection?.color || undefined,
                    border: o.objection?.color ? `1px solid ${o.objection.color}40` : undefined,
                  }}
                >
                  {o.objection?.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {visit.closerObjections && visit.closerObjections.length > 0 && (
          <div className="col-span-2 md:col-span-3">
            <p className="text-xs text-on-surface-variant mb-1">Objeciones (Closer)</p>
            <div className="flex flex-wrap gap-1">
              {visit.closerObjections.map((o, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: o.closerObjection?.color ? `${o.closerObjection.color}20` : undefined,
                    color: o.closerObjection?.color || undefined,
                    border: o.closerObjection?.color ? `1px solid ${o.closerObjection.color}40` : undefined,
                  }}
                >
                  {o.closerObjection?.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {visit.notes && (
          <div className="col-span-2 md:col-span-3">
            <p className="text-xs text-on-surface-variant mb-1">Notas</p>
            <p className="text-sm text-on-surface whitespace-pre-wrap">{visit.notes}</p>
          </div>
        )}

        {bill && (
          <div className="col-span-2 md:col-span-3">
            <p className="text-xs text-on-surface-variant mb-1">Recibo de Luz</p>
            <div className="flex flex-wrap gap-2">
              <a
                href={bill.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-xs flex items-center gap-1"
              >
                <FileText className="w-3 h-3" /> Ver recibo
              </a>
              {bill.additionalFileUrl && (
                <a
                  href={bill.additionalFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" /> {bill.additionalFileName || "Archivo adicional"}
                </a>
              )}
            </div>
          </div>
        )}

        {visit.scheduledAt && (
          <div>
            <p className="text-xs text-on-surface-variant">Cita Programada</p>
            <p className="font-medium text-on-surface text-sm">
              {new Date(visit.scheduledAt).toLocaleDateString()}
            </p>
          </div>
        )}
        {visit.cancelledAt && (
          <div className="col-span-2 md:col-span-3">
            <p className="text-xs text-error mb-1">Cancelado</p>
            <p className="text-sm text-on-surface">
              {new Date(visit.cancelledAt).toLocaleDateString()}
              {visit.cancellationReason && ` — ${visit.cancellationReason}`}
            </p>
          </div>
        )}
        {visit.completedAt && (
          <div>
            <p className="text-xs text-on-surface-variant">Completado</p>
            <p className="font-medium text-on-surface text-sm">
              {new Date(visit.completedAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
