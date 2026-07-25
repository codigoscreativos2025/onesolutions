'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageSquare, CheckCircle, Edit, MapPin, XCircle, User, DoorOpen, Filter, CheckCheck, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ViewProjectModal } from '@/components/calendar/ViewProjectModal';
import { EditProjectModal } from '@/components/calendar/EditProjectModal';
import { ContractModal } from '@/components/quote/ContractModal';

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
  finalizedAt: string | null;
  parcel: { id: string; address: string; ownerName: string | null };
  setter: { id: number; name: string };
  closer?: { id: number; name: string };
  projects: { projectType: { id: number; name: string } }[];
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

  const validFilters = ['all', 'leads', 'closed', 'cancelled'];
  const filter = validFilters.includes(filterParam) ? filterParam : 'all';

  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isViewProjectModalOpen, setIsViewProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [ownerNameFilter, setOwnerNameFilter] = useState<string>('');
  const [addressFilter, setAddressFilter] = useState<string>('');
  const [projectTypes, setProjectTypes] = useState<{ id: number; name: string }[]>([]);

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
    if (session?.user?.role === 'SETTER' || session?.user?.role === 'SETTER_JR') {
      router.push('/dashboard');
      return;
    }
    fetchProjects();
    fetchProjectTypes();
  }, [session, router, filter]);

  const fetchProjectTypes = async () => {
    try {
      const res = await fetch('/api/project-types');
      if (res.ok) {
        const data = await res.json();
        setProjectTypes(data);
      }
    } catch (error) {
      console.error('Error fetching project types:', error);
    }
  };

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

  const filteredVisits = visits.filter((visit) => {
    const matchesProjectType = projectTypeFilter === 'all' ||
      visit.projects.some(p => p.projectType.id === Number(projectTypeFilter));

    const visitDate = new Date(visit.createdAt);
    const matchesDateFrom = !dateFrom || visitDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || visitDate <= new Date(dateTo + 'T23:59:59.999Z');

    const matchesOwnerName = !ownerNameFilter ||
      (visit.parcel.ownerName || '').toLowerCase().includes(ownerNameFilter.toLowerCase()) ||
      (visit.bill?.clientName || '').toLowerCase().includes(ownerNameFilter.toLowerCase());

    const matchesAddress = !addressFilter ||
      visit.parcel.address.toLowerCase().includes(addressFilter.toLowerCase());

    return matchesProjectType && matchesDateFrom && matchesDateTo && matchesOwnerName && matchesAddress;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStageBadge = (visit: Visit) => {
    if (visit.stage === 'CLOSED' && visit.finalizedAt) {
      return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">Finalizado</span>;
    }
    switch (visit.stage) {
      case 'PROPOSAL_ACCEPTED': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Leads Potenciales</span>;
      case 'PROJECT': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">En Proyecto</span>;
      case 'CLOSED': return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Cerrado</span>;
      case 'CANCELLED': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Cancelado</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{visit.stage}</span>;
    }
  };

  const handleFinalize = async (visitId: number) => {
    try {
      const res = await fetch(`/api/visits/${visitId}/finalize`, { method: 'PATCH' });
      if (res.ok) {
        const updated = await res.json();
        setVisits(prev => prev.map(v => v.id === visitId ? { ...v, finalizedAt: updated.finalizedAt } : v));
      }
    } catch (error) {
      console.error('Error finalizing project:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Leads Potenciales</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona tus leads, proyectos en curso, cerrados y cancelados
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>Todos ({visits.length})</button>
        <button onClick={() => setFilter('leads')} className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${filter === 'leads' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}><User className="w-4 h-4" /> Leads Potenciales</button>
        <button onClick={() => setFilter('closed')} className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${filter === 'closed' ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}><CheckCircle className="w-4 h-4" /> Cerrados</button>
        <button onClick={() => setFilter('cancelled')} className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${filter === 'cancelled' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}><XCircle className="w-4 h-4" /> Cancelados</button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex flex-wrap gap-4 items-end">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtros</span>
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Tipo de Proyecto</label>
          <select
            value={projectTypeFilter}
            onChange={(e) => setProjectTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface text-sm"
          >
            <option value="all">Todos</option>
            {projectTypes.map((pt) => (
              <option key={pt.id} value={pt.id}>{pt.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Fecha Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Fecha Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Propietario / Cliente</label>
          <input
            type="text"
            value={ownerNameFilter}
            onChange={(e) => setOwnerNameFilter(e.target.value)}
            placeholder="Buscar..."
            className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface text-sm w-44"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Dirección</label>
          <input
            type="text"
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            placeholder="Buscar..."
            className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface text-sm w-44"
          />
        </div>
      </div>

      {filteredVisits.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No se encontraron proyectos</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVisits.map((visit) => {
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
                      {getStageBadge(visit)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>Trainee:{' '}
                        <Link href={`/profile/${visit.setter.id}`} className="hover:underline">
                          {visit.setter.name}
                        </Link>
                      </span>
                      {visit.closer && (
                        <span>Closer:{' '}
                          <Link href={`/profile/${visit.closer.id}`} className="hover:underline">
                            {visit.closer.name}
                          </Link>
                        </span>
                      )}
                      <span>Creado: {new Date(visit.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/visit/${visit.parcel.id}?mode=closer`)} title="Visitar">
                      <DoorOpen className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleViewProject(visit.id)}>Ver</Button>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedVisitId(visit.id); setShowContractModal(true); }} title="Documentos">
                      <FileText className="w-4 h-4" />
                    </Button>
                    {visit.stage !== 'CANCELLED' && (
                      <Button variant="outline" size="sm" onClick={() => handleEditProject(visit.id)} title="Editar Proyecto">
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {hasChat && (
                      <Button variant="outline" size="sm" onClick={() => router.push('/chat')} title="Chat">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    )}
                    {visit.stage === 'CLOSED' && !visit.finalizedAt && session?.user?.role === "ADMIN" && (
                      <Button variant="outline" size="sm" onClick={() => handleFinalize(visit.id)} className="text-emerald-600 border-emerald-300 hover:bg-emerald-50" title="Finalizar Proyecto">
                        <CheckCheck className="w-4 h-4" />
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
                    <span className="text-xs font-medium text-gray-500">Objeciones Trainee: </span>
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
      <ContractModal isOpen={showContractModal} onClose={() => setShowContractModal(false)} visitId={selectedVisitId!} />
    </div>
  );
}
