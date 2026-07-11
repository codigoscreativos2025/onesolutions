'use client';

import { useEffect, useState } from 'react';
import { MapPin, Calendar, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface Parcel {
  id: string;
  address: string;
  ownerName: string | null;
  status: string;
  claimedAt: string | null;
  lastActivityAt: string | null;
  daysSinceActivity: number;
  daysRemaining: number;
  percentage: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
}

export default function MyParcelsPage() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'expiring' | 'expired'>('all');

  useEffect(() => {
    fetchParcels();
  }, []);

  const fetchParcels = async () => {
    try {
      const res = await fetch('/api/parcels/expiration');
      const data = await res.json();
      setParcels(data);
    } catch (error) {
      console.error('Error fetching parcels:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredParcels = parcels.filter((parcel) => {
    if (filter === 'expiring') return parcel.isExpiringSoon && !parcel.isExpired;
    if (filter === 'expired') return parcel.isExpired;
    return true;
  });

  const getProgressColor = (percentage: number) => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Parcelas Activas</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Parcelas en seguimiento activo. Las parcelas con propuesta aceptada o cerradas se mueven a Mis Proyectos.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Todas ({parcels.length})
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
          Por Vencer ({parcels.filter((p) => p.isExpiringSoon && !p.isExpired).length})
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
          Expiradas ({parcels.filter((p) => p.isExpired).length})
        </button>
      </div>

      {/* Lista de Parcelas */}
      {filteredParcels.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {filter === 'all'
              ? 'No tienes parcelas reclamadas'
              : filter === 'expiring'
              ? 'No tienes parcelas por vencer'
              : 'No tienes parcelas expiradas'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredParcels.map((parcel) => (
            <div
              key={parcel.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 ${
                parcel.isExpired
                  ? 'border-red-500'
                  : parcel.isExpiringSoon
                  ? 'border-yellow-500'
                  : 'border-green-500'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-semibold">{parcel.address}</h3>
                  </div>
                  {parcel.ownerName && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Propietario: {parcel.ownerName}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Reclamada:{' '}
                        {parcel.claimedAt
                          ? new Date(parcel.claimedAt).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        Última actividad: {parcel.daysSinceActivity} días atrás
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${
                      parcel.isExpired
                        ? 'text-red-500'
                        : parcel.isExpiringSoon
                        ? 'text-yellow-500'
                        : 'text-green-500'
                    }`}
                  >
                    {parcel.daysRemaining}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    días restantes
                  </div>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Tiempo restante</span>
                  <span>{Math.round(parcel.percentage)}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getProgressColor(
                      parcel.percentage
                    )}`}
                    style={{ width: `${parcel.percentage}%` }}
                  />
                </div>
              </div>

              {/* Alerta de Expiración */}
              {parcel.isExpiringSoon && !parcel.isExpired && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">
                      ¡Atención! Esta parcela expirará en {parcel.daysRemaining} días.
                      Realiza una visita para mantenerla.
                    </span>
                  </div>
                </div>
              )}

              {parcel.isExpired && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">
                      Esta parcela ha expirado y será liberada automáticamente.
                    </span>
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-3">
                <Link
                  href={`/visit/${parcel.id}`}
                  className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors text-center"
                >
                  Registrar Visita
                </Link>
                <Link
                  href={`/map?parcelId=${parcel.id}`}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center"
                >
                  Ver en Mapa
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
