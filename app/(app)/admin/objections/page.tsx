"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface Objection {
  id: number;
  key: string;
  name: string;
  nameEn?: string;
  color: string;
  isActive: boolean;
  _count?: { visits: number };
}

export default function AdminObjectionsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [objections, setObjections] = useState<Objection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingObjection, setEditingObjection] = useState<Objection | null>(null);
  const [formData, setFormData] = useState({
    key: "",
    name: "",
    nameEn: "",
    color: "#fb7800",
    isActive: true,
  });

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchObjections();
  }, [session, router]);

  const fetchObjections = async () => {
    try {
      const res = await fetch("/api/admin/objections");
      const data = await res.json();
      setObjections(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingObjection
      ? `/api/admin/objections/${editingObjection.id}`
      : "/api/admin/objections";
    const method = editingObjection ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setIsModalOpen(false);
      setEditingObjection(null);
      resetForm();
      fetchObjections();
    }
  };

  const handleEdit = (objection: Objection) => {
    setEditingObjection(objection);
    setFormData({
      key: objection.key,
      name: objection.name,
      nameEn: objection.nameEn || "",
      color: objection.color,
      isActive: objection.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta objeción?")) return;

    const res = await fetch(`/api/admin/objections/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      fetchObjections();
    }
  };

  const resetForm = () => {
    setFormData({
      key: "",
      name: "",
      nameEn: "",
      color: "#fb7800",
      isActive: true,
    });
  };

  const openCreateModal = () => {
    setEditingObjection(null);
    resetForm();
    setIsModalOpen(true);
  };

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
            Objeciones
          </h1>
          <p className="text-on-surface-variant">
            Configura las objeciones disponibles para los setters
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-5 h-5" />
          Nueva Objeción
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {objections.map((objection) => (
          <div
            key={objection.id}
            className="glass-panel p-5 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-4 h-12 rounded-full"
                style={{ backgroundColor: objection.color }}
              />
              <div>
                <p className="font-semibold text-on-surface">{objection.name}</p>
                <p className="text-sm text-on-surface-variant">
                  {objection.nameEn || objection.key}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {objection._count?.visits || 0} visitas con esta objeción
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(objection)}
                className="p-2 rounded-lg hover:bg-surface-container-high transition-colors"
              >
                <Pencil className="w-4 h-4 text-on-surface-variant" />
              </button>
              <button
                onClick={() => handleDelete(objection.id)}
                className="p-2 rounded-lg hover:bg-error-container transition-colors"
              >
                <Trash2 className="w-4 h-4 text-error" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingObjection ? "Editar Objeción" : "Nueva Objeción"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Key (identificador)"
            value={formData.key}
            onChange={(e) =>
              setFormData({ ...formData, key: e.target.value })
            }
            disabled={!!editingObjection}
            required
          />
          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
          />
          <Input
            label="Nombre en inglés"
            value={formData.nameEn}
            onChange={(e) =>
              setFormData({ ...formData, nameEn: e.target.value })
            }
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-12 h-12 rounded-xl border border-outline-variant bg-transparent"
              />
              <Input
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="flex-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveObj"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <label htmlFor="isActiveObj" className="text-on-surface">
              Activa
            </label>
          </div>
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
              {editingObjection ? "Guardar" : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
