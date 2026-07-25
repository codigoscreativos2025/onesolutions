"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Plus, Pencil, Trash2, Loader2, Save, Info, Image } from "lucide-react";

interface ProjectType {
  id: number;
  name: string;
}

interface ProjectTypeField {
  id: number;
  projectTypeId: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  options?: string;
  isRequired: boolean;
  order: number;
  projectType?: ProjectType;
}

export default function AdminProjectFieldsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [selectedProjectType, setSelectedProjectType] = useState<number | null>(null);
  const [fields, setFields] = useState<ProjectTypeField[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<ProjectTypeField | null>(null);
  const [formData, setFormData] = useState({
    fieldName: "",
    fieldLabel: "",
    fieldType: "text",
    options: "",
    isRequired: false,
    order: 0,
  });
  const [photoMax, setPhotoMax] = useState(10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchProjectTypes();
  }, [session, router]);

  useEffect(() => {
    if (selectedProjectType !== null) {
      fetchFields();
    }
  }, [selectedProjectType]);

  const fetchProjectTypes = async () => {
    try {
      const res = await fetch("/api/project-types");
      const data = await res.json();
      setProjectTypes(data);
      if (data.length > 0) {
        setSelectedProjectType(data[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFields = async () => {
    if (!selectedProjectType) return;
    
    try {
      const res = await fetch(`/api/admin/project-type-fields?projectTypeId=${selectedProjectType}`);
      const data = await res.json();
      setFields(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectType) return;

    setSaving(true);
    try {
      const url = editingField
        ? `/api/admin/project-type-fields/${editingField.id}`
        : "/api/admin/project-type-fields";
      const method = editingField ? "PATCH" : "POST";

      const body: Record<string, unknown> = {
        ...formData,
        projectTypeId: selectedProjectType,
      };

      if (formData.fieldType === "photos") {
        body.options = { multiple: true, max: photoMax };
      } else if (formData.fieldType === "select" && formData.options) {
        body.options = formData.options.split(",").map(o => o.trim());
      } else {
        body.options = null;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingField(null);
        resetForm();
        fetchFields();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (field: ProjectTypeField) => {
    setEditingField(field);
    let optionsVal = "";

    if (field.fieldType === "photos" && field.options) {
      try {
        const parsed = JSON.parse(field.options);
        setPhotoMax(parsed.max || 10);
      } catch {
        setPhotoMax(10);
      }
    } else if (field.options) {
      try {
        const parsed = JSON.parse(field.options);
        if (Array.isArray(parsed)) {
          optionsVal = parsed.join(", ");
        }
      } catch {
        // ignore
      }
    }

    setFormData({
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      options: optionsVal,
      isRequired: field.isRequired,
      order: field.order,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este campo?")) return;

    try {
      const res = await fetch(`/api/admin/project-type-fields/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchFields();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      fieldName: "",
      fieldLabel: "",
      fieldType: "text",
      options: "",
      isRequired: false,
      order: 0,
    });
    setPhotoMax(10);
  };

  const openCreateModal = () => {
    setEditingField(null);
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
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">
          Campos de Proyectos
        </h1>
        <p className="text-on-surface-variant">
          Configura los campos personalizados para cada tipo de proyecto. Selecciona &quot;Campos Comunes&quot; para definir campos obligatorios que aplican a todos los proyectos.
        </p>
      </div>

      <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-primary flex items-start gap-3">
        <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-on-surface mb-1">Campos Comunes</h3>
          <p className="text-sm text-on-surface-variant">
            Para definir campos que se compartan entre todos los tipos de proyecto, crea un tipo de proyecto llamado <strong>&quot;Campos Comunes&quot;</strong> desde la secci&oacute;n de configuraci&oacute;n de tipos de proyecto. Los campos definidos en ese tipo ser&aacute;n visibles en todos los proyectos nuevos.
          </p>
        </div>
      </div>

      {/* Selector de Tipo de Proyecto */}
      <div className="glass-panel p-4 rounded-2xl">
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          Tipo de Proyecto
        </label>
        <select
          value={selectedProjectType || ""}
          onChange={(e) => setSelectedProjectType(parseInt(e.target.value))}
          className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface mt-1"
        >
          {projectTypes.map((pt) => (
            <option key={pt.id} value={pt.id}>
              {pt.name}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de Campos */}
      <div className="flex justify-between items-center">
        <h2 className="font-headline text-lg font-bold text-on-surface">
          Campos Configurados
        </h2>
        <Button onClick={openCreateModal}>
          <Plus className="w-5 h-5" />
          Nuevo Campo
        </Button>
      </div>

      <div className="space-y-3">
        {fields.map((field) => (
          <div
            key={field.id}
            className="glass-panel p-4 rounded-xl flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-on-surface">
                  {field.fieldLabel}
                </span>
                {field.fieldType === "photos" ? (
                  <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-xs rounded-full flex items-center gap-1">
                    <Image className="w-3 h-3" />
                    Fotos
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface-variant text-xs rounded-full">
                    {field.fieldType}
                  </span>
                )}
                {field.isRequired && (
                  <span className="px-2 py-0.5 bg-error/10 text-error text-xs rounded-full">
                    Requerido
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant mt-1">
                {field.fieldName} • Orden: {field.order}
              </p>
              {field.options && (
                <p className="text-xs text-on-surface-variant mt-1">
                  {field.fieldType === "photos"
                    ? `Máx. fotos: ${JSON.parse(field.options).max || 10}`
                    : `Opciones: ${JSON.parse(field.options).join(", ")}`}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(field)}
                className="p-2 rounded-lg hover:bg-surface-container-high transition-colors"
              >
                <Pencil className="w-4 h-4 text-on-surface-variant" />
              </button>
              <button
                onClick={() => handleDelete(field.id)}
                className="p-2 rounded-lg hover:bg-error-container transition-colors"
              >
                <Trash2 className="w-4 h-4 text-error" />
              </button>
            </div>
          </div>
        ))}
        {fields.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant">
            <p>No hay campos configurados para este tipo de proyecto</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingField ? "Editar Campo" : "Nuevo Campo"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre del Campo (sin espacios)"
            value={formData.fieldName}
            onChange={(e) => setFormData({ ...formData, fieldName: e.target.value.replace(/\s/g, "_") })}
            placeholder="ej: nombre_cliente"
            required
            minLength={2}
            maxLength={50}
          />
          <Input
            label="Etiqueta (nombre visible)"
            value={formData.fieldLabel}
            onChange={(e) => setFormData({ ...formData, fieldLabel: e.target.value })}
            placeholder="ej: Nombre del Cliente"
            required
          />
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Tipo de Campo
            </label>
            <select
              value={formData.fieldType}
              onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface mt-1"
            >
              <option value="text">Texto</option>
              <option value="number">Número</option>
              <option value="select">Selección</option>
              <option value="date">Fecha</option>
              <option value="file">Archivo</option>
              <option value="photos">Fotos (multi-upload)</option>
            </select>
          </div>
          {formData.fieldType === "select" && (
            <Input
              label="Opciones (separadas por coma)"
              value={formData.options}
              onChange={(e) => setFormData({ ...formData, options: e.target.value })}
              placeholder="ej: Opción 1, Opción 2, Opción 3"
            />
          )}
          {formData.fieldType === "photos" && (
            <Input
              label="Máximo de fotos"
              type="number"
              value={photoMax}
              onChange={(e) => setPhotoMax(parseInt(e.target.value) || 10)}
              min={1}
              max={50}
            />
          )}
          <Input
            label="Orden"
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
            min={0}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRequired"
              checked={formData.isRequired}
              onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <label htmlFor="isRequired" className="text-on-surface">
              Campo requerido
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
            <Button type="submit" className="flex-1" isLoading={saving}>
              <Save className="w-5 h-5 mr-2" />
              {editingField ? "Guardar" : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
