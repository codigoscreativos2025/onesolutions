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
  ChevronDown,
} from "lucide-react";

interface Template {
  id: number;
  title: string;
  content: string;
  roles: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  const [sending, setSending] = useState<number | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formRoles, setFormRoles] = useState<string[]>([]);

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

  useEffect(() => {
    if (session?.user?.role === "ADMIN") fetchTemplates();
  }, [session, fetchTemplates]);

  const openCreateModal = () => {
    setEditingTemplate(null);
    setFormTitle("");
    setFormContent("");
    setFormRoles([]);
    setShowModal(true);
  };

  const openEditModal = (tmpl: Template) => {
    setEditingTemplate(tmpl);
    setFormTitle(tmpl.title);
    setFormContent(tmpl.content);
    try {
      setFormRoles(JSON.parse(tmpl.roles));
    } catch {
      setFormRoles([]);
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) return;

    const body = { title: formTitle, content: formContent, roles: formRoles };

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

  const handleSend = async (id: number) => {
    setSending(id);
    try {
      const res = await fetch(`/api/admin/templates/${id}/send`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(`${t.templates.templateSent} (${data.sentTo} users)`);
      }
    } finally {
      setSending(null);
    }
  };

  const toggleRole = (role: string) => {
    setFormRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  if (status === "loading" || !session) return null;

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

            return (
              <div
                key={tmpl.id}
                className="glass-panel rounded-2xl p-5 border-l-4 border-l-yellow-400 hover:border-l-yellow-500 transition-all group"
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
                <div className="bg-surface-variant/30 rounded-xl p-3 mb-3 max-h-24 overflow-hidden">
                  <p className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed">
                    {tmpl.content}
                  </p>
                </div>

                {/* Roles chips */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {roles.map((role) => {
                    const opt = ROLE_OPTIONS.find((r) => r.value === role);
                    return (
                      <span
                        key={role}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold text-white ${opt?.color || "bg-gray-500"}`}
                      >
                        {opt?.label || role}
                      </span>
                    );
                  })}
                  {roles.length === 0 && (
                    <span className="text-xs text-on-surface-variant">{t.templates.allRoles}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-glass-border">
                  <button
                    onClick={() => handleSend(tmpl.id)}
                    disabled={sending === tmpl.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {sending === tmpl.id ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
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

            {/* Role selector */}
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
