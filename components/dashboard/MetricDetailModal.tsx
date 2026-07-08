'use client';

import { useEffect, useState } from 'react';
import { X, Calendar, MapPin, User, FileText, Filter } from 'lucide-react';

interface Visit {
  id: number;
  createdAt: string;
  stage: string;
  outcome: string | null;
  notes: string | null;
  parcel: {
    id: string;
    address: string;
  };
  setter: {
    id: number;
    name: string;
  };
  closer?: {
    id: number;
    name: string;
  } | null;
  objections: {
    objection: {
      name: string;
      color: string;
    };
  }[];
}

interface MetricDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: 'doors' | 'leads' | 'projects' | 'objections' | null;
  userId?: number;
}

export function MetricDetailModal({ isOpen, onClose, metricType, userId }: MetricDetailModalProps) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  useEffect(() => {
    if (isOpen && metricType) {
      fetchVisits();
    }
  }, [isOpen, metricType, userId, filterStartDate, filterEndDate]);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (metricType) params.append('type', metricType);
      if (userId) params.append('userId', userId.toString());
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);

      const res = await fetch(`/api/visits/details?${params}`);
      const data = await res.json();
      setVisits(data);
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
  };

  if (!isOpen) return null;

  const getTitle = () => {
    switch (metricType) {
      case 'doors':
        return 'Puertas Tocadas';
      case 'leads':
        return 'Leads Generados';
      case 'projects':
        return 'Proyectos Cerrados';
      case 'objections':
        return 'Objeciones';
      default:
        return 'Detalles';
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'IN_PROGRESS':
        return 'En Progreso';
      case 'PROPOSAL_ACCEPTED':
        return 'Propuesta Aceptada';
      case 'CLOSED':
        return 'Cerrado';
      default:
        return stage;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PROPOSAL_ACCEPTED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'CLOSED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">{getTitle()}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filtros */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtrar por fecha</span>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Desde</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Hasta</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              No hay datos disponibles
            </div>
          ) : (
            <div className="space-y-4">
              {visits.map((visit) => (
                <div
                  key={visit.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  {/* Header de la visita */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <h3 className="font-semibold">{visit.parcel.address}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(visit.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(visit.stage)}`}>
                      {getStageLabel(visit.stage)}
                    </span>
                  </div>

                  {/* Información del setter y closer */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">Setter:</span>
                      <span className="font-medium">{visit.setter.name}</span>
                    </div>
                    {visit.closer && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">Closer:</span>
                        <span className="font-medium">{visit.closer.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Objeciones */}
                  {visit.objections.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Objeciones:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {visit.objections.map((obj, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              backgroundColor: obj.objection.color + '20',
                              color: obj.objection.color,
                            }}
                          >
                            {obj.objection.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notas */}
                  {visit.notes && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <FileText className="w-4 h-4 inline mr-1" />
                      {visit.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
