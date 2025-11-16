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
} from 'chart.js';
import type { ResearchPayload } from '@/types/research';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SentimentChartProps {
  data: ResearchPayload;
}

export default function SentimentChart({ data }: SentimentChartProps) {
  const sentimentData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        label: 'Sentiment Distribution',
        data: [
          data.summary.sentimentOverview.positive,
          data.summary.sentimentOverview.neutral,
          data.summary.sentimentOverview.negative,
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(201, 203, 207, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
      },
    ],
  };

  const timelineData = {
    labels: data.items.slice(0, 10).map((item) => new Date(item.createdAt).toLocaleDateString()),
    datasets: [
      {
        label: 'Sentiment Over Time',
        data: data.items.slice(0, 10).map((item) => item.sentiment),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
        <Bar data={sentimentData} options={{ responsive: true, maintainAspectRatio: true }} />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Sentiment Over Time</h3>
        <Line data={timelineData} options={{ responsive: true, maintainAspectRatio: true }} />
      </div>
    </div>
  );
}
