"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Send, Paperclip, Loader2, MessageSquare } from "lucide-react";

interface Room {
  id: number;
  visit: {
    parcel: { address: string };
    setter: { name: string };
    closer?: { name: string };
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
                  <p className="font-semibold text-on-surface">
                    {selectedRoom.visit.parcel.address}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Setter: {selectedRoom.visit.setter.name}
                    {selectedRoom.visit.closer &&
                      ` • Closer: ${selectedRoom.visit.closer.name}`}
                  </p>
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
