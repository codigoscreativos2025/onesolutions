"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Pencil, Trash2, Plus, Loader2, Calendar } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

interface Note {
  id: number;
  content: string;
  createdAt: string;
  user: { id: number; name: string; role: string };
}

interface NotesPanelProps {
  visitId: number;
  visitCreatedAt?: string;
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-xl p-6">
      <h3 className="font-semibold text-lg flex items-center gap-2 text-on-surface mb-4">
        <Pencil className="w-5 h-5 text-primary" />
        Notas
      </h3>
      {children}
    </div>
  );
}

export function NotesPanel({ visitId, visitCreatedAt }: NotesPanelProps) {
  const { data: session } = useSession();
  const { t } = useLocale();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  const isAdmin = session?.user?.role === "ADMIN";
  const isPartner = session?.user?.role === "PARTNER";

  if (isPartner) return null;

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);

  const [filterDate, setFilterDate] = useState("");
  const [filterError, setFilterError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editContent, setEditContent] = useState("");

  const fetchNotes = useCallback(async () => {
    try {
      const url = filterDate
        ? `/api/visits/${visitId}/notes?date=${filterDate}`
        : `/api/visits/${visitId}/notes`;
      const res = await fetch(url);
      if (res.ok) {
        setNotes(await res.json());
      }
    } catch {
      toast.error("Error al cargar notas");
    } finally {
      setLoading(false);
    }
  }, [visitId, filterDate]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const validateDate = (dateStr: string): boolean => {
    if (!dateStr) {
      setFilterError("");
      return true;
    }

    const selectedDate = new Date(dateStr + "T00:00:00");
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (selectedDate > todayEnd) {
      setFilterError("Fecha inválida a la desarrollada en el proyecto");
      return false;
    }

    if (visitCreatedAt) {
      const visitStart = new Date(visitCreatedAt);
      if (selectedDate < new Date(visitStart.getFullYear(), visitStart.getMonth(), visitStart.getDate())) {
        setFilterError("Fecha inválida a la desarrollada en el proyecto");
        return false;
      }
    }

    setFilterError("");
    return true;
  };

  const handleFilterChange = (value: string) => {
    setFilterDate(value);
    if (validateDate(value)) {
      setFilterError("");
    }
  };

  const handleAdd = async () => {
    if (!newContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/visits/${visitId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent.trim() }),
      });
      if (res.ok) {
        toast.success("Nota agregada");
        setNewContent("");
        setShowAddModal(false);
        fetchNotes();
      } else {
        toast.error("Error al agregar nota");
      }
    } catch {
      toast.error("Error al agregar nota");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedNote || !editContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/visits/${visitId}/notes/${selectedNote.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editContent.trim() }),
        }
      );
      if (res.ok) {
        toast.success("Nota editada");
        setShowEditModal(false);
        fetchNotes();
      } else {
        toast.error("Error al editar nota");
      }
    } catch {
      toast.error("Error al editar nota");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNote) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/visits/${visitId}/notes/${selectedNote.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        toast.success("Nota eliminada");
        setShowDeleteModal(false);
        fetchNotes();
      } else {
        toast.error("Error al eliminar nota");
      }
    } catch {
      toast.error("Error al eliminar nota");
    } finally {
      setSaving(false);
    }
  };

  const canEdit = (note: Note) =>
    !isAdmin && note.user.id === userId;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Panel>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-on-surface-variant shrink-0" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-sm text-on-surface"
          />
          {filterDate && (
            <button
              onClick={() => { setFilterDate(""); setFilterError(""); }}
              className="text-xs text-primary hover:underline"
            >
              Limpiar
            </button>
          )}
        </div>
        {filterError && (
          <p className="text-xs text-error">{filterError}</p>
        )}

        <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-8">
              Sin notas{filterDate ? " en esta fecha" : ""}
            </p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/50"
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="text-xs text-on-surface-variant">
                    {formatDate(note.createdAt)} — {note.user.name}
                  </span>
                  {canEdit(note) && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedNote(note);
                          setEditContent(note.content);
                          setShowEditModal(true);
                        }}
                        className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedNote(note);
                          setShowDeleteModal(true);
                        }}
                        className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-error transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-on-surface whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            ))
          )}
        </div>

        {!isAdmin && (
          <div className="flex gap-2 pt-2 border-t border-outline-variant/30">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Escribir nota..."
              className="flex-1 min-h-[60px] bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-xl p-3 resize-none text-sm text-on-surface"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && newContent.trim()) {
                  e.preventDefault();
                  setShowAddModal(true);
                }
              }}
            />
            <Button
              size="sm"
              disabled={!newContent.trim()}
              onClick={() => setShowAddModal(true)}
              className="shrink-0 self-end"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Agregar Nota"
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            ¿Quieres agregar esta nota?
          </p>
          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/50">
            <p className="text-sm text-on-surface whitespace-pre-wrap">
              {newContent}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              className="flex-1"
            >
              {t.common.cancel}
            </Button>
            <Button onClick={handleAdd} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Agregar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Nota"
      >
        <div className="space-y-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full min-h-[120px] bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-xl p-4 resize-none text-sm text-on-surface"
            placeholder="Editar nota..."
          />
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              className="flex-1"
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleEdit}
              disabled={saving || !editContent.trim()}
              className="flex-1"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
              {t.common.save}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Nota"
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            ¿Estás seguro de eliminar esta nota? Esta acción no se puede deshacer.
          </p>
          {selectedNote && (
            <div className="p-3 rounded-xl bg-error/5 border border-error/20">
              <p className="text-xs text-on-surface-variant mb-1">
                {formatDate(selectedNote.createdAt)} — {selectedNote.user.name}
              </p>
              <p className="text-sm text-on-surface whitespace-pre-wrap">
                {selectedNote.content}
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1"
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleDelete}
              disabled={saving}
              variant="danger"
              className="flex-1"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {t.common.delete}
            </Button>
          </div>
        </div>
      </Modal>
    </Panel>
  );
}
