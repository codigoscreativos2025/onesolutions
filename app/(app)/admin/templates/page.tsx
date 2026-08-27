"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Send,
  X,
  Check,
  Users,
  Search,
  MapPin,
  User,
} from "lucide-react";

interface Template {
  id: number;
  title: string;
  content: string;
  roles: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ActiveUser {
  id: number;
  name: string;
  role: string;
  activeProject: {
    visitId: number;
    address: string;
    stage: string;
  } | null;
}

const ROLE_OPTIONS = [
  { value: "SETTER", label: "Trainee", color: "bg-blue-500" },
  { value: "CLOSER", label: "Closer", color: "bg-green-500" },
  { value: "SETTER_JR", label: "Setter", color: "bg-orange-500" },
  { value: "PARTNER", label: "Partner", color: "bg-purple-500" },
];

export default function TemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLocale();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  
  // Send Modal State
  const [showSendModal, setShowSendModal] = useState(false);
  const [templateToSend, setTemplateToSend] = useState<Template | null>(null);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [dispatchMode, setDispatchMode] = useState<"project" | "user">("project");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTarget, setSelectedTarget] = useState<{ type: "project" | "user"; id: number } | null>(null);
  const [sending, setSending] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formRoles, setFormRoles] = useState<string[]>([]);
  const [formColor, setFormColor] = useState("yellow");

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "ADMIN")) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/templates");
      const data = await res.json();
      if (Array.isArray(data)) setTemplates(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveUsers = async () => {
    try {
      const res = await fetch("/api/admin/active-users");
      const data = await res.json();
      if (Array.isArray(data)) setActiveUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchTemplates();
      fetchActiveUsers();
    }
  }, [session, fetchTemplates]);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormTitle("");
    setFormContent("");
    setFormRoles([]);
    setFormColor("yellow");
    setShowModal(true);
  };

  const openEditModal = (tmpl: Template) => {
    setEditingTemplate(tmpl);
    setFormTitle(tmpl.title);
    setFormContent(tmpl.content);
    setFormColor(tmpl.color || "yellow");
    try {
      setFormRoles(JSON.parse(tmpl.roles));
    } catch {
      setFormRoles([]);
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;

    const body = { title: formTitle, content: formContent, roles: formRoles, color: formColor };

    if (editingTemplate) {
      await fetch(`/api/admin/templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setShowModal(false);
    fetchTemplates();
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.templates.deleteConfirm)) return;
    await fetch(`/api/admin/templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  };

  const openSendModal = (tmpl: Template) => {
    setTemplateToSend(tmpl);
    setSearchQuery("");
    setSelectedTarget(null);
    setDispatchMode("project");
    setShowSendModal(true);
  };

  const handleConfirmSend = async () => {
    if (!templateToSend || !selectedTarget) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/templates/${templateToSend.id}/send`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: selectedTarget.type,
          targetId: selectedTarget.id
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(t.templates.templateSent);
        setShowSendModal(false);
      } else {
        alert("Error: " + data.error);
      }
    } finally {
      setSending(false);
    }
  };

  const toggleRole = (role: string) => {
    setFormRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  if (status === "loading" || !session) return null;

  // Filter users based on dispatch mode and search
  const filteredOptions = activeUsers.filter((u) => {
    if (dispatchMode === "project" && !u.activeProject) return false;
    if (!searchQuery) return true;
    
    const q = searchQuery.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(q);
    const roleMatch = u.role?.toLowerCase().includes(q);
    const projectMatch = u.activeProject?.address?.toLowerCase().includes(q);
    return nameMatch || roleMatch || projectMatch;
  });

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface flex items-center gap-2">
            <FileText className="w-6 h-6 text-yellow-500" />
            {t.templates.title}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">{t.templates.subtitle}</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          {t.templates.createNew}
        </button>
      </div>

      {/* Template List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-3" />
          <p className="text-on-surface-variant">{t.templates.noTemplates}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tmpl) => {
            const roles: string[] = (() => {
              try { return JSON.parse(tmpl.roles); } catch { return []; }
            })();

            const colorClass = tmpl.color 
                ? `border-l-${tmpl.color}-400 hover:border-l-${tmpl.color}-500` 
                : "border-l-yellow-400 hover:border-l-yellow-500";

            return (
              <div
                key={tmpl.id}
                className={`glass-panel rounded-2xl p-5 border-l-4 transition-all flex flex-col ${colorClass}`}
              >
                {/* Title & Status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-on-surface text-lg truncate">{tmpl.title}</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {new Date(tmpl.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tmpl.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {tmpl.isActive ? t.templates.active : t.templates.inactive}
                  </span>
                </div>

                {/* Content preview */}
                <div className="bg-surface-variant/30 rounded-xl p-3 mb-3 max-h-24 overflow-hidden flex-1">
                  <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
                    {tmpl.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 mt-auto border-t border-glass-border">
                  <button
                    onClick={() => openSendModal(tmpl)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    {t.templates.sendTemplate}
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => openEditModal(tmpl)}
                    className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title={t.templates.editTemplate}
                  >
                    <Pencil className="w-4 h-4 text-blue-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(tmpl.id)}
                    className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                    title={t.templates.deleteTemplate}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SEND MODAL */}
      {showSendModal && templateToSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-glass-border">
              <div>
                <h2 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
                  <Send className="w-5 h-5 text-yellow-500" />
                  {t.templates.sendTemplate}
                </h2>
                <p className="text-sm text-on-surface-variant mt-1 truncate max-w-[300px]">
                  {templateToSend.title}
                </p>
              </div>
              <button onClick={() => setShowSendModal(false)} className="p-1.5 hover:bg-surface-variant/50 rounded-lg">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <label className="block text-sm font-semibold text-on-surface mb-2">
                {t.templates.sendMode}
              </label>
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => { setDispatchMode("project"); setSelectedTarget(null); }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all border ${
                    dispatchMode === "project" 
                      ? "bg-primary text-on-primary border-primary" 
                      : "bg-surface-variant/30 text-on-surface border-outline-variant/30 hover:bg-surface-variant/50"
                  }`}
                >
                  {t.templates.sendToProject}
                </button>
                <button
                  onClick={() => { setDispatchMode("user"); setSelectedTarget(null); }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all border ${
                    dispatchMode === "user" 
                      ? "bg-primary text-on-primary border-primary" 
                      : "bg-surface-variant/30 text-on-surface border-outline-variant/30 hover:bg-surface-variant/50"
                  }`}
                >
                  {t.templates.sendToUser}
                </button>
              </div>

              <label className="block text-sm font-semibold text-on-surface mb-2">
                {dispatchMode === "project" ? t.templates.selectProject : t.templates.selectUser}
              </label>
              
              <div className="relative mb-4">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder={t.templates.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-surface-variant/30 border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                {filteredOptions.length === 0 ? (
                  <div className="text-center py-6 text-sm text-on-surface-variant">
                    {dispatchMode === "project" ? "No se encontraron proyectos activos." : "No se encontraron usuarios."}
                  </div>
                ) : (
                  filteredOptions.map((u) => {
                    const isSelected = dispatchMode === "project" 
                      ? (selectedTarget?.type === "project" && selectedTarget?.id === u.activeProject?.visitId)
                      : (selectedTarget?.type === "user" && selectedTarget?.id === u.id);

                    return (
                      <button
                        key={`${dispatchMode}-${u.id}`}
                        onClick={() => setSelectedTarget({
                          type: dispatchMode,
                          id: dispatchMode === "project" ? u.activeProject!.visitId : u.id
                        })}
                        className={`flex items-center p-3 rounded-xl border text-left transition-all ${
                          isSelected 
                            ? "border-primary bg-primary/5" 
                            : "border-outline-variant/20 hover:border-primary/40 bg-surface-variant/10"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm truncate">{u.name}</span>
                            <span className="text-[10px] bg-surface-variant px-2 py-0.5 rounded-full font-medium">
                              {u.role}
                            </span>
                          </div>
                          
                          {dispatchMode === "project" ? (
                            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-brand-orange" />
                              <span className="truncate">{u.activeProject?.address}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                              <User className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
                              <span className="truncate">
                                {u.activeProject?.address ? `Proyecto actual: ${u.activeProject.address}` : t.templates.noActiveProject}
                              </span>
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 bg-primary text-on-primary rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-6 border-t border-glass-border flex gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="flex-1 px-4 py-2.5 border border-outline-variant/30 text-on-surface rounded-xl font-semibold text-sm hover:bg-surface-variant/20 transition"
              >
                {t.templates.cancel}
              </button>
              <button
                onClick={handleConfirmSend}
                disabled={!selectedTarget || sending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500 text-white rounded-xl font-semibold text-sm hover:bg-yellow-600 transition disabled:opacity-50"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t.templates.send}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-xl font-bold text-on-surface">
                {editingTemplate ? t.templates.editTemplate : t.templates.createNew}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-surface-variant/50 rounded-lg">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            {/* Title input */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-on-surface mb-1.5">
                {t.templates.titleLabel}
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-variant/30 border border-outline-variant/30 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary"
                placeholder="Ej: Bienvenida al equipo 👋"
              />
            </div>

            {/* Content textarea */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-on-surface mb-1.5">
                {t.templates.contentLabel}
              </label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={5}
                className="w-full px-3 py-2.5 bg-surface-variant/30 border border-outline-variant/30 rounded-xl text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary resize-none"
                placeholder="Escribe tu plantilla aquí... los emojis son bienvenidos 🎉✨🏆"
              />
            </div>

            {/* Role selector (For UI labels context, not strictly used for direct dispatch anymore) */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-on-surface mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                {t.templates.rolesLabel}
              </label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((role) => {
                  const isSelected = formRoles.includes(role.value);
                  return (
                    <button
                      key={role.value}
                      onClick={() => toggleRole(role.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                        isSelected
                          ? `${role.color} text-white shadow-md`
                          : "bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {role.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-on-surface mb-2">
                Color de la tarjeta
              </label>
              <div className="flex flex-wrap gap-2">
                {["yellow", "blue", "green", "red", "purple", "orange"].map((c) => {
                  const isSelected = formColor === c;
                  const colorMap: Record<string, string> = {
                    yellow: "bg-yellow-400",
                    blue: "bg-blue-400",
                    green: "bg-green-400",
                    red: "bg-red-400",
                    purple: "bg-purple-400",
                    orange: "bg-orange-400",
                  };
                  return (
                    <button
                      key={c}
                      onClick={() => setFormColor(c)}
                      className={`w-8 h-8 rounded-full ${colorMap[c]} transition-all ${isSelected ? "ring-2 ring-offset-2 ring-primary scale-110" : "opacity-70 hover:opacity-100"}`}
                      title={c}
                    />
                  );
                })}
              </div>
            </div>

            {/* Save button */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-outline-variant/30 text-on-surface rounded-xl font-semibold text-sm hover:bg-surface-variant/20 transition"
              >
                {t.templates.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={!formTitle.trim() || !formContent.trim()}
                className="flex-1 px-4 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
              >
                {t.templates.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


