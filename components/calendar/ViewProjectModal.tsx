'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, MapPin, User, FileText, Package, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HistoryEntry {
  date: string;
  action: string;
  userName: string;
  userId?: number;
  details: string;
}

interface ProjectDetails {
  [key: string]: string | number | boolean | null | undefined;
}

interface VisitDetails {
  id: number;
  stage: string;
  outcome: string | null;
  notes: string | null;
  createdAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  parcel: {
    id: string;
    address: string;
    ownerName: string | null;
    metadata: string | null;
    visitHistory?: {
      id: number;
      visitedAt: string;
      status: string;
      notes: string | null;
          setter: { id: number; name: string };
    }[];
  };
  setter: {
    id: number;
    name: string;
    email: string;
  };
  closer?: {
    id: number;
    name: string;
    email: string;
  } | null;
  bill?: {
    id: number;
    imageUrl: string;
    phone: string;
    clientName: string | null;
    clientEmail: string | null;
    notes: string | null;
  } | null;
  projectDetails?: ProjectDetails & { createdAt?: string };
  projects: {
    projectType: {
      id: number;
      name: string;
    };
  }[];
  objections: {
    objection: {
      id: number;
      name: string;
      color: string;
    };
    notes: string | null;
  }[];
  closerObjections: {
    closerObjection: {
      id: number;
      name: string;
      color: string;
    };
    notes: string | null;
  }[];
}

interface ViewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitId: number | null;
}

