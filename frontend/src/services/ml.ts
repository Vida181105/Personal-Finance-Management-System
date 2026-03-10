import api from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClusterTransaction {
  index: number;
  amount: number;
  category: string;
  date: string;
}

export interface ClusterInfo {
  id: number;
  label: string;
  description: string;
  count: number;
  avg_amount: number;
  top_categories: string[];
  transactions: ClusterTransaction[];
}

export interface SpendingClusters {
  userId: string;
  clusters: ClusterInfo[];
  feature_importance: Record<string, number>;
  summary: string;
}

export interface AnomalyTransaction {
  index: number;
  amount: number;
  category: string;
  date: string;
  anomaly_score: number;
  reason: string;
}

export interface AnomalyResult {
  userId: string;
  anomalies: number[];
  scores: number[];
  high_risk_transactions: AnomalyTransaction[];
  summary: string;
}

export interface ForecastPoint {
  date: string;
  predicted_expense: number;
  confidence: number;
  range_low: number;
  range_high: number;
}

export interface ForecastResult {
  userId: string;
  forecast: ForecastPoint[];
  trend: string;
  summary: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

// ML calls can take up to 55s on Render free tier — override the default 15s axios timeout
const ML_TIMEOUT = 65000;

export const mlService = {
  getSpendingClusters: async (n_clusters = 5): Promise<SpendingClusters> => {
    const res = await api.post('/ml/cluster', { n_clusters }, { timeout: ML_TIMEOUT });
    return res.data.data;
  },

  detectAnomalies: async (contamination = 0.1): Promise<AnomalyResult> => {
    const res = await api.post('/ml/anomalies', { contamination }, { timeout: ML_TIMEOUT });
    return res.data.data;
  },

  forecastExpenses: async (forecast_days = 30): Promise<ForecastResult> => {
    const res = await api.post('/ml/forecast', { forecast_days }, { timeout: ML_TIMEOUT });
    return res.data.data;
  },
};
