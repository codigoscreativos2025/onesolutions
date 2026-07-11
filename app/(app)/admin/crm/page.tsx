'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, Download, Eye, MapPin, Clock, Calendar, AlertCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ViewProjectModal } from '@/components/calendar/ViewProjectModal';

interface ProjectDetails {
  [key: string]: string | number | boolean | null | undefined;
}

interface Objection {
  objection: { id: number; name: string; color: string };
}

interface CloserObjection {
  closerObjection: { id: number; name: string; color: string };
}

interface Visit {
  id: number;
  stage: string;
  outcome: string | null;
  createdAt: string;
  completedAt: string | null;
  scheduledAt: string | null;
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
  projects: {
    projectType: {
      id: number;
      name: string;
    };
  }[];
  projectDetails: ProjectDetails | null;
  objections: Objection[];
  closerObjections: CloserObjection[];
  bill?: { imageUrl?: string; additionalFileUrl?: string; additionalFileName?: string } | null;
  chatRoom?: { id: number } | null;
  daysSinceActivity?: number;
  daysRemaining?: number;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
  lastActivityAt?: string | null;
}

export default function AdminCRMPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterSetter, setFilterSetter] = useState<string>('all');
  const [filterProjectType, setFilterProjectType] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterObjectionType, setFilterObjectionType] = useState<string>('all');
  const [filterObjectionId, setFilterObjectionId] = useState<string>('all');
  const [isViewProjectModalOpen, setIsViewProjectModalOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    const filterParam = searchParams.get('filter');
    const setterIdParam = searchParams.get('setterId');
    const closerIdParam = searchParams.get('closerId');

    if (filterParam === 'doors') setFilterStage('IN_PROGRESS');
    if (filterParam === 'leads') setFilterStage('PROPOSAL_ACCEPTED');
    if (filterParam === 'projects') setFilterStage('CLOSED');
    if (filterParam === 'objections') setFilterStage('all');
    if (filterParam === 'objections') setFilterObjectionType('setter');
    if (setterIdParam) setFilterSetter(setterIdParam);
    if (closerIdParam) setFilterSetter(closerIdParam);

    fetchVisits();
  }, [session, router, searchParams]);

  const fetchVisits = async () => {
    try {
      const res = await fetch('/api/admin/crm/visits');
      const data = await res.json();

      const enriched = data.map((v: Visit) => {
        const createdAt = new Date(v.createdAt);
        const now = new Date();
        const daysSince = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, 30 - daysSince);
        return {
          ...v,
          daysSinceActivity: daysSince,
          daysRemaining,
          isExpiringSoon: daysRemaining <= 5 && daysRemaining > 0,
          isExpired: daysRemaining === 0,
          lastActivityAt: v.completedAt || v.scheduledAt || v.createdAt,
        };
      });

      setVisits(enriched);
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Colecciones para filtros
  const setters = Array.from(new Set(visits.map((v) => v.setter.id))).map((id) => {
    const visit = visits.find((v) => v.setter.id === id);
    return { id, name: visit?.setter.name || 'Unknown' };
  });

  const setterObjectionTypes = Array.from(
    new Set(visits.flatMap(v => v.objections.map(o => o.objection.id)))
  ).map(id => {
    const objection = visits.find(v => v.objections.some(o => o.objection.id === id))?.objections.find(o => o.objection.id === id);
    return { id, name: objection?.objection.name || 'Unknown' };
  });

  const closerObjectionTypes = Array.from(
    new Set(visits.flatMap(v => v.closerObjections.map(o => o.closerObjection.id)))
  ).map(id => {
    const objection = visits.find(v => v.closerObjections.some(o => o.closerObjection.id === id))?.closerObjections.find(o => o.closerObjection.id === id);
    return { id, name: objection?.closerObjection.name || 'Unknown' };
  });

  const filteredVisits = visits.filter((visit) => {
    const matchesSearch = visit.parcel.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.setter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (visit.closer?.name.toLowerCase().includes(searchTerm.toLowerCase()) || '');

    const matchesStage = filterStage === 'all' || visit.stage === filterStage;
    const matchesSetter = filterSetter === 'all' || visit.setter.id.toString() === filterSetter;

    const matchesProjectType = filterProjectType === 'all' ||
      visit.projects.some(p => p.projectType?.id?.toString() === filterProjectType);

    const visitDate = new Date(visit.createdAt);
    const matchesDateFrom = !filterDateFrom || visitDate >= new Date(filterDateFrom);
    const matchesDateTo = !filterDateTo || visitDate <= new Date(filterDateTo + 'T23:59:59.999Z');

    // Filtro de objeciones
    let matchesObjection = true;
    if (filterObjectionType === 'setter' && filterObjectionId !== 'all') {
      matchesObjection = visit.objections.some(o => o.objection.id.toString() === filterObjectionId);
    } else if (filterObjectionType === 'closer' && filterObjectionId !== 'all') {
      matchesObjection = visit.closerObjections.some(o => o.closerObjection.id.toString() === filterObjectionId);
    } else if (filterObjectionType === 'setter' && filterObjectionId === 'all') {
      matchesObjection = visit.objections.length > 0;
    } else if (filterObjectionType === 'closer' && filterObjectionId === 'all') {
      matchesObjection = visit.closerObjections.length > 0;
    }

    return matchesSearch && matchesStage && matchesSetter && matchesProjectType && matchesDateFrom && matchesDateTo && matchesObjection;
  });

  const handleExport = () => {
    const csv = [
      ['ID', 'Dirección', 'Setter', 'Closer', 'Estado', 'Fecha Creación', 'Última Actividad', 'Días Restantes', 'Proyectos', 'Objeciones Setter', 'Objeciones Closer'].join(','),
      ...filteredVisits.map((v) => [
        v.id,
        v.parcel.address,
        v.setter.name,
        v.closer?.name || 'N/A',
        v.stage,
        new Date(v.createdAt).toLocaleString(),
        v.lastActivityAt ? new Date(v.lastActivityAt).toLocaleString() : 'N/A',
        v.daysRemaining?.toString() || 'N/A',
        v.projects.map((p) => p.projectType?.name || '').join('; '),
        v.objections.map(o => o.objection.name).join('; '),
        v.closerObjections.map(o => o.closerObjection.name).join('; '),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleViewDetails = (visitId: number) => {
    setSelectedVisitId(visitId);
    setIsViewProjectModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">CRM - Administración Completa</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestión completa de leads, puertas tocadas, visitas y proyectos. Haz clic en cualquier fila para ver detalles.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Búsqueda</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por dirección, setter o closer..."
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Estado</label>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
            >
              <option value="all">Todos</option>
              <option value="IN_PROGRESS">En Progreso (Puerta Tocada)</option>
              <option value="PROPOSAL_ACCEPTED">Propuesta Aceptada (Lead)</option>
              <option value="CLOSED">Cerrado (Proyecto)</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Setter</label>
            <select
              value={filterSetter}
              onChange={(e) => setFilterSetter(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
            >
              <option value="all">Todos</option>
              {setters.map((setter) => (
                <option key={setter.id} value={setter.id}>{setter.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Tipo de Proyecto</label>
            <select
              value={filterProjectType}
              onChange={(e) => setFilterProjectType(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
            >
              <option value="all">Todos</option>
              {Array.from(new Set(visits.flatMap(v => v.projects.map(p => p.projectType)))).map((pt) => (
                <option key={pt.id} value={pt.id}>{pt.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Tipo de Objeción</label>
            <select
              value={filterObjectionType}
              onChange={(e) => {
                setFilterObjectionType(e.target.value);
                setFilterObjectionId('all');
              }}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
            >
              <option value="all">Todos</option>
              <option value="setter">Objeciones Setter</option>
              <option value="closer">Objeciones Closer</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Objeción Específica</label>
            <select
              value={filterObjectionId}
              onChange={(e) => setFilterObjectionId(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
              disabled={filterObjectionType === 'all'}
            >
              <option value="all">Todas</option>
              {filterObjectionType === 'setter' && setterObjectionTypes.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
              {filterObjectionType === 'closer' && closerObjectionTypes.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Fecha Desde</label>
            <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Fecha Hasta</label>
            <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface" />
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Mostrando {filteredVisits.length} de {visits.length} visitas
          </p>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-5 h-5 mr-2" /> Exportar CSV
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dirección</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Setter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Closer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Creado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Última Actividad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tiempo Restante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Proyectos / Objeciones</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredVisits.map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => handleViewDetails(visit.id)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{visit.parcel.address}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{visit.setter.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{visit.closer?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      visit.stage === 'CLOSED' ? 'bg-green-100 text-green-800' :
                      visit.stage === 'PROPOSAL_ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {visit.stage === 'IN_PROGRESS' ? 'Puerta Tocada' : visit.stage === 'PROPOSAL_ACCEPTED' ? 'Lead' : 'Proyecto'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(visit.createdAt).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {visit.lastActivityAt ? (
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(visit.lastActivityAt).toLocaleString()}</div>
                    ) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {visit.stage === 'IN_PROGRESS' && visit.daysRemaining !== undefined ? (
                      <div className="flex items-center gap-1">
                        {visit.isExpired ? (
                          <span className="flex items-center gap-1 text-red-600 text-sm font-medium"><AlertCircle className="w-3 h-3" /> Expirada</span>
                        ) : visit.isExpiringSoon ? (
                          <span className="flex items-center gap-1 text-yellow-600 text-sm font-medium"><AlertCircle className="w-3 h-3" /> {visit.daysRemaining}d</span>
                        ) : (
                          <span className="text-sm text-gray-600">{visit.daysRemaining} días</span>
                        )}
                      </div>
                    ) : <span className="text-sm text-gray-500">—</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {visit.projects.slice(0, 2).map((p, idx) => (
                        <span key={idx} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">{p.projectType?.name || 'N/A'}</span>
                      ))}
                      {visit.objections.length > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">{visit.objections.length} obj.</span>
                      )}
                      {visit.closerObjections.length > 0 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{visit.closerObjections.length} obj. closer</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {visit.chatRoom && (
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push('/chat'); }}>
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleViewDetails(visit.id); }}>
                        <Eye className="w-4 h-4 mr-1" /> Ver
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVisits.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No se encontraron visitas con los filtros aplicados</p>
          </div>
        )}
      </div>

      <ViewProjectModal
        isOpen={isViewProjectModalOpen}
        onClose={() => setIsViewProjectModalOpen(false)}
        visitId={selectedVisitId}
      />
    </div>
  );
}
