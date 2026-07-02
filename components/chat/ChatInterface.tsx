"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Send, Paperclip, Loader2, MessageSquare, Package, FileText, Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface ProjectDetails {
  clientName?: string;
  clientEmail?: string;
  address?: string;
  closingDate?: string;
  paymentMethod?: string;
  solarFinancier?: string;
  systemSize?: string;
  roofType?: string;
  roofSalePrice?: number;
  waterSystemType?: string;
  waterSalePrice?: number;
  otherSalePrice?: number;
  primaryRep?: string;
  primaryRepCommPct?: number;
}

interface ProjectType {
  id: number;
  name: string;
}

interface Room {
  id: number;
  visit: {
    id: number;
    parcel: { id: string; address: string };
    setter: { name: string };
    closer?: { name: string };
    bill?: { imageUrl: string; phone: string; clientName: string; clientEmail: string };
    projectDetails?: ProjectDetails;
    projects?: { projectType: ProjectType }[];
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
  const [showProjectInfo, setShowProjectInfo] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<ProjectDetails>({});
  const [saving, setSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      fetchMessages(selectedRoomId);
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
      fetchMessages(selectedRoom.id);
      fetchRooms();
    }
    setSending(false);
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
      'Techo': ['roofType', 'roofSalePrice'],
      'Purificador de Agua': ['waterSystemType', 'waterSalePrice'],
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
                        Setter: {selectedRoom.visit.setter.name}
                        {selectedRoom.visit.closer &&
                          ` • Closer: ${selectedRoom.visit.closer.name}`}
                      </p>
                    </div>
                    {projectDetails && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowProjectInfo(true)}
                          className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
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
                    )}
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
                          <p className="text-sm">{msg.body}</p>
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
                  className="p-4 border-t border-outline-variant/30 flex gap-2"
                >
                  <label className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest transition-colors cursor-pointer">
                    <Paperclip className="w-5 h-5" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1"
                  />
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

      {/* Modal de Info del Proyecto */}
      <Modal
        isOpen={showProjectInfo}
        onClose={() => setShowProjectInfo(false)}
        title="Información del Proyecto"
      >
        {projectDetails && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Proyectos seleccionados */}
            {projects.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                  Proyectos
                </p>
                <div className="flex flex-wrap gap-2">
                  {projects.map((p) => (
                    <span
                      key={p.projectType.id}
                      className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                    >
                      {p.projectType.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Info del cliente */}
            <div className="grid grid-cols-2 gap-4">
              {projectDetails.clientName && (
                <div>
                  <p className="text-xs text-on-surface-variant">Cliente</p>
                  <p className="font-medium text-on-surface">{projectDetails.clientName}</p>
                </div>
              )}
              {projectDetails.clientEmail && (
                <div>
                  <p className="text-xs text-on-surface-variant">Email</p>
                  <p className="font-medium text-on-surface truncate">{projectDetails.clientEmail}</p>
                </div>
              )}
              {projectDetails.paymentMethod && (
                <div>
                  <p className="text-xs text-on-surface-variant">Pago</p>
                  <p className="font-medium text-on-surface">{projectDetails.paymentMethod}</p>
                </div>
              )}
              {projectDetails.closingDate && (
                <div>
                  <p className="text-xs text-on-surface-variant">Cierre</p>
                  <p className="font-medium text-on-surface">
                    {new Date(projectDetails.closingDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Info específica por tipo de proyecto */}
            {projectDetails.solarFinancier && (
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <p className="text-sm font-semibold text-on-surface mb-2">Panel Solar</p>
                <p className="text-sm text-on-surface">
                  {projectDetails.solarFinancier} • {projectDetails.systemSize}
                </p>
              </div>
            )}
            {projectDetails.roofType && (
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <p className="text-sm font-semibold text-on-surface mb-2">Techo</p>
                <p className="text-sm text-on-surface">
                  {projectDetails.roofType} • ${projectDetails.roofSalePrice?.toLocaleString()}
                </p>
              </div>
            )}
            {projectDetails.waterSystemType && (
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <p className="text-sm font-semibold text-on-surface mb-2">Purificador</p>
                <p className="text-sm text-on-surface">
                  {projectDetails.waterSystemType} • ${projectDetails.waterSalePrice?.toLocaleString()}
                </p>
              </div>
            )}

            {/* Comisiones */}
            {projectDetails.primaryRep && (
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <p className="text-sm font-semibold text-on-surface mb-2">Comisiones</p>
                <p className="text-sm text-on-surface">
                  {projectDetails.primaryRep}: {projectDetails.primaryRepCommPct}%
                </p>
              </div>
            )}

            {/* Bill */}
            {bill && (
              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
                <p className="text-sm font-semibold text-on-surface mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Recibo de Luz
                </p>
                <a
                  href={bill.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  Ver archivo
                </a>
                <p className="text-sm text-on-surface mt-1">Tel: {bill.phone}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

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

          {/* Techo */}
          {projects.some(p => p.projectType.name === "Techo") && (
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
              <p className="text-sm font-semibold text-on-surface">Techo</p>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Tipo de Trabajo
                </label>
                <select
                  value={editForm.roofType || ""}
                  onChange={(e) => setEditForm({ ...editForm, roofType: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface mt-1"
                >
                  <option value="">Seleccionar...</option>
                  <option value="reemplazo">Reemplazo</option>
                  <option value="reparacion">Reparación</option>
                  <option value="gutters">Gutters</option>
                </select>
              </div>
              <Input
                label="Precio de Venta"
                type="number"
                value={editForm.roofSalePrice?.toString() || ""}
                onChange={(e) => setEditForm({ ...editForm, roofSalePrice: parseFloat(e.target.value) || undefined })}
              />
            </div>
          )}

          {/* Purificador */}
          {projects.some(p => p.projectType.name === "Purificador de Agua") && (
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
              <p className="text-sm font-semibold text-on-surface">Purificador de Agua</p>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Tipo de Sistema
                </label>
                <select
                  value={editForm.waterSystemType || ""}
                  onChange={(e) => setEditForm({ ...editForm, waterSystemType: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface mt-1"
                >
                  <option value="">Seleccionar...</option>
                  <option value="sistema completo">Sistema Completo</option>
                  <option value="softener">Softener</option>
                  <option value="R.O">R.O</option>
                  <option value="sistema de pozo">Sistema de Pozo</option>
                </select>
              </div>
              <Input
                label="Precio de Venta"
                type="number"
                value={editForm.waterSalePrice?.toString() || ""}
                onChange={(e) => setEditForm({ ...editForm, waterSalePrice: parseFloat(e.target.value) || undefined })}
              />
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
