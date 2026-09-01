'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X, MapPin, User, Phone, FileText, Mail, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SlotPicker } from '@/components/calendar/SlotPicker';
import { toast } from 'sonner';
import { useLocale } from '@/lib/locale-context';
import { formatPhoneNumber } from '@/lib/utils';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialAddress?: string;
  initialOwnerName?: string;
}

interface ProjectType {
  id: number;
  name: string;
}

export function CreateLeadModal({ isOpen, onClose, onSuccess, initialAddress, initialOwnerName }: CreateLeadModalProps) {
  const { data: session } = useSession();
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [loadingClosers, setLoadingClosers] = useState(false);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [closers, setClosers] = useState<{id: number, name: string}[]>([]);
  const [selectedCloserId, setSelectedCloserId] = useState("");
  const [selectedScheduleDate, setSelectedScheduleDate] = useState("");
  const [selectedScheduleTime, setSelectedScheduleTime] = useState("");
  const [formData, setFormData] = useState({
    address: '',
    ownerName: '',
    phone: '',
    clientEmail: '',
    notes: '',
  });

  const role = session?.user?.role;
  const userId = session?.user?.id;

  const hasPanelSolar = selectedProjects.some((id) => {
    const pt = projectTypes.find((p) => p.id === id);
    return pt?.name.toLowerCase().includes("panel solar");
  });

  const showCloserDropdown = role === "SETTER_JR" || (role === "SETTER" && hasPanelSolar);
  const autoAssignSelf = role === "CLOSER" || (role === "SETTER" && !hasPanelSolar);
  const effectiveCloserId = autoAssignSelf ? String(userId) : selectedCloserId;

  useEffect(() => {
    if (isOpen) {
      fetchProjectTypes();
      if (role !== "CLOSER") {
        fetchClosers();
      }
      setFormData({
        address: initialAddress || "",
        ownerName: initialOwnerName || "",
        phone: "",
        clientEmail: "",
        notes: "",
      });
      setSelectedScheduleDate("");
      setSelectedScheduleTime("");
    }
  }, [isOpen, initialAddress, initialOwnerName]);

  const fetchProjectTypes = async () => {
    try {
      const res = await fetch('/api/project-types');
      const data = await res.json();
      const filtered = Array.isArray(data)
        ? data.filter((p: ProjectType) => p.name !== "Campos Comunes").sort((a: ProjectType, b: ProjectType) => a.name === "Otros" ? 1 : b.name === "Otros" ? -1 : 0)
        : data;
      setProjectTypes(filtered);
    } catch (error) {
      console.error('Error fetching project types:', error);
    }
  };

  const fetchClosers = async () => {
    setLoadingClosers(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch('/api/closers', { signal: controller.signal });
      clearTimeout(timeoutId);

      const data = await res.json();
      setClosers(data);
      if (data?.length === 1) {
        setSelectedCloserId(String(data[0].id));
      }
    } catch (error) {
      console.error('Error fetching closers:', error);
      setClosers([]);
      if (error instanceof DOMException && error.name === 'AbortError') {
        toast.error('Tiempo de espera agotado al cargar closers');
      } else {
        toast.error('No se pudieron cargar los closers');
      }
    } finally {
      setLoadingClosers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.address.trim()) {
      toast.error("La dirección es requerida");
      setLoading(false);
      return;
    }
    if (showCloserDropdown && !selectedCloserId) {
      toast.error("Selecciona un Closer");
      setLoading(false);
      return;
    }
    if (!selectedScheduleDate || !selectedScheduleTime) {
      toast.error("Selecciona fecha y hora para agendar");
      setLoading(false);
      return;
    }
    if (selectedProjects.length === 0) {
      toast.error("Selecciona al menos un tipo de proyecto");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/leads/create-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          projectTypeIds: selectedProjects,
          closerId: effectiveCloserId || undefined,
          scheduledDate: selectedScheduleDate && selectedScheduleTime
            ? new Date(`${selectedScheduleDate}T${selectedScheduleTime}:00`).toISOString()
            : undefined,
        }),
      });

      if (res.ok) {
        toast.success('Lead creado correctamente');
        onSuccess();
        onClose();
        setFormData({ address: '', ownerName: '', phone: '', clientEmail: '', notes: '' });
        setSelectedProjects([]);
        setSelectedCloserId('');
        setSelectedScheduleDate('');
        setSelectedScheduleTime('');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Error al crear lead');
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Error al crear lead');
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (projectId: number) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">{t.createLeadManual?.title || "Crear Lead Manual"}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="w-4 h-4" />
              {t.chat.address} *
            </label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main St, Orlando, FL 32801"
              required
              maxLength={200}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="w-4 h-4" />
              {t.createLeadManual?.clientName || "Nombre del Cliente"}
            </label>
            <Input
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              placeholder={t.createLeadManual?.clientNamePlaceholder || "Ej: John Doe"}
              minLength={2}
              maxLength={100}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Phone className="w-4 h-4" />
              {t.createLeadManual?.clientPhone || t.visit.phone}
            </label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
              placeholder="(407) 555-0123"
              type="tel"
              inputMode="tel"
              required
              pattern="[0-9\-\+\(\) ]*"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="w-4 h-4" />
              {t.createLeadManual?.clientEmail || t.chat.email}
            </label>
            <Input
              value={formData.clientEmail}
              onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
              placeholder="cliente@ejemplo.com"
              type="email"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4" />
              {t.createLeadManual?.additionalInfo || "Información Adicional"}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t.placeholders.writeNote}
              className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              maxLength={500}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              {t.createLeadManual?.projectType || "Tipo de Proyecto"} *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {projectTypes.map((pt) => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => toggleProject(pt.id)}
                  className={`p-2 text-sm rounded-lg border text-left transition-colors ${
                    selectedProjects.includes(pt.id)
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-primary/50'
                  }`}
                >
                  {pt.name}
                </button>
              ))}
            </div>
            {selectedProjects.length === 0 && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Selecciona al menos uno
              </p>
            )}
          </div>

          {role === "SETTER" && hasPanelSolar && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">
                Este lead será asignado al closer con capacidades de panel solar.
              </p>
            </div>
          )}

          {showCloserDropdown && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4" />
                Closer *
              </label>
              <select
                value={selectedCloserId}
                onChange={(e) => setSelectedCloserId(e.target.value)}
                disabled={loadingClosers}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">
                  {loadingClosers ? t.common.loading : t.visit.selectCloser}
                </option>
                {closers.map((closer) => (
                  <option key={closer.id} value={closer.id}>
                    {closer.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {effectiveCloserId && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {t.createLeadManual?.visitDate || "Fecha de Visita"} *
              </label>
              <SlotPicker
                userId={Number(effectiveCloserId)}
                selectedDate={selectedScheduleDate || undefined}
                selectedTime={selectedScheduleTime || undefined}
                onSelect={(date, time) => {
                  setSelectedScheduleDate(date);
                  setSelectedScheduleTime(time);
                }}
              />
            </div>
          )}

          {/* Botones dentro del form para que sean visibles en movil */}
          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white dark:bg-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.address || !selectedScheduleDate || !selectedScheduleTime}
              className="flex-1"
            >
              {loading ? (t.createLeadManual?.submitting || 'Creando...') : (t.createLeadManual?.submit || 'Crear Lead y Agendar')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

