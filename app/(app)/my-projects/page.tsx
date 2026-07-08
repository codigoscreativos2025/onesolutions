'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MessageSquare, CheckCircle, AlertCircle, Edit } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ViewProjectModal } from '@/components/calendar/ViewProjectModal';
import { EditProjectModal } from '@/components/calendar/EditProjectModal';

interface ProjectDetails {
  [key: string]: string | number | boolean | null | undefined;
}

interface Visit {
  id: number;
  stage: string;
  createdAt: string;
  completedAt: string | null;
  chatCreatedAt: string | null;
  parcel: {
    id: string;
    address: string;
  };
  setter: {
    name: string;
  };
  projects: {
    projectType: {
      name: string;
    };
  }[];
  projectDetails: ProjectDetails | null;
}

export default function MyProjectsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingChat, setCreatingChat] = useState<number | null>(null);
  const [isViewProjectModalOpen, setIsViewProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);

  // Función para calcular el porcentaje de completitud
  const calculateCompletion = (projectDetails: ProjectDetails | null): number => {
    if (!projectDetails) return 0;

    const requiredFields = [
      'clientName',
      'clientEmail',
      'address',
      'closingDate',
      'paymentMethod',
    ];

    let completed = 0;
    requiredFields.forEach(field => {
      if (projectDetails[field] && projectDetails[field] !== '') {
        completed++;
      }
    });

    return Math.round((completed / requiredFields.length) * 100);
  };

  useEffect(() => {
    if (session?.user?.role === 'SETTER') {
      router.push('/dashboard');
      return;
    }
    fetchProjects();
  }, [session, router]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/visits/my-projects');
      const data = await res.json();
      setVisits(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChat = async (visitId: number) => {
    setCreatingChat(visitId);
    try {
      const res = await fetch(`/api/visits/${visitId}/create-chat`, {
        method: 'POST',
      });

      if (res.ok) {
        fetchProjects();
      } else {
        const error = await res.json();
        alert(error.error || 'Error creating chat');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Error creating chat');
    } finally {
      setCreatingChat(null);
    }
  };

  const handleViewProject = (visitId: number) => {
    setSelectedVisitId(visitId);
    setIsViewProjectModalOpen(true);
  };

  const handleEditProject = (visitId: number) => {
    setSelectedVisitId(visitId);
    setIsEditProjectModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingProjects = visits.filter((v) => v.stage === 'CLOSED' && !v.chatCreatedAt);
  const completedProjects = visits.filter((v) => v.chatCreatedAt);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mis Proyectos</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona tus proyectos cerrados y crea chats cuando la información esté completa
        </p>
      </div>

      {/* Proyectos Pendientes de Chat */}
      {pendingProjects.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Pendientes de Chat ({pendingProjects.length})
          </h2>
          <div className="space-y-4">
            {pendingProjects.map((visit) => (
              <div
                key={visit.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 border-yellow-500"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {visit.parcel.address}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>Setter: {visit.setter.name}</span>
                      <span>
                        Cerrado:{' '}
                        {visit.completedAt
                          ? new Date(visit.completedAt).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProject(visit.id)}
                    >
                      Ver Detalles
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleCreateChat(visit.id)}
                      disabled={creatingChat === visit.id}
                    >
                      {creatingChat === visit.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Crear Chat
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Proyectos Seleccionados */}
                {visit.projects.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Proyectos:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {visit.projects.map((p, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                        >
                          {p.projectType.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estado de Project Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      {visit.projectDetails ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-600 dark:text-green-400">
                            Información del proyecto cargada
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-600 dark:text-red-400">
                            Falta completar la información del proyecto
                          </span>
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProject(visit.id)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </div>

                  {/* Barra de Progreso */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Progreso de información</span>
                      <span>{calculateCompletion(visit.projectDetails)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          calculateCompletion(visit.projectDetails) === 100
                            ? 'bg-green-500'
                            : calculateCompletion(visit.projectDetails) >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${calculateCompletion(visit.projectDetails)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proyectos con Chat Creado */}
      {completedProjects.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Proyectos con Chat ({completedProjects.length})
          </h2>
          <div className="space-y-4">
            {completedProjects.map((visit) => (
              <div
                key={visit.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 border-green-500"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {visit.parcel.address}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>Setter: {visit.setter.name}</span>
                      <span>
                        Chat creado:{' '}
                        {visit.chatCreatedAt
                          ? new Date(visit.chatCreatedAt).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewProject(visit.id)}
                  >
                    Ver Detalles
                  </Button>
                </div>

                {/* Proyectos Seleccionados */}
                {visit.projects.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Proyectos:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {visit.projects.map((p, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                        >
                          {p.projectType.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {visits.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No tienes proyectos cerrados aún
          </p>
        </div>
      )}

      {/* Modal de Ver Proyecto */}
      <ViewProjectModal
        isOpen={isViewProjectModalOpen}
        onClose={() => setIsViewProjectModalOpen(false)}
        visitId={selectedVisitId}
      />

      {/* Modal de Editar Proyecto */}
      <EditProjectModal
        isOpen={isEditProjectModalOpen}
        onClose={() => setIsEditProjectModalOpen(false)}
        visitId={selectedVisitId}
        onSuccess={fetchProjects}
      />
    </div>
  );
}
