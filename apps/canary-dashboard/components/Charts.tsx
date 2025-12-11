'use client';

import { Line, Bar } from 'react-chartjs-2';
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
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface ChartsProps {
  metrics?: {
    latency?: Array<{ timestamp: string; p50: number; p90: number; p99: number }>;
    error_rate?: Array<{ timestamp: string; rate: number }>;
    ml_confidence?: Array<{ timestamp: string; confidence: number }>;
  };
}

export function Charts({ metrics }: ChartsProps) {
  // Latency Chart
  const latencyData = {
    labels: metrics?.latency?.map((d) => new Date(d.timestamp)) || [],
    datasets: [
      {
        label: 'P50',
        data: metrics?.latency?.map((d) => d.p50) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'P90',
        data: metrics?.latency?.map((d) => d.p90) || [],
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.4,
      },
      {
        label: 'P99',
        data: metrics?.latency?.map((d) => d.p99) || [],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
    ],
  };

  // Error Rate Chart
  const errorRateData = {
    labels: metrics?.error_rate?.map((d) => new Date(d.timestamp)) || [],
    datasets: [
      {
        label: 'Error Rate',
        data: metrics?.error_rate?.map((d) => d.rate) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
      },
    ],
  };

  // ML Confidence Chart
  const mlConfidenceData = {
    labels: metrics?.ml_confidence?.map((d) => new Date(d.timestamp)) || [],
    datasets: [
      {
        label: 'ML Confidence',
        data: metrics?.ml_confidence?.map((d) => d.confidence * 100) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'minute' as const,
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-xl font-semibold mb-4">📈 Latency Trends (P50/P90/P99)</h3>
        <div className="h-64">
          <Line data={latencyData} options={chartOptions} />
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-xl font-semibold mb-4">🔥 Error Rate</h3>
        <div className="h-64">
          <Bar data={errorRateData} options={chartOptions} />
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6 lg:col-span-2">
        <h3 className="text-xl font-semibold mb-4">🧠 ML Confidence Trend</h3>
        <div className="h-64">
          <Line data={mlConfidenceData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
