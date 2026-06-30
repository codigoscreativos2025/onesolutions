"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2, Loader2, Award, RefreshCw } from "lucide-react";

interface Badge {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  role: string;
  doorsThreshold?: number;
  prospectsThreshold?: number;
  projectsThreshold?: number;
  _count?: { userBadges: number };
}

export default function AdminBadgesPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [checking, setChecking] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    color: "#006e00",
    role: "SETTER",
    doorsThreshold: 0,
    prospectsThreshold: 0,
    projectsThreshold: 0,
  });

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchBadges();
  }, [session, router]);

  const fetchBadges = async () => {
    try {
      const res = await fetch("/api/admin/badges");
      const data = await res.json();
      setBadges(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingBadge
      ? `/api/admin/badges/${editingBadge.id}`
      : "/api/admin/badges";
    const method = editingBadge ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setIsModalOpen(false);
      setEditingBadge(null);
      resetForm();
      fetchBadges();
    }
  };

  const handleEdit = (badge: Badge) => {
    setEditingBadge(badge);
    setFormData({
      name: badge.name,
      description: badge.description || "",
      icon: badge.icon || "",
      color: badge.color,
      role: badge.role,
      doorsThreshold: badge.doorsThreshold || 0,
      prospectsThreshold: badge.prospectsThreshold || 0,
      projectsThreshold: badge.projectsThreshold || 0,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta medalla?")) return;

    const res = await fetch(`/api/admin/badges/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      fetchBadges();
    }
  };

  const handleCheckBadges = async () => {
    setChecking(true);
    await fetch("/api/badges/check", { method: "POST" });
    setChecking(false);
    fetchBadges();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "",
      color: "#006e00",
      role: "SETTER",
      doorsThreshold: 0,
      prospectsThreshold: 0,
      projectsThreshold: 0,
    });
  };

  const openCreateModal = () => {
    setEditingBadge(null);
    resetForm();
    setIsModalOpen(true);
  };

  const setterBadges = badges.filter((b) => b.role === "SETTER");
  const closerBadges = badges.filter((b) => b.role === "CLOSER");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Medallas
          </h1>
          <p className="text-on-surface-variant">
            Configura las medallas y metas para setters y closers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCheckBadges} disabled={checking}>
            {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            <span className="ml-2">Verificar</span>
          </Button>
          <Button onClick={openCreateModal}>
            <Plus className="w-5 h-5" />
            Nueva Medalla
          </Button>
        </div>
      </div>

      {/* Setter Badges */}
      <div>
        <h2 className="font-headline text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Medallas para Setters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {setterBadges.map((badge) => (
            <div
              key={badge.id}
              className="glass-panel p-5 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${badge.color}20` }}
                >
                  {badge.icon}
                </div>
                <div>
                  <p className="font-semibold text-on-surface">{badge.name}</p>
                  <p className="text-sm text-on-surface-variant">
                    {badge.description}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {badge.doorsThreshold} puertas + {badge.prospectsThreshold} prospectos
                  </p>
                  <p className="text-xs text-primary mt-1">
                    {badge._count?.userBadges || 0} usuarios la tienen
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(badge)}
                  className="p-2 rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  <Pencil className="w-4 h-4 text-on-surface-variant" />
                </button>
                <button
                  onClick={() => handleDelete(badge.id)}
                  className="p-2 rounded-lg hover:bg-error-container transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-error" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {setterBadges.length === 0 && (
          <p className="text-on-surface-variant text-center py-4">
            No hay medallas configuradas para setters
          </p>
        )}
      </div>

      {/* Closer Badges */}
      <div>
        <h2 className="font-headline text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-secondary" />
          Medallas para Closers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {closerBadges.map((badge) => (
            <div
              key={badge.id}
              className="glass-panel p-5 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${badge.color}20` }}
                >
                  {badge.icon}
                </div>
                <div>
                  <p className="font-semibold text-on-surface">{badge.name}</p>
                  <p className="text-sm text-on-surface-variant">
                    {badge.description}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {badge.projectsThreshold} proyectos cerrados
                  </p>
                  <p className="text-xs text-primary mt-1">
                    {badge._count?.userBadges || 0} usuarios la tienen
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(badge)}
                  className="p-2 rounded-lg hover:bg-surface-container-high transition-colors"
                >
                  <Pencil className="w-4 h-4 text-on-surface-variant" />
                </button>
                <button
                  onClick={() => handleDelete(badge.id)}
                  className="p-2 rounded-lg hover:bg-error-container transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-error" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {closerBadges.length === 0 && (
          <p className="text-on-surface-variant text-center py-4">
            No hay medallas configuradas para closers
          </p>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBadge ? "Editar Medalla" : "Nueva Medalla"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Rol
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface mt-1"
            >
              <option value="SETTER">Setter</option>
              <option value="CLOSER">Closer</option>
            </select>
          </div>
          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Input
            label="Icono (emoji)"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="🥇 🥈 🥉 💎"
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-12 rounded-xl border border-outline-variant bg-transparent"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          {formData.role === "SETTER" ? (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Meta de Puertas"
                type="number"
                value={formData.doorsThreshold}
                onChange={(e) => setFormData({ ...formData, doorsThreshold: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="Meta de Prospectos"
                type="number"
                value={formData.prospectsThreshold}
                onChange={(e) => setFormData({ ...formData, prospectsThreshold: parseInt(e.target.value) || 0 })}
              />
            </div>
          ) : (
            <Input
              label="Meta de Proyectos Cerrados"
              type="number"
              value={formData.projectsThreshold}
              onChange={(e) => setFormData({ ...formData, projectsThreshold: parseInt(e.target.value) || 0 })}
            />
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editingBadge ? "Guardar" : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
