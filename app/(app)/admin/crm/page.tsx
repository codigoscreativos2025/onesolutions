'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Download, Eye, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ViewProjectModal } from '@/components/calendar/ViewProjectModal';

interface ProjectDetails {
  [key: string]: string | number | boolean | null | undefined;
}

interface Visit {
  id: number;
  stage: string;
  outcome: string | null;
  createdAt: string;
  completedAt: string | null;
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
      name: string;
    };
  }[];
  projectDetails: ProjectDetails | null;
}

export default function AdminCRMPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterSetter, setFilterSetter] = useState<string>('all');
  const [isViewProjectModalOpen, setIsViewProjectModalOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchVisits();
  }, [session, router]);

  const fetchVisits = async () => {
    try {
      const res = await fetch('/api/admin/crm/visits');
      const data = await res.json();
      setVisits(data);
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVisits = visits.filter((visit) => {
    const matchesSearch = visit.parcel.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visit.setter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (visit.closer?.name.toLowerCase().includes(searchTerm.toLowerCase()) || '');
    
    const matchesStage = filterStage === 'all' || visit.stage === filterStage;
    const matchesSetter = filterSetter === 'all' || visit.setter.id.toString() === filterSetter;

    return matchesSearch && matchesStage && matchesSetter;
  });

  const handleExport = () => {
    const csv = [
      ['ID', 'Dirección', 'Setter', 'Closer', 'Estado', 'Fecha Creación', 'Fecha Completado', 'Proyectos'].join(','),
      ...filteredVisits.map((v) => [
        v.id,
        v.parcel.address,
        v.setter.name,
        v.closer?.name || 'N/A',
        v.stage,
        new Date(v.createdAt).toLocaleDateString(),
        v.completedAt ? new Date(v.completedAt).toLocaleDateString() : 'N/A',
        v.projects.map((p) => p.projectType.name).join('; '),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleViewDetails = (visitId: number) => {
    setSelectedVisitId(visitId);
    setIsViewProjectModalOpen(true);
  };

  const setters = Array.from(new Set(visits.map((v) => v.setter.id))).map((id) => {
    const visit = visits.find((v) => v.setter.id === id);
    return { id, name: visit?.setter.name || 'Unknown' };
  });

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
        <h1 className="text-3xl font-bold mb-2">CRM - Administración de Proyectos</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona todos los proyectos, leads y visitas de la plataforma
        </p>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              Búsqueda
            </label>
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
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              Estado
            </label>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
            >
              <option value="all">Todos</option>
              <option value="IN_PROGRESS">En Progreso</option>
              <option value="PROPOSAL_ACCEPTED">Propuesta Aceptada</option>
              <option value="CLOSED">Cerrado</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              Setter
            </label>
            <select
              value={filterSetter}
              onChange={(e) => setFilterSetter(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface"
            >
              <option value="all">Todos</option>
              {setters.map((setter) => (
                <option key={setter.id} value={setter.id}>
                  {setter.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Mostrando {filteredVisits.length} de {visits.length} visitas
          </p>
          <Button onClick={handleExport} variant="outline">
            <Download className="w-5 h-5 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Tabla de Visitas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Dirección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Setter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Closer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Proyectos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredVisits.map((visit) => (
                <tr 
                  key={visit.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleViewDetails(visit.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {visit.parcel.address}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {visit.setter.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {visit.closer?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      visit.stage === 'CLOSED'
                        ? 'bg-green-100 text-green-800'
                        : visit.stage === 'PROPOSAL_ACCEPTED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {visit.stage === 'IN_PROGRESS' && 'En Progreso'}
                      {visit.stage === 'PROPOSAL_ACCEPTED' && 'Propuesta Aceptada'}
                      {visit.stage === 'CLOSED' && 'Cerrado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {visit.projects.slice(0, 2).map((p, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                        >
                          {p.projectType.name}
                        </span>
                      ))}
                      {visit.projects.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                          +{visit.projects.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(visit.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(visit.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredVisits.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No se encontraron visitas con los filtros aplicados
            </p>
          </div>
        )}
      </div>

      {/* Modal de Ver Proyecto */}
      <ViewProjectModal
        isOpen={isViewProjectModalOpen}
        onClose={() => setIsViewProjectModalOpen(false)}
        visitId={selectedVisitId}
      />
    </div>
  );
}