export function ViewProjectModal({ isOpen, onClose, visitId }: ViewProjectModalProps) {
  const [visit, setVisit] = useState<VisitDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  useEffect(() => {
    if (isOpen && visitId) {
      fetchVisitDetails();
    }
  }, [isOpen, visitId]);

  const fetchVisitDetails = async () => {
    if (!visitId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/visits/${visitId}/details`);
      const data = await res.json();
      setVisit(data);
    } catch (error) {
      console.error('Error fetching visit details:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildTimeline = (visit: VisitDetails): HistoryEntry[] => {
    const entries: HistoryEntry[] = [];

    if (visit.parcel.visitHistory) {
      for (const h of visit.parcel.visitHistory) {
        let action = 'Visita';
        if (h.status === 'MANUAL_LEAD') action = 'Lead manual';
        else if (h.status === 'NOT_AVAILABLE') action = 'No disponible';
        else if (h.status === 'OBJECTION') action = 'Objeción';

        entries.push({
          date: new Date(h.visitedAt).toLocaleString(),
          action,
          userName: h.setter.name,
          userId: h.setter.id,
          details: h.notes || '',
        });
      }
    }

    const projectNames = visit.projects.map((p) => p.projectType.name).join(', ');

    entries.push({
      date: new Date(visit.createdAt).toLocaleString(),
      action: 'Lead creado',
      userName: visit.setter.name,
      userId: visit.setter.id,
      details: projectNames || '',
    });

    if (visit.bill) {
      entries.push({
        date: new Date(visit.createdAt).toLocaleString(),
        action: 'Propuesta aceptada',
        userName: visit.setter.name,
        userId: visit.setter.id,
        details: projectNames ? `Seleccionó ${projectNames}` : '',
      });
    }

    if (visit.projectDetails?.createdAt) {
      entries.push({
        date: new Date(visit.projectDetails.createdAt).toLocaleString(),
        action: 'Proyecto iniciado',
        userName: visit.closer?.name || visit.setter.name,
        userId: visit.closer?.id || visit.setter.id,
        details: 'Inició elaboración',
      });
    }

    if (visit.completedAt) {
      entries.push({
        date: new Date(visit.completedAt).toLocaleString(),
        action: 'Cerrado',
        userName: visit.closer?.name || visit.setter.name,
        userId: visit.closer?.id || visit.setter.id,
        details: 'Proyecto completado',
      });
    }

    if (visit.cancelledAt) {
      entries.push({
        date: new Date(visit.cancelledAt).toLocaleString(),
        action: 'Cancelado',
        userName: visit.closer?.name || visit.setter.name,
        userId: visit.closer?.id || visit.setter.id,
        details: 'Proyecto cancelado',
      });
    }

    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return entries;
  };

  const getTimelineColor = (action: string): string => {
    if (action === 'Lead creado') return '#3b82f6';
    if (action === 'Propuesta aceptada') return '#22c55e';
    if (action === 'Proyecto iniciado') return '#eab308';
    if (action === 'Cerrado') return '#8b5cf6';
    if (action === 'Cancelado') return '#ef4444';
    if (action === 'Objeción') return '#fb7800';
    if (action === 'No disponible') return '#6b7280';
    return '#6b7280';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Detalles del Proyecto</h2>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'details'
                    ? 'bg-white dark:bg-gray-600 text-primary shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Detalles
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-gray-600 text-primary shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Historial
              </button>
            </div>
          </div>
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
          ) : !visit ? (
            <div className="text-center text-gray-500 py-12">
              No se pudo cargar la información del proyecto
            </div>
          ) : activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Información de la Parcela */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Información de la Parcela
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Dirección
                    </label>
                    <p className="mt-1">{visit.parcel.address}</p>
                  </div>
                  {visit.parcel.ownerName && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Propietario
                      </label>
                      <p className="mt-1">{visit.parcel.ownerName}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Fecha de Creación
                    </label>
                    <p className="mt-1">
                      {new Date(visit.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Estado
                    </label>
                    <p className="mt-1">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                        {visit.stage}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Información del Setter */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Setter
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Nombre
                    </label>
                    <p className="mt-1"><Link href={`/profile/${visit.setter.id}`} className="hover:underline">{visit.setter.name}</Link></p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Email
                    </label>
                    <p className="mt-1">{visit.setter.email}</p>
                  </div>
                </div>
              </div>

              {/* Closer (si existe) */}
              {visit.closer && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Closer
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Nombre
                      </label>
                      <p className="mt-1"><Link href={`/profile/${visit.closer.id}`} className="hover:underline">{visit.closer.name}</Link></p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Email
                      </label>
                      <p className="mt-1">{visit.closer.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Proyectos Seleccionados */}
              {visit.projects.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Proyectos Seleccionados
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {visit.projects.map((p) => (
                      <span
                        key={p.projectType.id}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                      >
                        {p.projectType.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bill (si existe) */}
              {visit.bill && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Recibo de Luz
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visit.bill.clientName && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Cliente
                        </label>
                        <p className="mt-1">{visit.bill.clientName}</p>
                      </div>
                    )}
                    {visit.bill.clientEmail && (
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Email
                        </label>
                        <p className="mt-1">{visit.bill.clientEmail}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Teléfono
                      </label>
                      <p className="mt-1">{visit.bill.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Imagen
                      </label>
                      <div className="mt-1">
                        <a
                          href={visit.bill.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Ver imagen
                        </a>
                      </div>
                    </div>
                  </div>
                  {visit.bill.notes && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Notas
                      </label>
                      <p className="mt-1">{visit.bill.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Objeciones del Setter */}
              {visit.objections.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Objeciones del Setter</h3>
                  <div className="space-y-2">
                    {visit.objections.map((obj, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div
                          className="w-3 h-3 rounded-full mt-1"
                          style={{ backgroundColor: obj.objection.color }}
                        />
                        <div>
                          <p className="font-medium">{obj.objection.name}</p>
                          {obj.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {obj.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Objeciones del Closer */}
              {visit.closerObjections.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">
                    Trabajando con Objeciones (Closer)
                  </h3>
                  <div className="space-y-2">
                    {visit.closerObjections.map((obj, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div
                          className="w-3 h-3 rounded-full mt-1"
                          style={{ backgroundColor: obj.closerObjection.color }}
                        />
                        <div>
                          <p className="font-medium">{obj.closerObjection.name}</p>
                          {obj.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {obj.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detalles del Proyecto (si existen) */}
              {visit.projectDetails && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Detalles del Proyecto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(visit.projectDetails).map(([key, value]) => {
                      if (value && typeof value !== 'object') {
                        return (
                          <div key={key}>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                            <p className="mt-1">{String(value)}</p>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Historial Tab */
            <div className="space-y-0">
              {buildTimeline(visit).length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p>No hay historial disponible</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-600" />
                  <div className="space-y-6">
                    {buildTimeline(visit).map((entry, idx) => (
                      <div key={idx} className="relative pl-10">
                        <div
                          className="absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center border-2"
                          style={{
                            backgroundColor: getTimelineColor(entry.action) + '20',
                            borderColor: getTimelineColor(entry.action),
                          }}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getTimelineColor(entry.action) }}
                          />
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: getTimelineColor(entry.action) + '20',
                                color: getTimelineColor(entry.action),
                              }}
                            >
                              {entry.action}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {entry.date}
                            </span>
                          </div>
                          <p className="text-sm font-medium">
                            {entry.userId ? (
                              <Link href={`/profile/${entry.userId}`} className="hover:underline">{entry.userName}</Link>
                            ) : (
                              entry.userName
                            )}
                          </p>
                          {entry.details && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {entry.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose} className="flex-1">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
