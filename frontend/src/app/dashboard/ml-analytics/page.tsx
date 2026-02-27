'use client';

import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { mlService, SpendingClusters, AnomalyResult, ForecastResult } from '@/services/ml';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'clusters' | 'anomalies' | 'forecast';

// ─── Constants ────────────────────────────────────────────────────────────────

const PIE_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#a855f7',
];

const TREND_BADGES: Record<string, { label: string; color: string }> = {
  increasing: { label: 'Spending Increasing', color: 'bg-red-100 text-red-700' },
  decreasing: { label: 'Spending Decreasing', color: 'bg-green-100 text-green-700' },
  stable:     { label: 'Spending Stable',     color: 'bg-blue-100 text-blue-700'  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function formatAmount(n: number) {
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function riskColor(score: number) {
  if (score >= 0.7) return 'text-red-600 font-semibold';
  if (score >= 0.4) return 'text-yellow-600 font-semibold';
  return 'text-green-600';
}

// Build pie data by aggregating category spend from cluster response
function buildPieData(clusters: SpendingClusters['clusters']) {
  const map: Record<string, number> = {};
  clusters.forEach((cluster) => {
    cluster.transactions.forEach((tx) => {
      map[tx.category] = (map[tx.category] || 0) + tx.amount;
    });
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value: Math.round(value) }));
}

// ─── Loading / Error placeholders ─────────────────────────────────────────────

function LoadingCard() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p>Running ML analysis...</p>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  const isOffline = message.toLowerCase().includes('unavailable') || message.toLowerCase().includes('503');
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-2 text-center px-4">
      <div className="text-4xl">{isOffline ? '🔌' : '⚠️'}</div>
      <p className="text-gray-700 font-medium">
        {isOffline ? 'ML service unavailable' : 'Analysis failed'}
      </p>
      <p className="text-sm text-gray-500 max-w-sm">
        {isOffline
          ? 'The ML analytics service is currently unavailable. Please try again later.'
          : message}
      </p>
    </div>
  );
}

function InfoCard({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-2 text-center px-4">
      <div className="text-4xl">📊</div>
      <p className="text-gray-500 max-w-sm">{message}</p>
    </div>
  );
}

// ─── Clusters Panel ───────────────────────────────────────────────────────────

