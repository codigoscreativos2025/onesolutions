'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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

  const lineData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Puertas Tocadas',
        data: chartData.doorsKnocked,
        borderColor: COLORS.doors.border,
        backgroundColor: COLORS.doors.bg,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Leads Potenciales',
        data: chartData.leadsGenerated,
        borderColor: COLORS.leads.border,
        backgroundColor: COLORS.leads.bg,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Proyectos Cerrados',
        data: chartData.projectsClosed,
        borderColor: COLORS.projects.border,
        backgroundColor: COLORS.projects.bg,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Objeciones',
        data: chartData.objections,
        borderColor: COLORS.objections.border,
        backgroundColor: COLORS.objections.bg,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const barData = chartData.projectTypes
    ? {
        labels: chartData.projectTypes.map((p) => p.name),
        datasets: [
          {
            label: 'Proyectos por Tipo',
            data: chartData.projectTypes.map((p) => p.count),
            backgroundColor: chartData.projectTypes.map((_, i) => BAR_COLORS[i % BAR_COLORS.length]),
            borderColor: chartData.projectTypes.map((_, i) => BAR_COLORS[i % BAR_COLORS.length]),
            borderWidth: 1,
          },
        ],
      }
    : null;

  const options = {
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

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Proyectos por Tipo',
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
        <div className="flex gap-3 items-end">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Desde</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Hasta</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
        </div>
      )}

      {/* Gráfica de Líneas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="h-80">
          <Line options={options} data={lineData} />
        </div>
      </div>

      {/* Gráfica de Barras */}
      {barData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="h-80">
            <Bar options={barOptions} data={barData} />
          </div>
        </div>
      )}
    </div>
  );
}
