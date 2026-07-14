"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Pencil, Trash2, Loader2, ArrowUp, ArrowDown } from "lucide-react";

interface BusinessSettings {
  id: number;
  logoUrl: string | null;
  watermarkedEnabled: boolean;
}

interface NotAvailableTag {
  id: number;
  name: string;
  nameEn: string | null;
  color: string;
  isActive: boolean;
  order: number;
  _count?: { visits: number };
}

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [tags, setTags] = useState<NotAvailableTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#fb7800");
  const [creating, setCreating] = useState(false);

  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [editTagColor, setEditTagColor] = useState("");
  const [editTagActive, setEditTagActive] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchAll();
  }, [session, router]);

  const fetchAll = async () => {
    try {
      const [settingsRes, tagsRes] = await Promise.all([
        fetch("/api/admin/business-settings"),
        fetch("/api/admin/not-available-tags"),
      ]);
      setSettings(await settingsRes.json());
      setTags(await tagsRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("logo", file);

    const res = await fetch("/api/admin/business-settings", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const updated = await res.json();
      setSettings(updated);
    }
    setUploading(false);
  };

  const handleWatermarkToggle = async () => {
    if (!settings) return;
    const res = await fetch("/api/admin/business-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        watermarkedEnabled: !settings.watermarkedEnabled,
      }),
    });
    if (res.ok) {
      setSettings(await res.json());
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setCreating(true);

    const maxOrder = tags.reduce(
      (max, t) => Math.max(max, t.order),
      0
    );

    const res = await fetch("/api/admin/not-available-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newTagName.trim(),
        color: newTagColor,
        order: maxOrder + 1,
      }),
    });

    if (res.ok) {
      setNewTagName("");
      setNewTagColor("#fb7800");
      fetchAll();
    }
    setCreating(false);
  };

  const handleStartEdit = (tag: NotAvailableTag) => {
    setEditingTagId(tag.id);
    setEditTagName(tag.name);
    setEditTagColor(tag.color);
    setEditTagActive(tag.isActive);
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
  };

  const handleSaveEdit = async (id: number) => {
    const res = await fetch(`/api/admin/not-available-tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editTagName,
        color: editTagColor,
        isActive: editTagActive,
      }),
    });

    if (res.ok) {
      setEditingTagId(null);
      fetchAll();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta etiqueta?")) return;
    const res = await fetch(`/api/admin/not-available-tags/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      fetchAll();
    }
  };

  const handleMove = async (id: number, direction: "up" | "down") => {
    const idx = tags.findIndex((t) => t.id === id);
    if (idx === -1) return;

    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === tags.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const currentTag = tags[idx];
    const swapTag = tags[swapIdx];

    await Promise.all([
      fetch(`/api/admin/not-available-tags/${currentTag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: swapTag.order }),
      }),
      fetch(`/api/admin/not-available-tags/${swapTag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: currentTag.order }),
      }),
    ]);

    fetchAll();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">
          Configuración
        </h1>
        <p className="text-on-surface-variant">
          Personaliza la apariencia y comportamiento del negocio
        </p>
      </div>

      {/* Section 1: Logo del Negocio */}
      <div className="glass-panel p-6 rounded-2xl border-outline-variant space-y-4">
        <h2 className="font-headline text-lg font-bold text-on-surface">
          Logo del Negocio
        </h2>
        <p className="text-sm text-on-surface-variant">
          Sube el logo que aparecerá en los reportes y documentos
        </p>

        <div className="flex items-center gap-4">
          {settings?.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Logo del negocio"
              className="w-24 h-24 object-contain rounded-xl bg-surface-container-low border border-outline-variant p-2"
            />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-center text-on-surface-variant text-xs text-center p-2">
              Sin logo
            </div>
          )}

          <label
            className={`cursor-pointer h-11 px-4 rounded-xl border border-outline-variant bg-transparent text-on-surface hover:bg-surface-container-high transition-all active:scale-[0.98] font-semibold flex items-center justify-center gap-2 text-base ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Subiendo...
              </>
            ) : settings?.logoUrl ? (
              "Cambiar Logo"
            ) : (
              "Subir Logo"
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
              disabled={uploading}
            />
          </label>

          {settings?.logoUrl && (
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                const res = await fetch("/api/admin/business-settings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ logoUrl: null }),
                });
                if (res.ok) setSettings(await res.json());
              }}
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.watermarkedEnabled ?? true}
              onChange={handleWatermarkToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </label>
          <span className="text-sm text-on-surface">
            Marca de agua en reportes
          </span>
        </div>
      </div>

      {/* Section 2: Etiquetas "No Disponible" */}
      <div className="glass-panel p-6 rounded-2xl border-outline-variant space-y-4">
        <h2 className="font-headline text-lg font-bold text-on-surface">
          Etiquetas &quot;No Disponible&quot;
        </h2>
        <p className="text-sm text-on-surface-variant">
          Configura las razones por las que un setter puede marcar una parcela como no disponible
        </p>

        <div className="flex items-end gap-3">
          <Input
            label="Nombre"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Ej: Perros agresivos"
            className="flex-1"
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Color
            </label>
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="w-12 h-12 rounded-xl border border-outline-variant bg-transparent cursor-pointer"
            />
          </div>
          <Button onClick={handleCreateTag} disabled={creating || !newTagName.trim()}>
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Crear
          </Button>
        </div>

        <div className="space-y-3">
          {tags.length === 0 && (
            <p className="text-center py-8 text-on-surface-variant">
              No hay etiquetas configuradas
            </p>
          )}

          {tags.map((tag, idx) => (
            <div
              key={tag.id}
              className="flex items-center gap-3 p-4 rounded-xl bg-surface-container-low border border-outline-variant"
            >
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMove(tag.id, "up")}
                  disabled={idx === 0}
                  className="p-0.5 rounded hover:bg-surface-container-highest disabled:opacity-30"
                >
                  <ArrowUp className="w-4 h-4 text-on-surface-variant" />
                </button>
                <button
                  onClick={() => handleMove(tag.id, "down")}
                  disabled={idx === tags.length - 1}
                  className="p-0.5 rounded hover:bg-surface-container-highest disabled:opacity-30"
                >
                  <ArrowDown className="w-4 h-4 text-on-surface-variant" />
                </button>
              </div>

              {editingTagId === tag.id ? (
                <div className="flex-1 flex items-center gap-3">
                  <input
                    type="color"
                    value={editTagColor}
                    onChange={(e) => setEditTagColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-outline-variant bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editTagName}
                    onChange={(e) => setEditTagName(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none text-on-surface"
                  />
                  <label className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                    <input
                      type="checkbox"
                      checked={editTagActive}
                      onChange={(e) => setEditTagActive(e.target.checked)}
                      className="w-4 h-4 rounded border-outline-variant text-primary"
                    />
                    Activo
                  </label>
                  <Button size="sm" onClick={() => handleSaveEdit(tag.id)}>
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <>
                  <div
                    className="w-4 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-on-surface">
                      {tag.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {tag._count?.visits || 0} visitas
                      {!tag.isActive && " · Inactiva"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartEdit(tag)}
                    className="p-2 rounded-lg hover:bg-surface-container-high transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-on-surface-variant" />
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="p-2 rounded-lg hover:bg-error-container transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-error" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
