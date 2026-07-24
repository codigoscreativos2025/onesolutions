'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X, MapPin, User, Phone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProjectType {
  id: number;
  name: string;
}

export function CreateLeadModal({ isOpen, onClose, onSuccess }: CreateLeadModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [loadingClosers, setLoadingClosers] = useState(false);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [closers, setClosers] = useState<{id: number, name: string}[]>([]);
  const [selectedCloserId, setSelectedCloserId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [formData, setFormData] = useState({
    address: '',
    ownerName: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchProjectTypes();
      fetchClosers();
    }
  }, [isOpen]);

  const fetchProjectTypes = async () => {
    try {
      const res = await fetch('/api/project-types');
      const data = await res.json();
      setProjectTypes(data);
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
      if (session?.user?.role === 'CLOSER') {
        setSelectedCloserId(String(session.user.id));
      }
    } catch (error) {
      console.error('Error fetching closers:', error);
      setClosers([]);
      toast.error('No se pudieron cargar los closers');
    } finally {
      setLoadingClosers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/leads/create-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          projectTypeIds: selectedProjects,
          closerId: selectedCloserId || undefined,
          scheduledDate: scheduledDate ? new Date(scheduledDate + "T" + (scheduledTime || "00:00")).toISOString() : undefined,
        }),
      });

      if (res.ok) {
        toast.success('Lead creado correctamente');
        onSuccess();
        onClose();
        setFormData({ address: '', ownerName: '', phone: '', notes: '' });
        setSelectedProjects([]);
        setSelectedCloserId('');
        setScheduledDate('');
        setScheduledTime('');
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
          <h2 className="text-2xl font-bold">Crear Lead Manual</h2>
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
              Dirección *
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
              Nombre del Dueño
            </label>
            <Input
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              placeholder="John Doe"
              minLength={2}
              maxLength={100}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Phone className="w-4 h-4" />
              Teléfono
            </label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(407) 555-0123"
              type="tel"
              inputMode="tel"
              pattern="[0-9\-\+\(\) ]*"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4" />
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Información adicional sobre el lead..."
              className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              maxLength={500}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Proyectos
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {projectTypes.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => toggleProject(project.id)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    selectedProjects.includes(project.id)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  {project.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="w-4 h-4" />
              Closer (opcional)
            </label>
            <select
              value={selectedCloserId}
              onChange={(e) => setSelectedCloserId(e.target.value)}
              disabled={loadingClosers}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">
                {loadingClosers ? 'Cargando closers...' : 'Seleccionar closer...'}
              </option>
              {closers.map((closer) => (
                <option key={closer.id} value={closer.id}>
                  {closer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Fecha de Visita (opcional)
            </label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min="1900-01-01"
                max="2100-12-31"
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Fecha fuera de rango")}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                className="flex-1"
              />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Botones dentro del form para que sean visibles en movil */}
          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white dark:bg-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.address}
              className="flex-1"
            >
              {loading ? 'Creando...' : 'Crear Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
