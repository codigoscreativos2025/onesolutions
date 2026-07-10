'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, User, Phone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
  const [loading, setLoading] = useState(false);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    address: '',
    ownerName: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchProjectTypes();
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
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
        setFormData({ address: '', ownerName: '', phone: '', notes: '' });
        setSelectedProjects([]);
      }
    } catch (error) {
      console.error('Error creating lead:', error);
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

          {/* Botones dentro del form para que sean visibles en móvil */}
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
