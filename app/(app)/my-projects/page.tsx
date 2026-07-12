'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageSquare, CheckCircle, Edit, MapPin, XCircle, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ViewProjectModal } from '@/components/calendar/ViewProjectModal';
import { EditProjectModal } from '@/components/calendar/EditProjectModal';

interface ProjectDetails {
  [key: string]: string | number | boolean | null | undefined;
}

interface ObjectionData {
  objection: { name: string; color: string };
}

interface CloserObjectionData {
  closerObjection: { name: string; color: string };
}

interface Visit {
  id: number;
  stage: string;
  createdAt: string;
  completedAt: string | null;
  chatCreatedAt: string | null;
  parcel: { id: string; address: string };
  setter: { name: string };
  closer?: { name: string };
  projects: { projectType: { name: string } }[];
  projectDetails: ProjectDetails | null;
  objections: ObjectionData[];
  closerObjections: CloserObjectionData[];
  chatRoom?: { id: number } | null;
  bill?: {
    imageUrl?: string;
    clientName?: string;
    phone?: string;
    clientEmail?: string;
    additionalFileUrl?: string;
    additionalFileName?: string;
  } | null;
}

export default function MyProjectsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter') || 'all';

  const validFilters = ['all', 'leads', 'objections', 'project', 'closed', 'cancelled'];
  const filter = validFilters.includes(filterParam) ? filterParam : 'all';

  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isViewProjectModalOpen, setIsViewProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);

  const calculateCompletion = (projectDetails: ProjectDetails | null): number => {
    if (!projectDetails) return 0;
    const requiredFields = ['clientName', 'clientEmail', 'address', 'closingDate', 'paymentMethod'];
    let completed = 0;
    requiredFields.forEach(field => {
      if (projectDetails[field] && projectDetails[field] !== '') completed++;
    });
    return Math.round((completed / requiredFields.length) * 100);
  };

  useEffect(() => {
    if (session?.user?.role === 'SETTER') {
      router.push('/dashboard');
      return;
    }
    fetchProjects();
  }, [session, router, filter]);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`/api/visits/my-projects?filter=${filter}`);
      const data = await res.json();
      setVisits(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
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

  const setFilter = (f: string) => {
    router.push(`/my-projects?filter=${f}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'PROPOSAL_ACCEPTED': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Lead</span>;
      case 'PROJECT': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">En Proyecto</span>;
      case 'CLOSED': return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Cerrado</span>;
      case 'CANCELLED': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Cancelado</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{stage}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mis Proyectos</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona tus leads, proyectos en curso, cerrados y cancelados
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Todos ({visits.length})</button>
        <button onClick={() => setFilter('leads')} className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${filter === 'leads' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}><User className="w-4 h-4" /> Leads</button>
        <button onClick={() => setFilter('objections')} className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${filter === 'objections' ? 'bg-secondary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}><XCircle className="w-4 h-4" /> Objeciones</button>
        <button onClick={() => setFilter('project')} className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${filter === 'project' ? 'bg-yellow-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}><FileText className="w-4 h-4" /> Proyecto</button>
        <button onClick={() => setFilter('closed')} className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${filter === 'closed' ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}><CheckCircle className="w-4 h-4" /> Cerrados</button>
        <button onClick={() => setFilter('cancelled')} className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${filter === 'cancelled' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}><XCircle className="w-4 h-4" /> Cancelados</button>
      </div>

      {visits.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No se encontraron proyectos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((visit) => {
            const completion = calculateCompletion(visit.projectDetails);
            const hasChat = visit.chatRoom || visit.chatCreatedAt;
            return (
              <div key={visit.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4"
                style={{
                  borderLeftColor:
                    visit.stage === 'CANCELLED' ? '#ef4444' :
                    visit.stage === 'CLOSED' ? '#8b5cf6' :
                    visit.stage === 'PROJECT' ? '#eab308' :
                    visit.stage === 'PROPOSAL_ACCEPTED' ? '#22c55e' :
                    '#6b7280'
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-gray-500" />
                      <h3 className="text-lg font-semibold">{visit.parcel.address}</h3>
                      {getStageBadge(visit.stage)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>Setter: {visit.setter.name}</span>
                      {visit.closer && <span>Closer: {visit.closer.name}</span>}
                      <span>Creado: {new Date(visit.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewProject(visit.id)}>Ver</Button>
                    {visit.stage !== 'CANCELLED' && (
                      <Button variant="outline" size="sm" onClick={() => handleEditProject(visit.id)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {hasChat && (
                      <Button variant="outline" size="sm" onClick={() => router.push('/chat')}>
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {visit.projects.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {visit.projects.map((p, idx) => (
                      <span key={idx} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">{p.projectType.name}</span>
                    ))}
                  </div>
                )}

                {visit.objections.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-gray-500">Objeciones Setter: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {visit.objections.map((o, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: o.objection.color + '20', color: o.objection.color }}>{o.objection.name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {visit.closerObjections.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-gray-500">Objeciones Proyecto: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {visit.closerObjections.map((o, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: o.closerObjection.color + '20', color: o.closerObjection.color }}>{o.closerObjection.name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {visit.stage === 'PROJECT' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Progreso de información</span>
                      <span>{completion}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${completion === 100 ? 'bg-green-500' : completion >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>
                )}

                {(visit.stage === 'CLOSED' || visit.stage === 'PROPOSAL_ACCEPTED') && visit.bill?.clientName && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                    <span className="font-medium">{visit.bill.clientName}</span>
                    {visit.bill.phone && <span className="ml-3 text-gray-500">{visit.bill.phone}</span>}
                    {visit.bill.clientEmail && <span className="ml-3 text-gray-500">{visit.bill.clientEmail}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ViewProjectModal isOpen={isViewProjectModalOpen} onClose={() => setIsViewProjectModalOpen(false)} visitId={selectedVisitId} />
      <EditProjectModal isOpen={isEditProjectModalOpen} onClose={() => setIsEditProjectModalOpen(false)} visitId={selectedVisitId} onSuccess={fetchProjects} />
    </div>
  );
}
