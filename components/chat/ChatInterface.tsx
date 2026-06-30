"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Send, Paperclip, Loader2, MessageSquare, Package, FileText } from "lucide-react";

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
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showProjectInfo, setShowProjectInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

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
                onClick={() => setSelectedRoom(room)}
                className={`w-full text-left p-4 border-b border-outline-variant/20 last:border-0 transition-colors ${
                  selectedRoom?.id === room.id
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
                      <button
                        onClick={() => setShowProjectInfo(!showProjectInfo)}
                        className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                      >
                        <Package className="w-3 h-3 inline mr-1" />
                        Info Proyecto
                      </button>
                    )}
                  </div>

                  {/* Project Info Panel */}
                  {showProjectInfo && projectDetails && (
                    <div className="mt-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                      {/* Proyectos seleccionados */}
                      {projects.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                            Proyectos
                          </p>
                          <div className="flex flex-wrap gap-1">
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

                      {/* Info del cliente */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {projectDetails.clientName && (
                          <div>
                            <p className="text-on-surface-variant">Cliente</p>
                            <p className="font-medium text-on-surface">{projectDetails.clientName}</p>
                          </div>
                        )}
                        {projectDetails.clientEmail && (
                          <div>
                            <p className="text-on-surface-variant">Email</p>
                            <p className="font-medium text-on-surface truncate">{projectDetails.clientEmail}</p>
                          </div>
                        )}
                        {projectDetails.paymentMethod && (
                          <div>
                            <p className="text-on-surface-variant">Pago</p>
                            <p className="font-medium text-on-surface">{projectDetails.paymentMethod}</p>
                          </div>
                        )}
                        {projectDetails.closingDate && (
                          <div>
                            <p className="text-on-surface-variant">Cierre</p>
                            <p className="font-medium text-on-surface">
                              {new Date(projectDetails.closingDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Info específica por tipo de proyecto */}
                      {projectDetails.solarFinancier && (
                        <div className="text-xs">
                          <p className="text-on-surface-variant">Panel Solar</p>
                          <p className="font-medium text-on-surface">
                            {projectDetails.solarFinancier} • {projectDetails.systemSize}
                          </p>
                        </div>
                      )}
                      {projectDetails.roofType && (
                        <div className="text-xs">
                          <p className="text-on-surface-variant">Techo</p>
                          <p className="font-medium text-on-surface">
                            {projectDetails.roofType} • ${projectDetails.roofSalePrice?.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {projectDetails.waterSystemType && (
                        <div className="text-xs">
                          <p className="text-on-surface-variant">Purificador</p>
                          <p className="font-medium text-on-surface">
                            {projectDetails.waterSystemType} • ${projectDetails.waterSalePrice?.toLocaleString()}
                          </p>
                        </div>
                      )}

                      {/* Comisiones */}
                      {projectDetails.primaryRep && (
                        <div className="text-xs border-t border-outline-variant/30 pt-2">
                          <p className="text-on-surface-variant">Comisiones</p>
                          <p className="font-medium text-on-surface">
                            {projectDetails.primaryRep}: {projectDetails.primaryRepCommPct}%
                          </p>
                        </div>
                      )}

                      {/* Bill */}
                      {bill && (
                        <div className="text-xs border-t border-outline-variant/30 pt-2">
                          <p className="text-on-surface-variant flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Recibo de Luz
                          </p>
                          <a
                            href={bill.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Ver archivo
                          </a>
                          <p className="text-on-surface mt-1">Tel: {bill.phone}</p>
                        </div>
                      )}
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
    </div>
  );
}
