'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, Download, Eye, MapPin, Clock, Calendar, AlertCircle, MessageSquare, Plus, UserPlus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ViewProjectModal } from '@/components/calendar/ViewProjectModal';
import { CreateLeadModal } from '@/components/leads/CreateLeadModal';
import { ContractModal } from '@/components/quote/ContractModal';

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
    partnerId?: number | null;
    partner?: { id: number; name: string } | null;
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
  bill?: { imageUrl?: string; additionalFileUrl?: string; additionalFileName?: string; clientName?: string; phone?: string; clientEmail?: string } | null;
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
  const [showContractModal, setShowContractModal] = useState(false);
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [partners, setPartners] = useState<{ id: number; name: string }[]>([]);
  const [showPartnerSelect, setShowPartnerSelect] = useState<number | null>(null);
  const [partnerParcelIds, setPartnerParcelIds] = useState<Record<string, number | null>>({});

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
    if (filterParam === 'projects') setFilterStage('PROJECT');
    if (filterParam === 'closed') setFilterStage('CLOSED');
    if (filterParam === 'cancelled') setFilterStage('CANCELLED');
    if (filterParam === 'objections') setFilterStage('all');
    if (filterParam === 'objections') setFilterObjectionType('setter');
    if (setterIdParam) setFilterSetter(setterIdParam);
    if (closerIdParam) setFilterSetter(closerIdParam);

    fetchVisits();
    fetchPartners();
  }, [session, router, searchParams]);

  const fetchPartners = async () => {
    try {
      const res = await fetch(`/api/admin/users?role=PARTNER`);
      if (res.ok) {
        const data = await res.json();
        setPartners(data);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    }
  };

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

      const partnerMap: Record<string, number | null> = {};
      enriched.forEach((v: Visit) => {
        if (v.parcel.partnerId !== undefined) {
          partnerMap[v.parcel.id] = v.parcel.partnerId;
        }
      });
      setPartnerParcelIds(partnerMap);
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPartner = async (parcelId: string, partnerId: number | null) => {
    try {
      const res = await fetch(`/api/parcels/${parcelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId }),
      });
      if (res.ok) {
        setPartnerParcelIds(prev => ({ ...prev, [parcelId]: partnerId }));
        setShowPartnerSelect(null);
      }
    } catch (error) {
      console.error('Error assigning partner:', error);
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
      ['ID', 'Dirección', 'Traini', 'Closer', 'Estado', 'Fecha Creación', 'Última Actividad', 'Días Restantes', 'Proyectos', 'Objeciones Traini', 'Objeciones Closer', 'Cliente', 'Fecha Cierre', 'Método Pago'].join(','),
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
        (v.projectDetails?.clientName as string) || v.bill?.clientName || '',
        v.projectDetails?.closingDate ? new Date(v.projectDetails.closingDate as string).toLocaleDateString() : '',
        (v.projectDetails?.paymentMethod as string) || '',
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">CRM - Administración Completa</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestión completa de leads, puertas tocadas, visitas y proyectos. Haz clic en cualquier fila para ver detalles.
          </p>
        </div>
        <Button onClick={() => setShowCreateLead(true)} className="gap-2">
          <Plus className="w-5 h-5" />
          Crear Lead
        </Button>
      </div>

      {showCreateLead && (
        <CreateLeadModal
          isOpen={showCreateLead}
          onClose={() => setShowCreateLead(false)}
          onSuccess={fetchVisits}
        />
      )}

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
                placeholder="Buscar por dirección, traini o closer..."
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
              <option value="IN_PROGRESS">Leads</option>
              <option value="PROPOSAL_ACCEPTED">Leads Potenciales</option>
              <option value="PROJECT">Proyecto</option>
              <option value="CLOSED">Proyecto Cerrado</option>
              <option value="CANCELLED">Proyecto Cancelado</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Traini</label>
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
              <option value="setter">Objeciones Traini</option>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Traini</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Closer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Partner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Creado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Última Actividad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tiempo Restante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Proyectos / Objeciones</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Cierre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Método Pago</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <Link href={`/profile/${visit.setter.id}`} className="hover:underline">{visit.setter.name}</Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {visit.closer ? (
                      <Link href={`/profile/${visit.closer.id}`} className="hover:underline">{visit.closer.name}</Link>
                    ) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                    {showPartnerSelect === visit.id ? (
                      <div className="flex items-center gap-1">
                        <select
                          className="h-8 px-2 rounded border text-xs"
                          value={partnerParcelIds[visit.parcel.id] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleAssignPartner(visit.parcel.id, val ? parseInt(val) : null);
                          }}
                        >
                          <option value="">Sin partner</option>
                          {partners.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <button onClick={() => setShowPartnerSelect(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowPartnerSelect(visit.id)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <UserPlus className="w-3 h-3" />
                        {visit.parcel.partner?.name || (partnerParcelIds[visit.parcel.id] 
                          ? partners.find(p => p.id === partnerParcelIds[visit.parcel.id])?.name || `ID ${partnerParcelIds[visit.parcel.id]}`
                          : 'Asignar')}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      visit.stage === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                      visit.stage === 'PROPOSAL_ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                      visit.stage === 'PROJECT' ? 'bg-orange-100 text-orange-800' :
                      visit.stage === 'CLOSED' ? 'bg-green-100 text-green-800' :
                      visit.stage === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {visit.stage === 'IN_PROGRESS' ? 'Leads' :
                       visit.stage === 'PROPOSAL_ACCEPTED' ? 'Leads Potenciales' :
                       visit.stage === 'PROJECT' ? 'Proyecto' :
                       visit.stage === 'CLOSED' ? 'Cerrado' :
                       visit.stage === 'CANCELLED' ? 'Cancelado' :
                       visit.stage}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {(visit.stage === 'PROJECT' || visit.stage === 'CLOSED' || visit.stage === 'CANCELLED')
                      ? (visit.projectDetails?.clientName as string) || visit.bill?.clientName || '—'
                      : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {(visit.stage === 'PROJECT' || visit.stage === 'CLOSED' || visit.stage === 'CANCELLED')
                      ? (visit.projectDetails?.closingDate ? new Date(visit.projectDetails.closingDate as string).toLocaleDateString() : '—')
                      : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {(visit.stage === 'PROJECT' || visit.stage === 'CLOSED' || visit.stage === 'CANCELLED')
                      ? (visit.projectDetails?.paymentMethod as string) || '—'
                      : '—'}
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
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedVisitId(visit.id); setShowContractModal(true); }}>
                        <FileText className="w-4 h-4" />
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

      <ContractModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        visitId={selectedVisitId!}
      />
    </div>
  );
}
