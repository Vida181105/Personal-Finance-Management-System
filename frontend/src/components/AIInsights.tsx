'use client';

import { useState, useEffect, useRef } from 'react';
import { insightsCacheService } from '@/services/insightsCache';
import { Button } from './Button';

interface Insight {
  type: 'warning' | 'tip' | 'pattern' | 'opportunity';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  actionable: boolean;
}

const getSeverityColor = (severity: Insight['severity']) => {
  switch (severity) {
    case 'high':
      return 'border-red-200 bg-red-50';
    case 'medium':
      return 'border-yellow-200 bg-yellow-50';
    case 'low':
      return 'border-blue-200 bg-blue-50';
    default:
      return 'border-gray-200 bg-gray-50';
  }
};

const getSeverityTextColor = (severity: Insight['severity']) => {
  switch (severity) {
    case 'high':
      return 'text-red-900';
    case 'medium':
      return 'text-yellow-900';
    case 'low':
      return 'text-blue-900';
    default:
      return 'text-gray-900';
  }
};

// Client-side cache for insights (removed - using module-level cache in insightsCacheService)

export const AIInsights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cached, setCached] = useState(false);
  const hasFetchedRef = useRef(false);

  // Remove emojis from insight text
  const stripEmojis = (text: string): string => {
    return text.replace(/[\p{Emoji}]/gu, '').trim();
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await insightsCacheService.getInsights(false);

      if (response && response.insights && response.insights.length > 0) {
        // Strip emojis from all insight titles and messages
        const cleanedInsights = response.insights.map((insight: Insight) => ({
          ...insight,
          title: stripEmojis(insight.title),
          message: stripEmojis(insight.message),
        }));
        setInsights(cleanedInsights);
        setCached(response.cached || false);
      } else {
        // Backend returned empty or null — show fallback
        setInsights([
          {
            type: 'tip',
            title: 'No insights yet',
            message: 'Add more transactions or click Refresh to generate your personalized insights.',
            severity: 'low',
            actionable: true,
          },
        ]);
      }
    } catch (err: any) {
      console.error('Error fetching insights:', err);
      if (err.response?.status === 429) {
        setError('Rate limited. Insights refresh hourly.');
      } else {
        setError('Failed to load AI insights. Using fallback.');
      }
      // Set fallback insights
      setInsights([
        {
          type: 'tip',
          title: 'Get started with AI insights',
          message: 'Ensure you have some transaction data. AI insights are generated from your recent transactions.',
          severity: 'low',
          actionable: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError('');
      // Clear cache on explicit refresh
      insightsCacheService.clearCache();
      const response = await insightsCacheService.getInsights(true);

      if (response && response.insights && response.insights.length > 0) {
        // Strip emojis from all insight titles and messages
        const cleanedInsights = response.insights.map((insight: Insight) => ({
          ...insight,
          title: stripEmojis(insight.title),
          message: stripEmojis(insight.message),
        }));
        setInsights(cleanedInsights);
        setCached(false);
      } else {
        setInsights([
          {
            type: 'tip',
            title: 'No insights yet',
            message: 'Add more transactions or click Refresh to generate your personalized insights.',
            severity: 'low',
            actionable: true,
          },
        ]);
      }
    } catch (err: any) {
      console.error('Error refreshing insights:', err);
      if (err.response?.status === 429) {
        setError('Refresh rate limited. You can generate new insights once per hour.');
      } else {
        setError('Failed to refresh insights. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && insights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">AI Financial Insights</h3>
        </div>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">AI Financial Insights</h3>
          {cached && <p className="text-xs text-gray-500 mt-1">Cached (updates daily)</p>}
        </div>
        <Button
          onClick={handleRefresh}
          disabled={loading}
          className="text-sm px-3 py-1"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {/* Insights List */}
      <div className="space-y-3">
        {insights.length > 0 ? (
          insights.map((insight, idx) => (
            <div
              key={idx}
              className={`border-l-4 p-4 rounded-r-lg ${getSeverityColor(insight.severity)} ${getSeverityTextColor(insight.severity)}`}
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{insight.title}</h4>
                <p className="text-sm mt-1 leading-relaxed">{insight.message}</p>
                {insight.actionable && (
                  <p className="text-xs mt-2 font-semibold">Action needed: Review your spending in this category</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-600">
            <p>No insights available yet. Upload transactions to get started.</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Tip:</strong> Use the AI Chat to ask specific questions about your finances. Insights refresh every 24 hours.
        </p>
      </div>
    </div>
  );
};
