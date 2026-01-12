'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { transactionService } from '@/services/transaction';
import { useAuth } from '@/context/AuthContext';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52C41A',
];

interface CategoryData {
  category: string;
  value: number;
  percentage: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export default function AnalyticsPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netFlow: 0,
    averageMonthlyIncome: 0,
    averageMonthlyExpense: 0,
    transactionCount: 0,
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchAnalyticsData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, viewMode]);

  const fetchAnalyticsData = async () => {
    try {
      setError('');
      setLoading(true);

      // Fetch transactions to build analytics
      let response;
      try {
        response = await transactionService.getTransactions(1, 1000);
      } catch (apiError: any) {
        console.error('API Error details:', apiError);
        setError(`Unable to fetch transactions: ${apiError.message || 'API connection failed'}`);
        setLoading(false);
        return;
      }

      if (!response || !response.data || !Array.isArray(response.data)) {
        console.warn('Invalid response format:', response);
        setError('Invalid response format from server');
        setLoading(false);
        return;
      }

      // Calculate category breakdown
      const categoryMap = new Map<string, number>();
      let totalIncome = 0;
      let totalExpense = 0;

      response.data.forEach((txn: any) => {
        if (txn.type === 'Income') {
          totalIncome += txn.amount;
        } else {
          totalExpense += txn.amount;
        }

        if (txn.type === 'Expense') {
          const current = categoryMap.get(txn.category) || 0;
          categoryMap.set(txn.category, current + txn.amount);
        }
      });

      // Convert to array and sort
      const categoryArray = Array.from(categoryMap.entries())
        .map(([category, value]) => ({
          category,
          value,
          percentage: Math.round((value / totalExpense) * 100),
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8); // Top 8 categories

      setCategoryData(categoryArray);

      // Calculate period breakdown based on viewMode
      const periodMap = new Map<string, { income: number; expense: number; timestamp: number }>();

      response.data.forEach((txn: any) => {
        const date = new Date(txn.date);
        let periodKey = '';

        if (viewMode === 'weekly') {
          // Get week number and year
          const firstDay = new Date(date.getFullYear(), 0, 1);
          const pastDaysOfYear = (date.getTime() - firstDay.getTime()) / 86400000;
          const weekNumber = Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
          periodKey = `W${weekNumber} ${date.getFullYear()}`;
        } else if (viewMode === 'yearly') {
          periodKey = date.getFullYear().toString();
        } else {
          // Monthly (default)
          periodKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        }

        if (!periodMap.has(periodKey)) {
          periodMap.set(periodKey, { income: 0, expense: 0, timestamp: date.getTime() });
        } else {
          // Update timestamp to earliest transaction in this period
          const current = periodMap.get(periodKey)!;
          if (date.getTime() < current.timestamp) {
            current.timestamp = date.getTime();
          }
        }

        const period = periodMap.get(periodKey)!;
        if (txn.type === 'Income') {
          period.income += txn.amount;
        } else {
          period.expense += txn.amount;
        }
      });

      // Convert to array and sort by timestamp (chronological order)
      const periodArray = Array.from(periodMap.entries())
        .map(([period, data]) => ({
          month: period,
          income: data.income,
          expense: data.expense,
          timestamp: data.timestamp,
        }))
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(({ timestamp, ...rest }) => rest); // Remove timestamp from final data

      // For display, limit based on viewMode
      let displayArray = periodArray;
      if (viewMode === 'weekly') {
        displayArray = periodArray.slice(-12); // Last 12 weeks
      } else if (viewMode === 'monthly') {
        displayArray = periodArray.slice(-12); // Last 12 months
      }
      // Yearly shows all years

      setMonthlyData(displayArray);

      // Set summary
      setSummary({
        totalIncome,
        totalExpense,
        netFlow: totalIncome - totalExpense,
        averageMonthlyIncome: totalIncome / 12,
        averageMonthlyExpense: totalExpense / 12,
        transactionCount: response.data.length,
      });

      console.log('Analytics data loaded:', {
        categories: categoryArray.length,
        periods: displayArray.length,
        totalIncome,
        totalExpense,
      });
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-600 mt-2">Your financial insights and reports</p>
              </div>
              <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
                {(['weekly', 'monthly', 'yearly'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2 rounded font-medium transition-colors ${
                      viewMode === mode
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <div className="font-semibold">Error Loading Analytics</div>
              <div className="text-sm mt-1">{error}</div>
              <div className="text-xs text-red-600 mt-2">
                Please check that the backend is running on port 8888 and you are logged in.
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <p className="text-gray-600 text-sm font-medium">Total Income</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    ₹{summary.totalIncome.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <p className="text-gray-600 text-sm font-medium">Total Expense</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    ₹{summary.totalExpense.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <p className="text-gray-600 text-sm font-medium">Net Flow</p>
                  <p
                    className={`text-3xl font-bold mt-2 ${
                      summary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    ₹{summary.netFlow.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <p className="text-gray-600 text-sm font-medium">Transactions</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {summary.transactionCount}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <p className="text-gray-600 text-sm font-medium">Avg Monthly Income</p>
                  <p className="text-3xl font-bold text-green-500 mt-2">
                    ₹{(summary.totalIncome / 24).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <p className="text-gray-600 text-sm font-medium">Avg Monthly Expense</p>
                  <p className="text-3xl font-bold text-red-500 mt-2">
                    ₹{(summary.totalExpense / 24).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <p className="text-gray-600 text-sm font-medium">Savings Rate</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    {summary.totalIncome > 0 ? ((summary.netFlow / summary.totalIncome) * 100).toFixed(1) : '0'}%
                  </p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Spending by Category - Pie Chart */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryData as any}
                          dataKey="value"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry: any) => `${entry.category}: ${entry.percentage}%`}
                        >
                          {categoryData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `₹${value}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No category data available</p>
                  )}
                </div>

                {/* Income vs Expense - Bar Chart */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Income vs Expense ({viewMode === 'weekly' ? 'Weekly' : viewMode === 'yearly' ? 'Yearly' : 'Monthly'})
                  </h3>
                  {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip formatter={(value) => `₹${value}`} />
                        <Legend />
                        <Bar dataKey="income" fill="#51CF66" name="Income" />
                        <Bar dataKey="expense" fill="#FF6B6B" name="Expense" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No data available</p>
                  )}
                </div>
              </div>

              {/* Monthly Trend - Line Chart */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {viewMode === 'weekly' ? 'Weekly' : viewMode === 'yearly' ? 'Yearly' : 'Monthly'} Trend
                </h3>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip formatter={(value) => `₹${value}`} />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="income"
                        stroke="#51CF66"
                        strokeWidth={2}
                        name="Income"
                        dot={{ r: 4 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="expense"
                        stroke="#FF6B6B"
                        strokeWidth={2}
                        name="Expense"
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-center py-8">No trend data available</p>
                )}
              </div>

              {/* Category Breakdown Table */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
                {categoryData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                            Spending
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryData.map((category, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="px-6 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: COLORS[idx % COLORS.length],
                                  }}
                                ></div>
                                {category.category}
                              </div>
                            </td>
                            <td className="px-6 py-3 text-sm font-medium">
                              ₹{category.value.toLocaleString()}
                            </td>
                            <td className="px-6 py-3 text-sm">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${category.percentage}%` }}
                                ></div>
                              </div>
                              <p className="text-gray-600 mt-1">{category.percentage}%</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No category data available</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
