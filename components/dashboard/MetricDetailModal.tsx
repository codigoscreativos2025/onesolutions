'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Calendar, MapPin, User, FileText, Filter, MessageSquare, AlertCircle } from 'lucide-react';
import { ContractModal } from '@/components/quote/ContractModal';

interface ProjectType {
  id: number;
  name: string;
}

interface BillData {
  imageUrl?: string;
  phone?: string;
  clientName?: string;
  clientEmail?: string;
  notes?: string;
  additionalFileUrl?: string;
  additionalFileName?: string;
}

interface SlotData {
  startAt?: string;
  endAt?: string;
}

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
  closerObjections?: {
    closerObjection: {
      name: string;
      color: string;
    };
  }[];
  bill?: BillData | null;
  projects?: { projectType: ProjectType }[];
  projectDetails?: Record<string, unknown> | null;
  slot?: SlotData | null;
  chatRoom?: { id: number } | null;
}

interface MetricDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: 'doors' | 'leads' | 'potential' | 'parcels' | 'closed' | 'cancelled' | null;
  userId?: number;
}

export function MetricDetailModal({ isOpen, onClose, metricType, userId }: MetricDetailModalProps) {
  const router = useRouter();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractVisitId, setContractVisitId] = useState<number | null>(null);

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
      case 'parcels':
        return 'Parcelas';
      case 'leads':
        return 'Leads';
      case 'potential':
        return 'Leads Potenciales';
      case 'closed':
        return 'Proyectos Cerrados';
      case 'cancelled':
        return 'Proyectos Cancelados';
      default:
        return 'Detalles';
    }
  };

  const getCompletionPercentage = (details: Record<string, unknown> | null | undefined): number => {
    if (!details) return 0;
    const fields = Object.entries(details).filter(
      ([key]) => !['id', 'visitId', 'createdAt', 'updatedAt', 'panelsUp', 'panelsDown'].includes(key)
    );
    if (fields.length === 0) return 0;
    const filled = fields.filter(([, val]) => val !== null && val !== undefined && val !== '' && val !== false);
    return Math.round((filled.length / fields.length) * 100);
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'IN_PROGRESS':
        return 'En Progreso';
      case 'PROPOSAL_ACCEPTED':
        return 'Propuesta Aceptada';
      case 'PROJECT':
        return 'Proyecto';
      case 'CLOSED':
        return 'Cerrado';
      case 'CANCELLED':
        return 'Cancelado';
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
      case 'PROJECT':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'CLOSED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContractVisitId(visit.id);
                            setShowContractModal(true);
                          }}
                          className="ml-auto p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Documentos"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
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
                      <span className="text-gray-600 dark:text-gray-400">Trainee:</span>
                      <Link href={`/profile/${visit.setter.id}`} className="font-medium hover:underline">{visit.setter.name}</Link>
                    </div>
                    {visit.closer && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">Closer:</span>
                        <Link href={`/profile/${visit.closer.id}`} className="font-medium hover:underline">{visit.closer.name}</Link>
                      </div>
                    )}
                  </div>

                  {/* Objeciones de Setter */}
                  {visit.objections.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Objeciones de Trainee:
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

                  {/* Objeciones de Closer */}
                  {visit.closerObjections && visit.closerObjections.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Objeciones de Closer:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {visit.closerObjections.map((obj, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              backgroundColor: obj.closerObjection.color + '20',
                              color: obj.closerObjection.color,
                            }}
                          >
                            {obj.closerObjection.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Proyectos seleccionados */}
                  {visit.projects && visit.projects.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Proyectos:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {visit.projects.map((p, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary"
                          >
                            {p.projectType.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Información del cliente (Bill) */}
                  {visit.bill && (
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Datos del Cliente:
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {visit.bill.clientName && (
                          <div>
                            <span className="text-gray-500">Nombre:</span>{' '}
                            <span className="font-medium">{visit.bill.clientName}</span>
                          </div>
                        )}
                        {visit.bill.phone && (
                          <div>
                            <span className="text-gray-500">Teléfono:</span>{' '}
                            <span className="font-medium">{visit.bill.phone}</span>
                          </div>
                        )}
                        {visit.bill.clientEmail && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Email:</span>{' '}
                            <span className="font-medium">{visit.bill.clientEmail}</span>
                          </div>
                        )}
                      </div>
                      {visit.bill.imageUrl && (
                        <a
                          href={visit.bill.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-xs text-primary underline"
                        >
                          Ver recibo de luz
                        </a>
                      )}
                      {visit.bill.additionalFileUrl && (
                        <a
                          href={visit.bill.additionalFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-xs text-secondary underline ml-3"
                        >
                          {visit.bill.additionalFileName || 'Ver archivo adicional'}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Cita agendada */}
                  {visit.slot?.startAt && (
                    <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Cita: {new Date(visit.slot.startAt).toLocaleString()}
                    </div>
                  )}

                  {/* Progreso del Closer (ProjectDetails) */}
                  {visit.projectDetails && (
                    <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Progreso del Closer:
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(visit.projectDetails).map(([key, val]) => {
                          if (key === 'id' || key === 'visitId' || key === 'createdAt' || key === 'updatedAt') return null;
                          if (!val) return null;
                          const label = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, (s) => s.toUpperCase());
                          return (
                            <div key={key}>
                              <span className="text-gray-500">{label}:</span>{' '}
                              <span className="font-medium">
                                {typeof val === 'boolean' ? (val ? 'Sí' : 'No') : String(val)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Chat / Progress para proyectos cerrados */}
                  {visit.stage === 'CLOSED' && (
                    <div className="mb-3">
                      {visit.chatRoom ? (
                        <button
                          onClick={() => router.push('/chat')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Ir al Chat
                        </button>
                      ) : (
                        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                              Datos pendientes del Closer
                            </span>
                          </div>
                          <div className="w-full bg-yellow-200 dark:bg-yellow-700 rounded-full h-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full transition-all"
                              style={{ width: `${getCompletionPercentage(visit.projectDetails)}%` }}
                            />
                          </div>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            {getCompletionPercentage(visit.projectDetails)}% completado
                          </p>
                        </div>
                      )}
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

      <ContractModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        visitId={contractVisitId!}
      />
    </div>
  );
}
