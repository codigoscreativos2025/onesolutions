"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
  closerId?: number;
  closer?: { id: number; name: string };
  _count?: { setters: number };
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "SETTER",
    closerId: "",
    phone: "",
    isActive: true,
  });

  const closers = users.filter((u) => u.role === "CLOSER");

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchUsers();
  }, [session, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingUser
      ? `/api/admin/users/${editingUser.id}`
      : "/api/admin/users";
    const method = editingUser ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setIsModalOpen(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      closerId: user.closerId?.toString() || "",
      phone: user.phone || "",
      isActive: user.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este usuario?")) return;

    const res = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      fetchUsers();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "SETTER",
      closerId: "",
      phone: "",
      isActive: true,
    });
  };

  const openCreateModal = () => {
    setEditingUser(null);
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
            Usuarios
          </h1>
          <p className="text-on-surface-variant">
            Gestiona setters, closers y administradores
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/30">
                <th className="text-left p-4 text-sm font-semibold text-on-surface-variant uppercase">
                  Nombre
                </th>
                <th className="text-left p-4 text-sm font-semibold text-on-surface-variant uppercase">
                  Rol
                </th>
                <th className="text-left p-4 text-sm font-semibold text-on-surface-variant uppercase">
                  Equipo
                </th>
                <th className="text-left p-4 text-sm font-semibold text-on-surface-variant uppercase">
                  Estado
                </th>
                <th className="text-right p-4 text-sm font-semibold text-on-surface-variant uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low/50"
                >
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-on-surface">{user.name}</p>
                      <p className="text-sm text-on-surface-variant">{user.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                        user.role === "ADMIN"
                          ? "bg-error/10 text-error"
                          : user.role === "CLOSER"
                          ? "bg-secondary/10 text-secondary"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-on-surface-variant">
                    {user.role === "SETTER" && user.closer
                      ? `Closer: ${user.closer.name}`
                      : user.role === "CLOSER"
                      ? `${user._count?.setters || 0} setters`
                      : "—"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`w-2 h-2 rounded-full inline-block mr-2 ${
                        user.isActive ? "bg-primary" : "bg-error"
                      }`}
                    />
                    {user.isActive ? "Activo" : "Inactivo"}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 rounded-lg hover:bg-surface-container-high transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-on-surface-variant" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 rounded-lg hover:bg-error-container transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
          <Input
            label={editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required={!editingUser}
          />
          <Select
            label="Rol"
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value })
            }
            options={[
              { value: "SETTER", label: "Setter" },
              { value: "CLOSER", label: "Closer" },
              { value: "ADMIN", label: "Administrador" },
            ]}
          />
          {formData.role === "SETTER" && (
            <Select
              label="Closer asignado"
              value={formData.closerId}
              onChange={(e) =>
                setFormData({ ...formData, closerId: e.target.value })
              }
              options={[
                { value: "", label: "Sin closer" },
                ...closers.map((c) => ({ value: String(c.id), label: c.name })),
              ]}
            />
          )}
          <Input
            label="Teléfono"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-on-surface">
              Usuario activo
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
              {editingUser ? "Guardar" : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