function ClustersPanel({ data }: { data: SpendingClusters }) {
  const pieData = buildPieData(data.clusters);
  const totalTx = data.clusters.reduce((s, c) => s + c.count, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-indigo-50 rounded-xl p-4 text-sm text-indigo-800">
        {data.summary}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Spend by Category</h3>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart margin={{ top: 0, right: 0, bottom: 10, left: 0 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="44%"
                innerRadius={65}
                outerRadius={105}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number | undefined) => formatAmount(v ?? 0)} />
              <Legend
                wrapperStyle={{ paddingTop: '12px', fontSize: '12px', lineHeight: '20px' }}
                iconSize={10}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cluster cards */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Spending Clusters</h3>
          {data.clusters.map((cluster) => {
            const total = cluster.transactions.reduce((s, t) => s + t.amount, 0);
            const pct = totalTx > 0 ? Math.round((cluster.count / totalTx) * 100) : 0;

            return (
              <div key={cluster.id} className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
                <div className="flex items-start gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: PIE_COLORS[cluster.id % PIE_COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{cluster.label}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{cluster.description}</p>
                  </div>
                </div>
                <div className="ml-6 flex items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">
                    {cluster.count} txns ({pct}%) • Avg {formatAmount(cluster.avg_amount)}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 flex-shrink-0">{formatAmount(total)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature importance */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Feature Importance</h3>
        <div className="space-y-2">
          {(() => {
            const entries = Object.entries(data.feature_importance).sort((a, b) => b[1] - a[1]);
            const maxScore = Math.max(...entries.map(([, v]) => v), 0.001);
            return entries.map(([feature, score]) => {
              const pct = Math.round((score / maxScore) * 100);
              return (
                <div key={feature} className="flex items-center gap-3">
                  <p className="text-xs text-gray-600 w-36 flex-shrink-0 capitalize">
                    {feature.replace(/_/g, ' ')}
                  </p>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 w-8 text-right">{pct}%</p>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── Anomalies Panel ──────────────────────────────────────────────────────────

function AnomaliesPanel({ data }: { data: AnomalyResult }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-red-50 rounded-xl p-4 text-sm text-red-800">
        {data.summary}
      </div>

      {data.high_risk_transactions.length === 0 ? (
        <InfoCard message="No anomalous transactions detected. Your spending patterns look normal." />
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Category</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-medium">Amount</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-medium">Risk Score</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.high_risk_transactions.map((tx, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                      {formatAmount(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={riskColor(tx.anomaly_score)}>
                        {(tx.anomaly_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{tx.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Forecast Panel ───────────────────────────────────────────────────────────

function ForecastPanel({ data }: { data: ForecastResult }) {
  const chartData = data.forecast.slice(0, 30).map((pt) => ({
    date: formatDate(pt.date),
    predicted: Math.round(pt.predicted_expense),
    low: Math.round(pt.range_low),
    high: Math.round(pt.range_high),
  }));

  const badge = TREND_BADGES[data.trend] || TREND_BADGES.stable;
  const avgPredicted = Math.round(
    data.forecast.reduce((s, p) => s + p.predicted_expense, 0) / data.forecast.length
  );

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 bg-blue-50 rounded-xl p-4 text-sm text-blue-800">{data.summary}</div>
        <div className={`px-3 py-2 rounded-lg text-sm font-medium ${badge.color}`}>{badge.label}</div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Avg Daily Expense</p>
          <p className="text-2xl font-bold text-gray-800">{formatAmount(avgPredicted)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">30-Day Projection</p>
          <p className="text-2xl font-bold text-gray-800">{formatAmount(avgPredicted * 30)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">30-Day Expense Forecast</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="rangeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              interval={Math.floor(chartData.length / 6)}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              width={50}
            />
            <Tooltip
              formatter={(v: number | undefined, name: string | undefined) => [
                formatAmount(v ?? 0),
                name === 'predicted' ? 'Predicted' : name === 'high' ? 'Upper Range' : 'Lower Range',
              ]}
            />
            <Area
              type="monotone"
              dataKey="high"
              stroke="none"
              fill="url(#rangeGradient)"
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="low"
              stroke="none"
              fill="#ffffff"
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="#6366f1"
              strokeWidth={2}
              fill="none"
              dot={false}
              name="Predicted Expense"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MLAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('clusters');

  const [clusterData, setClusterData] = useState<SpendingClusters | null>(null);
  const [anomalyData, setAnomalyData] = useState<AnomalyResult | null>(null);
  const [forecastData, setForecastData] = useState<ForecastResult | null>(null);

  const [loading, setLoading] = useState<Record<Tab, boolean>>({
    clusters: false, anomalies: false, forecast: false,
  });
  const [errors, setErrors] = useState<Record<Tab, string | null>>({
    clusters: null, anomalies: null, forecast: null,
  });
  const [infoMsg, setInfoMsg] = useState<Record<Tab, string | null>>({
    clusters: null, anomalies: null, forecast: null,
  });

  async function runTab(tab: Tab) {
    setLoading((p) => ({ ...p, [tab]: true }));
    setErrors((p) => ({ ...p, [tab]: null }));
    setInfoMsg((p) => ({ ...p, [tab]: null }));

    try {
      if (tab === 'clusters') {
        const d = await mlService.getSpendingClusters();
        if ((d as unknown as { message?: string }).message) {
          setInfoMsg((p) => ({ ...p, clusters: (d as unknown as { message: string }).message }));
        } else {
          setClusterData(d);
        }
      } else if (tab === 'anomalies') {
        const d = await mlService.detectAnomalies();
        if ((d as unknown as { message?: string }).message) {
          setInfoMsg((p) => ({ ...p, anomalies: (d as unknown as { message: string }).message }));
        } else {
          setAnomalyData(d);
        }
      } else {
        const d = await mlService.forecastExpenses();
        if ((d as unknown as { message?: string }).message) {
          setInfoMsg((p) => ({ ...p, forecast: (d as unknown as { message: string }).message }));
        } else {
          setForecastData(d);
        }
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        'Analysis failed';
      setErrors((p) => ({ ...p, [tab]: msg }));
    } finally {
      setLoading((p) => ({ ...p, [tab]: false }));
    }
  }

  const tabs: { id: Tab; label: string; desc: string }[] = [
    { id: 'clusters',  label: 'Spending Clusters', desc: 'KMeans pattern grouping'   },
    { id: 'anomalies', label: 'Anomaly Detection',  desc: 'Isolation Forest outliers'  },
    { id: 'forecast',  label: 'Expense Forecast',   desc: 'Time-series prediction'     },
  ];

  function renderContent(tab: Tab) {
    if (loading[tab])  return <LoadingCard />;
    if (errors[tab])   return <ErrorCard message={errors[tab]!} />;
    if (infoMsg[tab])  return <InfoCard message={infoMsg[tab]!} />;

    if (tab === 'clusters'  && clusterData)  return <ClustersPanel  data={clusterData}  />;
    if (tab === 'anomalies' && anomalyData)  return <AnomaliesPanel data={anomalyData}  />;
    if (tab === 'forecast'  && forecastData) return <ForecastPanel  data={forecastData} />;

    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500 text-sm">Click Run Analysis to start</p>
        <button
          onClick={() => runTab(tab)}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
        >
          Run Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ML Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Machine learning insights powered by KMeans, Isolation Forest, and time-series forecasting
          </p>
        </div>
        <button
          onClick={() => runTab(activeTab)}
          disabled={loading[activeTab]}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
        >
          {loading[activeTab] ? 'Running...' : 'Run Analysis'}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition text-left sm:text-center ${
                activeTab === t.id
                  ? 'border-b-2 border-indigo-600 text-indigo-700 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="block">{t.label}</span>
              <span className="block text-xs font-normal text-gray-400 hidden sm:block">{t.desc}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">{renderContent(activeTab)}</div>
      </div>


    </div>
  );
}
