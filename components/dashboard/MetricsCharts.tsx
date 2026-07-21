'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartData {
  labels: string[];
  doorsKnocked: number[];
  leadsGenerated: number[];
  projectsClosed: number[];
  objections: number[];
  projectTypes?: { name: string; count: number }[];
}

interface MetricsChartsProps {
  userId?: number;
}

const COLORS = {
  doors: { border: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
  leads: { border: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  projects: { border: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  objections: { border: '#F97316', bg: 'rgba(249, 115, 22, 0.1)' },
};

const BAR_COLORS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EC4899',
  '#14B8A6', '#F59E0B', '#6366F1', '#84CC16', '#06B6D4',
];

export function MetricsCharts({ userId }: MetricsChartsProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | 'month' | 'custom'>('7d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [dateError, setDateError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, [period, userId, customStart, customEnd]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period: period === 'custom' ? 'custom' : period });
      if (userId) params.append('userId', userId.toString());
      if (period === 'custom') {
        if (customStart) params.append('startDate', customStart);
        if (customEnd) params.append('endDate', customEnd);
      }

      const res = await fetch(`/api/metrics/charts?${params}`);
      if (!res.ok) {
        throw new Error('Failed to fetch chart data');
      }
      const data = await res.json();
      setChartData(data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!chartData) {
    return <div className="text-center text-gray-500">No hay datos disponibles</div>;
  }

  const barMetricsData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Puertas Tocadas',
        data: chartData.doorsKnocked,
        backgroundColor: COLORS.doors.border,
        borderColor: COLORS.doors.border,
        borderWidth: 1,
      },
      {
        label: 'Leads Potenciales',
        data: chartData.leadsGenerated,
        backgroundColor: COLORS.leads.border,
        borderColor: COLORS.leads.border,
        borderWidth: 1,
      },
      {
        label: 'Proyectos Cerrados',
        data: chartData.projectsClosed,
        backgroundColor: COLORS.projects.border,
        borderColor: COLORS.projects.border,
        borderWidth: 1,
      },
      {
        label: 'Objeciones',
        data: chartData.objections,
        backgroundColor: COLORS.objections.border,
        borderColor: COLORS.objections.border,
        borderWidth: 1,
      },
    ],
  };

  const doughnutData = chartData.projectTypes
    ? {
        labels: chartData.projectTypes.map((p) => p.name),
        datasets: [
          {
            label: 'Visitas por Tipo de Proyecto',
            data: chartData.projectTypes.map((p) => p.count),
            backgroundColor: chartData.projectTypes.map((_, i) => BAR_COLORS[i % BAR_COLORS.length]),
            borderColor: chartData.projectTypes.map(() => '#ffffff'),
            borderWidth: 2,
          },
        ],
      }
    : null;

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Evolución de Métricas',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Distribución de Visitas por Tipo de Proyecto',
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Selector de período */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setPeriod('7d')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            period === '7d'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          7 Días
        </button>
        <button
          onClick={() => setPeriod('30d')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            period === '30d'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          30 Días
        </button>
        <button
          onClick={() => setPeriod('month')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            period === 'month'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Este Mes
        </button>
        <button
          onClick={() => setPeriod('custom')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            period === 'custom'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Personalizado
        </button>
      </div>

      {/* Fechas personalizadas */}
      {period === 'custom' && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-3 items-end">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Desde</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => {
                  setCustomStart(e.target.value);
                  setDateError('');
                }}
                min="1900-01-01"
                max="2100-12-31"
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Fecha fuera de rango")}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Hasta</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => {
                  const newEnd = e.target.value;
                  setCustomEnd(newEnd);
                  if (customStart && newEnd && customStart > newEnd) {
                    setDateError('La fecha "Desde" no puede ser mayor que "Hasta"');
                    toast.error('La fecha "Desde" no puede ser mayor que "Hasta"');
                  } else {
                    setDateError('');
                  }
                }}
                min="1900-01-01"
                max="2100-12-31"
                onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Fecha fuera de rango")}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>
          {dateError && (
            <p className="text-xs text-error">{dateError}</p>
          )}
        </div>
      )}

      {/* Gráfica de Barras */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="h-80">
          <Bar options={barOptions} data={barMetricsData} />
        </div>
      </div>

      {/* Gráfica de Dona */}
      {doughnutData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="h-80">
            <Doughnut options={doughnutOptions} data={doughnutData} />
          </div>
        </div>
      )}
    </div>
  );
}
