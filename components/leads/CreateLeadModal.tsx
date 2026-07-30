'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X, MapPin, User, Phone, FileText, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

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
  const [loading, setLoading] = useState(false);
  const [loadingClosers, setLoadingClosers] = useState(false);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [closers, setClosers] = useState<{id: number, name: string}[]>([]);
  const [selectedCloserId, setSelectedCloserId] = useState("");
  const [slots, setSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [formData, setFormData] = useState({
    address: '',
    ownerName: '',
    phone: '',
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
        notes: "",
      });
      setSelectedDay("");
      setSelectedSlot(null);
      setSlots([]);
    }
  }, [isOpen, initialAddress, initialOwnerName]);

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
      if (data?.length === 1) {
        setSelectedCloserId(String(data[0].id));
      }
    } catch (error) {
      console.error('Error fetching closers:', error);
      setClosers([]);
      toast.error('No se pudieron cargar los closers');
    } finally {
      setLoadingClosers(false);
    }
  };

  const fetchSlots = async (closerId: string) => {
    setSlotsLoading(true);
    setSelectedDay("");
    setSelectedSlot(null);
    try {
      const res = await fetch(`/api/slots?closerId=${closerId}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data || []);
      }
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && effectiveCloserId) {
      fetchSlots(effectiveCloserId);
    }
  }, [isOpen, effectiveCloserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (showCloserDropdown && !selectedCloserId) {
      toast.error("Selecciona un Closer");
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
          scheduledDate: selectedSlot ? new Date(selectedSlot.startAt).toISOString() : undefined,
        }),
      });

      if (res.ok) {
        toast.success('Lead creado correctamente');
        onSuccess();
        onClose();
        setFormData({ address: '', ownerName: '', phone: '', notes: '' });
        setSelectedProjects([]);
        setSelectedCloserId('');
        setSelectedDay('');
        setSelectedSlot(null);
        setSlots([]);
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
                  {loadingClosers ? 'Cargando closers...' : 'Seleccionar closer...'}
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
                Fecha de Visita (opcional)
              </label>
              {slotsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <MiniCalendar
                  slots={slots}
                  selectedDay={selectedDay}
                  selectedSlot={selectedSlot}
                  onSelectDay={setSelectedDay}
                  onSelectSlot={setSelectedSlot}
                />
              )}
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

function MiniCalendar({
  slots,
  selectedDay,
  selectedSlot,
  onSelectDay,
  onSelectSlot,
}: {
  slots: any[];
  selectedDay: string;
  selectedSlot: any;
  onSelectDay: (day: string) => void;
  onSelectSlot: (slot: any) => void;
}) {
  const availableSlots = slots.filter((s: any) => !s.isBooked);
  const slotsByDate: Record<string, any[]> = {};
  availableSlots.forEach((s: any) => {
    const d = s.startAt.split("T")[0];
    (slotsByDate[d] ??= []).push(s);
  });

  const toDateKey = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const dayLabels = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

  const next14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {next14Days.map((day, i) => {
          const key = toDateKey(day);
          const hasSlots = (slotsByDate[key] || []).length > 0;
          const isSelected = selectedDay === key;
          return (
            <button
              key={i}
              type="button"
              disabled={!hasSlots}
              onClick={() => onSelectDay(key)}
              className={`flex-shrink-0 w-16 py-2 rounded-lg border text-center transition-all ${
                !hasSlots
                  ? 'border-gray-200 dark:border-gray-700 opacity-40 cursor-not-allowed'
                  : isSelected
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
              }`}
            >
              <div className="text-xs font-medium">{dayLabels[day.getDay()]}</div>
              <div className="text-sm font-bold">{day.getDate()}</div>
            </button>
          );
        })}
      </div>

      {selectedDay && slotsByDate[selectedDay] && slotsByDate[selectedDay].length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            Horarios para {new Date(selectedDay + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
          <div className="flex flex-wrap gap-2">
            {slotsByDate[selectedDay].map((s: any) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSlot(s)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  selectedSlot?.id === s.id
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-primary/50'
                }`}
              >
                {new Date(s.startAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedDay && (!slotsByDate[selectedDay] || slotsByDate[selectedDay].length === 0) && (
        <p className="text-sm text-gray-400 text-center py-2">No hay horarios disponibles para este dia</p>
      )}

      {selectedSlot && (
        <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date(selectedSlot.startAt).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })} a las{' '}
            {new Date(selectedSlot.startAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}
    </div>
  );
}
