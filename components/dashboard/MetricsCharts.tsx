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

export function MetricsCharts({ userId }: MetricsChartsProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | 'month'>('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, [period, userId]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (userId) params.append('userId', userId.toString());
      
      const res = await fetch(`/api/metrics/charts?${params}`);
      const data = await res.json();
      setChartData(data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
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
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Leads Generados',
        data: chartData.leadsGenerated,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Proyectos Cerrados',
        data: chartData.projectsClosed,
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
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
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: 'rgb(59, 130, 246)',
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
      <div className="flex gap-2">
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
      </div>

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
