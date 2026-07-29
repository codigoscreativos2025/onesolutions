'use client';

import { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ProjectDetails {
  [key: string]: string | number | boolean | null | undefined;
}

interface ProjectTypeField {
  id: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  options?: string;
  isRequired: boolean;
  order: number;
}

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitId: number | null;
  onSuccess: () => void;
}

export function EditProjectModal({ isOpen, onClose, visitId, onSuccess }: EditProjectModalProps) {
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projectFields, setProjectFields] = useState<{ typeName: string; fields: ProjectTypeField[] }[]>([]);

  useEffect(() => {
    if (isOpen && visitId) {
      fetchProjectDetails();
    }
  }, [isOpen, visitId]);

  const fetchProjectDetails = async () => {
    if (!visitId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/visits/${visitId}/details`);
      if (res.ok) {
        const data = await res.json();
        const bill = data.bill || {};
        const details = data.projectDetails || {};
        setProjectDetails({
          ...details,
          clientName: details.clientName || bill.clientName || '',
          clientEmail: details.clientEmail || bill.clientEmail || '',
          address: details.address || data.parcel?.address || '',
          phone: bill.phone || '',
        });

        // Fetch project type fields for all selected project types
        if (data.projects?.length > 0) {
          fetchProjectTypeFields(data.projects.map((p: { projectType: { id: number; name: string } }) => p.projectType));
        } else {
          // Fallback: fetch all fields for all project types
          fetchAllProjectFields();
        }
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectTypeFields = async (projectTypes: { id: number; name: string }[]) => {
    try {
      const fieldsByType = await Promise.all(
        projectTypes.map(async (pt) => {
          const res = await fetch(`/api/admin/project-type-fields?projectTypeId=${pt.id}`);
          const fields = await res.json();
          return { typeName: pt.name, fields: Array.isArray(fields) ? fields : [] };
        })
      );
      setProjectFields(fieldsByType);
    } catch (error) {
      console.error("Error fetching project type fields:", error);
    }
  };

  const fetchAllProjectFields = async () => {
    try {
      const typesRes = await fetch("/api/project-types");
      const types = await typesRes.json();
      if (Array.isArray(types)) {
        const fieldsByType = await Promise.all(
          types.map(async (t: { id: number; name: string }) => {
            const res = await fetch(`/api/admin/project-type-fields?projectTypeId=${t.id}`);
            const fields = await res.json();
            return { typeName: t.name, fields: Array.isArray(fields) ? fields : [] };
          })
        );
        setProjectFields(fieldsByType.filter(f => f.fields.length > 0));
      }
    } catch (error) {
      console.error("Error fetching all project fields:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjectDetails();
    }
  }, [isOpen, visitId]);

  const handleSave = async () => {
    if (!visitId) return;
    
    setSaving(true);
    try {
      const cleanDetails = { ...projectDetails };
      delete cleanDetails.phone;
      const res = await fetch('/api/project-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitId,
          ...cleanDetails,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Error saving project details:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (key: string, value: string | number | boolean | null) => {
    setProjectDetails({
      ...projectDetails,
      [key]: value,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-y-auto pb-20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">Editar Información del Proyecto</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Campos Comunes — siempre visibles */}
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg">Campos Comunes</h3>
                <Input label="Nombre del Cliente" value={projectDetails.clientName as string || ''} onChange={(e) => handleFieldChange('clientName', e.target.value)} />
                <Input label="Email del Cliente" type="email" value={projectDetails.clientEmail as string || ''} onChange={(e) => handleFieldChange('clientEmail', e.target.value)} />
                <Input label="Dirección" value={projectDetails.address as string || ''} onChange={(e) => handleFieldChange('address', e.target.value)} />
                <Input label="Fecha de Cierre" type="date" 
                  value={projectDetails.closingDate ? new Date(projectDetails.closingDate as string).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFieldChange('closingDate', e.target.value)}
                  min="1900-01-01" max="2100-12-31" />
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Método de Pago</label>
                  <select value={projectDetails.paymentMethod as string || ''} onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface">
                    <option value="">Seleccionar...</option>
                    {["Cash","Transferencia","Cheques","LightReach","SkyLight","SunGage","Sunrise Capital","Foundations Finance","Otro"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Campos dinámicos por tipo de proyecto */}
              {projectFields.filter(g => g.fields.length > 0).map((group) => {
                const isCommonGroup = group.typeName === "Campos Comunes";
                const hardcodedKeys = ["clientName","clientEmail","address","closingDate","paymentMethod"];
                const visibleFields = isCommonGroup
                  ? group.fields.filter(f => !hardcodedKeys.includes(f.fieldName))
                  : group.fields;
                if (visibleFields.length === 0) return null;
                return (
                <div key={group.typeName} className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-lg">{group.typeName}</h3>
                  {group.fields.map((field) => (
                    <div key={field.id}>
                      {field.fieldType === "select" ? (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                            {field.fieldLabel}
                          </label>
                          <select
                            value={projectDetails[field.fieldName] as string || ''}
                            onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                            className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
                          >
                            <option value="">Seleccionar...</option>
                            {field.options && JSON.parse(field.options).map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      ) : field.fieldType === "file" || field.fieldType === "photos" ? (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                            {field.fieldLabel}
                          </label>
                          <input
                            type="file"
                            accept={field.fieldType === "photos" ? "image/*" : undefined}
                            multiple={field.fieldType === "photos"}
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (!files || files.length === 0) return;
                              const urls: string[] = [];
                              for (let i = 0; i < files.length; i++) {
                                const formData = new FormData();
                                formData.append("file", files[i]);
                                try {
                                  const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                                  const uploadData = await uploadRes.json();
                                  urls.push(uploadData.url);
                                } catch {}
                              }
                              if (field.fieldType === "photos") {
                                const existing = projectDetails[field.fieldName];
                                let existingArr: string[] = [];
                                if (existing) {
                                  try { existingArr = JSON.parse(existing as string); } catch { existingArr = [existing as string]; }
                                }
                                handleFieldChange(field.fieldName, JSON.stringify([...existingArr, ...urls]));
                              } else {
                                handleFieldChange(field.fieldName, urls[0]);
                              }
                            }}
                            className="w-full text-sm text-on-surface file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-on-primary file:text-xs file:font-medium hover:file:opacity-90"
                          />
                          {projectDetails[field.fieldName] && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {(() => {
                                const val = projectDetails[field.fieldName] as string;
                                let urls: string[] = [];
                                if (val.startsWith("[")) {
                                  try { urls = JSON.parse(val); } catch { urls = [val]; }
                                } else {
                                  urls = [val];
                                }
                                return urls.map((url, i) => (
                                  <div key={i} className="relative group flex items-center gap-1">
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                                      <img src={url} alt="" className="h-10 w-10 object-cover rounded border hover:border-primary" title="Abrir en nueva pestaña" />
                                    </a>
                                    <button
                                      onClick={() => {
                                        const newUrls = urls.filter((_, j) => j !== i);
                                        handleFieldChange(field.fieldName, field.fieldType === "photos" ? JSON.stringify(newUrls) : "");
                                      }}
                                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                    >x</button>
                                  </div>
                                ));
                              })()}
                            </div>
                          )}
                        </div>
                      ) : field.fieldType === "date" ? (
                        <Input
                          label={field.fieldLabel}
                          type="date"
                          value={projectDetails[field.fieldName] ? new Date(projectDetails[field.fieldName] as string).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                          min="1900-01-01"
                          max="2100-12-31"
                          onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Fecha fuera de rango")}
                          onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                        />
                      ) : field.fieldType === "number" ? (
                        <Input
                          label={field.fieldLabel}
                          type="number"
                          value={projectDetails[field.fieldName] as string || ''}
                          onChange={(e) => handleFieldChange(field.fieldName, parseFloat(e.target.value) || null)}
                        />
                      ) : (
                        <Input
                          label={field.fieldLabel}
                          value={projectDetails[field.fieldName] as string || ''}
                          onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              );  })}
              {projectFields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay campos configurados para este proyecto.</p>
                  <p className="text-sm">Selecciona un tipo de proyecto en Admin {">"} Campos de Proyectos.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || loading} className="flex-1">
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
