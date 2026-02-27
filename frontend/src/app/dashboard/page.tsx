'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { transactionService } from '@/services/transaction';
import { useAuth } from '@/context/AuthContext';
import { TransactionStats } from '@/types';

export default function DashboardPage() {
  const { isLoading, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only fetch stats after auth is fully loaded AND user is authenticated
    if (isLoading || !isAuthenticated) {
      console.log('Auth still loading or not authenticated, skipping fetch');
      // Still set loading to false so the loading spinner doesn't show forever
      if (!isLoading && !isAuthenticated) {
        setDashboardLoading(false);
      }
      return;
    }

    const fetchStats = async () => {
      try {
        console.log('Fetching stats');
        const data = await transactionService.getStats();
        console.log('Stats loaded:', data);
        setStats(data);
        setError(''); // Clear any previous errors
      } catch (err: any) {
        // Silently ignore "User not authenticated" errors since we already checked isAuthenticated
        if (err.message?.includes('User not authenticated')) {
          console.log('Auth check prevented fetch');
          setDashboardLoading(false);
          return;
        }
        
        console.error('Dashboard fetch error:', err);
        const errorMsg = err.message || err.response?.data?.message || 'Failed to load dashboard data';
        setError(errorMsg);
        // Set default stats on error
        setStats({
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          byCategory: {},
          byType: {},
          monthly: {},
        });
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchStats();
  }, [isLoading, isAuthenticated]);

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your financial overview.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {dashboardLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : stats && stats.totalIncome !== undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Income Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Income</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    ₹{stats.totalIncome.toLocaleString()}
                  </p>
                </div>
                <div className="text-4xl text-green-500">💰</div>
              </div>
            </div>

            {/* Expense Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Expenses</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    ₹{stats.totalExpense.toLocaleString()}
                  </p>
                </div>
                <div className="text-4xl text-red-500">📉</div>
              </div>
            </div>

            {/* Balance Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Balance</p>
                  <p
                    className={`text-3xl font-bold mt-2 ${
                      stats.balance >= 0 ? 'text-blue-600' : 'text-red-600'
                    }`}
                  >
                    ₹{stats.balance.toLocaleString()}
                  </p>
                </div>
                <div className="text-4xl text-blue-500">📊</div>
              </div>
            </div>
          </div>
        ) : null}

        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending by Category */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Spending by Category</h2>
              <div className="space-y-3">
                {stats.byCategory && Object.keys(stats.byCategory).length > 0 ? (
                  Object.entries(stats.byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([category, amount]) => (
                      <div key={category} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 text-sm font-medium">{category}</span>
                          <span className="font-bold text-gray-900 text-sm">
                            ₹{typeof amount === 'number' ? (amount / 1000000).toFixed(1) : '0'}M
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${stats.totalExpense > 0 ? (amount / stats.totalExpense) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-500 text-sm">No spending data available</p>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <a
                  href="/dashboard/transactions"
                  className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium"
                >
                  View All Transactions
                </a>
                <a
                  href="/dashboard/transactions/new"
                  className="block w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center font-medium"
                >
                  Add Transaction
                </a>
                <a
                  href="/dashboard/import"
                  className="block w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center font-medium"
                >
                  Import CSV
                </a>
              </div>
            </div>
          </div>
        )}

        {/* AI Insights Link */}
        <div className="mt-12 border-t pt-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-8 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">🤖 AI Financial Insights</h2>
                <p className="text-gray-600 mb-4">Ask AI questions about your spending, get personalized insights, and discover ways to improve your finances.</p>
              </div>
              <a
                href="/ai-assistant"
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors whitespace-nowrap ml-4"
              >
                Go to AI Assistant →
              </a>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
