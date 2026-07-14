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
  const [commonFields, setCommonFields] = useState<ProjectTypeField[]>([]);

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
        // Merge bill data into projectDetails for pre-filling general info
        setProjectDetails({
          ...details,
          clientName: details.clientName || bill.clientName || '',
          clientEmail: details.clientEmail || bill.clientEmail || '',
          address: details.address || data.parcel?.address || '',
          phone: bill.phone || '',
        });
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommonFields = async () => {
    try {
      const typesRes = await fetch("/api/project-types");
      const types = await typesRes.json();
      const comunes = types.find((t: { id: number; name: string }) => t.name === "Campos Comunes");
      if (comunes) {
        const fieldsRes = await fetch(`/api/admin/project-type-fields?projectTypeId=${comunes.id}`);
        const fields = await fieldsRes.json();
        setCommonFields(fields);
      }
    } catch (error) {
      console.error("Error fetching common fields:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCommonFields();
    }
  }, [isOpen]);

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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
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
              {/* Información General */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Información General</h3>
                <Input
                  label="Nombre del Cliente"
                  value={projectDetails.clientName as string || ''}
                  onChange={(e) => handleFieldChange('clientName', e.target.value)}
                />
                <Input
                  label="Email del Cliente"
                  type="email"
                  value={projectDetails.clientEmail as string || ''}
                  onChange={(e) => handleFieldChange('clientEmail', e.target.value)}
                />
                <Input
                  label="Dirección"
                  value={projectDetails.address as string || ''}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                />
                <Input
                  label="Fecha de Cierre"
                  type="date"
                  value={projectDetails.closingDate ? new Date(projectDetails.closingDate as string).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFieldChange('closingDate', e.target.value)}
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Método de Pago
                  </label>
                  <select
                    value={projectDetails.paymentMethod as string || ''}
                    onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="cheque">Cheque</option>
                    <option value="financiamiento">Financiamiento</option>
                    <option value="tarjeta de credito">Tarjeta de Crédito</option>
                  </select>
                </div>
              </div>

              {/* Panel Solar */}
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg">Panel Solar</h3>
                <Input
                  label="Financiadora"
                  value={projectDetails.solarFinancier as string || ''}
                  onChange={(e) => handleFieldChange('solarFinancier', e.target.value)}
                />
                <Input
                  label="Tamaño del Sistema"
                  value={projectDetails.systemSize as string || ''}
                  onChange={(e) => handleFieldChange('systemSize', e.target.value)}
                />
              </div>

              {/* Comisiones */}
              <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-lg">Comisiones</h3>
                <Input
                  label="Representante Principal"
                  value={projectDetails.primaryRep as string || ''}
                  onChange={(e) => handleFieldChange('primaryRep', e.target.value)}
                />
                <Input
                  label="Comisión (%)"
                  type="number"
                  value={projectDetails.primaryRepCommPct as number || ''}
                  onChange={(e) => handleFieldChange('primaryRepCommPct', parseFloat(e.target.value) || null)}
                />
              </div>

              {/* Campos Comunes */}
              {commonFields.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-lg">Campos Comunes</h3>
                  {commonFields.map((field) => (
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
                      ) : field.fieldType === "date" ? (
                        <Input
                          label={field.fieldLabel}
                          type="date"
                          value={projectDetails[field.fieldName] ? new Date(projectDetails[field.fieldName] as string).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
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
