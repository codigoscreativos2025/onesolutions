'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MapPin, Calendar, AlertCircle, Clock, XCircle, Filter, FileText } from 'lucide-react';
import { ContractModal } from '@/components/quote/ContractModal';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface VisitProject {
  projectType: { id: number; name: string };
}

interface VisitData {
  id: number;
  stage: string;
  outcome: string | null;
  objections: { objection: { name: string; color: string } }[];
  closerObjections: { closerObjection: { name: string; color: string } }[];
  projects: VisitProject[];
  bill: { clientName: string; phone: string } | null;
  setter: { id: number; name: string };
  closer: { id: number; name: string } | null;
}

interface Parcel {
  id: string;
  address: string;
  ownerName: string | null;
  status: string;
  claimedAt: string | null;
  lastActivityAt: string | null;
  setter: { id: number; name: string } | null;
  partner: { id: number; name: string } | null;
  visits: VisitData[];
  daysSinceActivity: number;
  daysLeft: number | null;
  isExpired: boolean;
  isExpiring: boolean;
  hasObjections: boolean;
  stage: string;
}

import { useLocale } from '@/lib/locale-context';

export default function LeadsPage() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const isPartner = session?.user?.role === "PARTNER";
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const filterParam = searchParams.get('filter') || 'all';
  const highlightId = searchParams.get('highlight');
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validFilters = ['all', 'expiring', 'expired', 'objections'];
  const filter = validFilters.includes(filterParam) ? filterParam : 'all';

  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [ownerNameFilter, setOwnerNameFilter] = useState<string>('');
  const [addressFilter, setAddressFilter] = useState<string>('');
  const [projectTypes, setProjectTypes] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetchParcels();
    fetchProjectTypes();
  }, []);

  useEffect(() => {
    if (!loading && highlightId) {
      setTimeout(() => {
        const el = document.getElementById(`parcel-${highlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("visit-highlight");
          highlightTimerRef.current = setTimeout(() => {
            el.classList.remove("visit-highlight");
          }, 2500);
        }
      }, 300);
    }
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, [loading, highlightId]);

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

  const fetchParcels = async () => {
    try {
      const res = await fetch('/api/leads/list');
      const data = await res.json();
      setParcels(data);
    } catch (error) {
      console.error('Error fetching parcels:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProjectTypeIds = (parcel: Parcel): number[] => {
    const visit = parcel.visits?.[0];
    if (!visit?.projects) return [];
    return visit.projects.map((p) => p.projectType.id);
  };

  const getPercentage = (daysLeft: number | null): number => {
    if (daysLeft === null || daysLeft <= 0) return 0;
    return Math.min(100, (daysLeft / 30) * 100);
  };

  const getDaysRemaining = (parcel: Parcel): number | null => {
    if (parcel.stage !== 'IN_PROGRESS') return null;
    return parcel.daysLeft;
  };

  const filteredParcels = parcels.filter((parcel) => {
    if (filter === 'expiring') return parcel.isExpiring && !parcel.isExpired;
    if (filter === 'expired') return parcel.isExpired;
    if (filter === 'objections') return parcel.hasObjections;

    const projectTypeIds = getProjectTypeIds(parcel);
    const matchesProjectType = projectTypeFilter === 'all' ||
      projectTypeIds.includes(Number(projectTypeFilter));

    const parcelDate = parcel.claimedAt ? new Date(parcel.claimedAt) : null;
    const matchesDateFrom = !dateFrom || (parcelDate && parcelDate >= new Date(dateFrom));
    const matchesDateTo = !dateTo || (parcelDate && parcelDate <= new Date(dateTo + 'T23:59:59.999Z'));

    const matchesOwnerName = !ownerNameFilter ||
      (parcel.ownerName || '').toLowerCase().includes(ownerNameFilter.toLowerCase());

    const matchesAddress = !addressFilter ||
      parcel.address.toLowerCase().includes(addressFilter.toLowerCase());

    return matchesProjectType && matchesDateFrom && matchesDateTo && matchesOwnerName && matchesAddress;
  });

  const getFilterCount = (f: string) => {
    if (f === 'expiring') return parcels.filter((p) => p.isExpiring && !p.isExpired).length;
    if (f === 'expired') return parcels.filter((p) => p.isExpired).length;
    if (f === 'objections') return parcels.filter((p) => p.hasObjections).length;
    return parcels.length;
  };

  const setFilter = (f: string) => {
    router.push(`/leads?filter=${f}`);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleOpenDocuments = (parcel: Parcel) => {
    const visit = parcel.visits?.[0];
    if (visit) {
      setSelectedVisitId(visit.id);
      setShowContractModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <style>{`
        @keyframes visitHighlightPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(244, 130, 33, 0.6); border-color: rgba(244, 130, 33, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(244, 130, 33, 0.1); border-color: rgba(244, 130, 33, 0.9); }
        }
        .visit-highlight {
          animation: visitHighlightPulse 0.8s ease-in-out 3;
          border-color: #f48221 !important;
          background-color: rgba(244, 130, 33, 0.08) !important;
        }
      `}</style>
      <div>
        <h1 className="text-3xl font-bold mb-2">{t.leads?.title || "Leads"}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t.leads?.subtitle || "Leads en seguimiento activo. Los leads con propuesta aceptada o cerrados se mueven a Leads Potenciales."}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex flex-wrap gap-4 items-end">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">{t.leads?.filters || "Filtros"}</span>
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">{t.leads?.projectType || "Tipo de Proyecto"}</label>
          <select
            value={projectTypeFilter}
            onChange={(e) => setProjectTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface text-sm"
          >
            <option value="all">{t.leads?.all || "Todos"}</option>
            {projectTypes.map((pt) => {
              const ptName = pt.name;
              const translatedName = t.pipeline?.projectTypes?.[ptName as keyof typeof t.pipeline.projectTypes] || ptName;
              return (
                <option key={pt.id} value={pt.id}>{translatedName}</option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">{t.leads?.dateFrom || "Fecha Desde"}</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">{t.leads?.dateTo || "Fecha Hasta"}</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">{t.leads?.owner || "Propietario"}</label>
          <input
            type="text"
            value={ownerNameFilter}
            onChange={(e) => setOwnerNameFilter(e.target.value)}
            placeholder={t.leads?.search || "Buscar..."}
            className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface text-sm w-44"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">{t.leads?.address || "Dirección"}</label>
          <input
            type="text"
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            placeholder={t.leads?.search || "Buscar..."}
            className="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-on-surface text-sm w-44"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {t.leads?.all || "Todos"} ({getFilterCount('all')})
        </button>
        <button
          onClick={() => setFilter('objections')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            filter === 'objections'
              ? 'bg-secondary text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <XCircle className="w-4 h-4" />
          {t.leads?.objections || "Objeciones"} ({getFilterCount('objections')})
        </button>
        <button
          onClick={() => setFilter('expiring')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            filter === 'expiring'
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          {t.leads?.expiring || "Expirando"} ({getFilterCount('expiring')})
        </button>
        <button
          onClick={() => setFilter('expired')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            filter === 'expired'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Clock className="w-4 h-4" />
          {t.leads?.expired || "Expirados"} ({getFilterCount('expired')})
        </button>
      </div>

      {filteredParcels.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {t.leads?.noActiveLeads || "No tienes leads activos"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredParcels.map((parcel) => {
            const daysRemaining = getDaysRemaining(parcel);
            const percentage = getPercentage(parcel.daysLeft);

            return (
              <div
                key={parcel.id}
                id={`parcel-${parcel.id}`}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 ${
                  filter === 'objections'
                    ? 'border-secondary'
                    : parcel.isExpired
                    ? 'border-red-500'
                    : parcel.isExpiring
                    ? 'border-yellow-500'
                    : 'border-green-500'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-gray-500" />
                      <h3 className="text-lg font-semibold">{parcel.address}</h3>
                      {parcel.hasObjections && (
                        <span className="px-2 py-0.5 bg-secondary/10 text-secondary rounded-full text-xs font-medium">
                          {t.leads?.objection || "Objeción"}
                        </span>
                      )}
                    </div>
                    {parcel.ownerName && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t.leads?.owner || "Propietario"}: {parcel.ownerName}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {t.leads?.claimed || "Reclamada:"}{' '}
                          {parcel.claimedAt
                            ? new Date(parcel.claimedAt).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {t.leads?.lastActivity || "Última actividad:"} {parcel.daysSinceActivity} {t.leads?.daysAgo || "días atrás"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {daysRemaining !== null && (
                    <div className="text-right">
                      <div
                        className={`text-2xl font-bold ${
                          parcel.isExpired
                            ? 'text-red-500'
                            : parcel.isExpiring
                            ? 'text-yellow-500'
                            : 'text-green-500'
                        }`}
                      >
                        {daysRemaining}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t.leads?.daysLeft || "días restantes"}
                      </div>
                    </div>
                  )}
                </div>

                {parcel.stage === 'IN_PROGRESS' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>{t.leads?.timeLeft || "Tiempo restante"}</span>
                      <span>{Math.round(percentage)}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getProgressColor(percentage)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {parcel.isExpiring && !parcel.isExpired && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">
                        {t.leads?.attentionExpiring?.replace("{days}", String(parcel.daysLeft)) || `¡Atención! Este lead expirará en ${parcel.daysLeft} días. Realiza una visita para mantenerlo.`}
                      </span>
                    </div>
                  </div>
                )}

                {parcel.isExpired && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">
                        {t.leads?.expiredNotice || "Este lead ha expirado y será liberado automáticamente."}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  {isPartner ? (
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg text-center text-sm">
                      {t.leads?.assignedLeadViewOnly || "Lead asignado — solo visualización"}
                    </div>
                  ) : (
                    <>
                      <Link
                        href={`/visit/${parcel.id}`}
                        className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors text-center"
                      >
                        {t.leads?.visit || "Visitar"}
                      </Link>
                      <Link
                        href={`/map?parcelId=${parcel.id}`}
                        className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center"
                      >
                        {t.leads?.viewOnMap || "Ver en Mapa"}
                      </Link>
                    </>
                  )}
                  {parcel.visits && parcel.visits.length > 0 && (
                    <button
                      onClick={() => handleOpenDocuments(parcel)}
                      className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center text-sm"
                    >
                      <FileText className="w-4 h-4" />
                      {t.leads?.documents || "Documentos"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ContractModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        visitId={selectedVisitId!}
      />
    </div>
  );
}
