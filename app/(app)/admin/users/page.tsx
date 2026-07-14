"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
  locationValidationEnabled: boolean;
  closerId?: number;
  closer?: { id: number; name: string };
  setters?: { id: number; name: string }[];
  _count?: { setters: number };
  profile?: {
    ssn?: string;
    dateOfBirth?: string;
    bankName?: string;
    routingNumber?: string;
    zelle?: string;
    address?: string;
    profilePhoto?: string;
  };
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "SETTER",
    closerId: "",
    phone: "",
    isActive: true,
    ssn: "",
    dateOfBirth: "",
    bankName: "",
    routingNumber: "",
    zelle: "",
    address: "",
  });

  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const closers = users.filter((u) => u.role === "CLOSER");

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

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

      const withProfiles = await Promise.all(
        data.map(async (u: User) => {
          const profileRes = await fetch(`/api/profile/${u.id}`);
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            return { ...u, profile: profileData };
          }
          return u;
        })
      );

      setUsers(withProfiles);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let profilePhotoUrl = editingUser?.profile?.profilePhoto || "";

      if (profilePhotoFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", profilePhotoFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          profilePhotoUrl = uploadData.url;
        }
      }

      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : "/api/admin/users";
      const method = editingUser ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          profilePhoto: profilePhotoUrl || undefined,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingUser(null);
        setProfilePhotoFile(null);
        setProfilePhotoPreview(null);
        resetForm();
        fetchUsers();
      }
    } finally {
      setSubmitting(false);
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
      ssn: user.profile?.ssn || "",
      dateOfBirth: user.profile?.dateOfBirth
        ? new Date(user.profile.dateOfBirth).toISOString().split("T")[0]
        : "",
      bankName: user.profile?.bankName || "",
      routingNumber: user.profile?.routingNumber || "",
      zelle: user.profile?.zelle || "",
      address: user.profile?.address || "",
    });
    setProfilePhotoFile(null);
    setProfilePhotoPreview(user.profile?.profilePhoto || null);
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

  const handleToggleLocationValidation = async (userId: number, enabled: boolean) => {
    const res = await fetch(`/api/admin/users/${userId}/location-validation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationValidationEnabled: !enabled }),
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
      ssn: "",
      dateOfBirth: "",
      bankName: "",
      routingNumber: "",
      zelle: "",
      address: "",
    });
  };

  const openCreateModal = () => {
    setEditingUser(null);
    resetForm();
    setProfilePhotoFile(null);
    setProfilePhotoPreview(null);
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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
          >
            <option value="all">Todos los roles</option>
            <option value="SETTER">Setter</option>
            <option value="CLOSER">Closer</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
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
                <th className="text-left p-4 text-sm font-semibold text-on-surface-variant uppercase">
                  Validaci&oacute;n GPS
                </th>
                <th className="text-right p-4 text-sm font-semibold text-on-surface-variant uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low/50"
                >
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-on-surface">{user.name}</p>
                      <p className="text-sm text-on-surface-variant">{user.email}</p>
                      {user.phone && (
                        <p className="text-xs text-on-surface-variant">Tel: {user.phone}</p>
                      )}
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
                      ? user.setters && user.setters.length > 0
                        ? <div className="flex flex-col gap-1">{user.setters.map(s => <span key={s.id} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full w-fit">{s.name}</span>)}</div>
                        : "0 setters"
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
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleLocationValidation(user.id, user.locationValidationEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        user.locationValidationEnabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          user.locationValidationEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
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
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col items-center gap-2">
            {profilePhotoPreview ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-outline-variant">
                <Image
                  src={profilePhotoPreview}
                  alt="Foto de perfil"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-surface-container-low border-2 border-outline-variant flex items-center justify-center text-on-surface-variant text-sm">
                Sin foto
              </div>
            )}
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => fileInputRef.current?.click()}
            >
              {profilePhotoPreview ? "Cambiar foto" : "Subir foto"}
            </button>
            {profilePhotoPreview && (
              <button
                type="button"
                className="text-xs text-error hover:underline"
                onClick={() => {
                  setProfilePhotoFile(null);
                  setProfilePhotoPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Eliminar foto
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label={editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!editingUser}
          />
          <Select
            label="Rol"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, closerId: e.target.value })}
              options={[
                { value: "", label: "Sin closer" },
                ...closers.map((c) => ({ value: String(c.id), label: c.name })),
              ]}
            />
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h3 className="font-semibold text-sm text-on-surface mb-3">Información Adicional</h3>
            <div className="space-y-3">
              <Input
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <Input
                label="Dirección"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <Input
                label="Fecha de Nacimiento"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
              <Input
                label="SSN (Social Security Number)"
                value={formData.ssn}
                onChange={(e) => setFormData({ ...formData, ssn: e.target.value })}
                placeholder="XXX-XX-XXXX"
              />
              <Input
                label="Nombre del Banco"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              />
              <Input
                label="Routing Number"
                value={formData.routingNumber}
                onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
              />
              <Input
                label="Zelle / Account Number"
                value={formData.zelle}
                onChange={(e) => setFormData({ ...formData, zelle: e.target.value })}
              />
            </div>
            <p className="text-xs text-on-surface-variant mt-2">
              Estos datos son privados. Solo el usuario y el administrador pueden verlos desde el perfil.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
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
            <Button type="submit" className="flex-1" isLoading={submitting}>
              {editingUser ? "Guardar" : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
