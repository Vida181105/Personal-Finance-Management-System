'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { transactionService } from '@/services/transaction';
import { useAuth } from '@/context/AuthContext';
import { Transaction } from '@/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export default function TransactionsPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'income' | 'expense' | ''>('');
  const [total, setTotal] = useState(0);

  const fetchTransactions = async () => {
    try {
      setError(''); // Clear previous errors
      setLoading(true);
      const data = await transactionService.getTransactions(
        page,
        10,
        categoryFilter || undefined,
        typeFilter || undefined,
        searchTerm || undefined
      );
      console.log('Fetched transactions data:', data);
      const transactionsArray = Array.isArray(data.data) ? data.data : [];
      setTransactions(transactionsArray);
      setTotal(data.total || 0);
    } catch (err: any) {
      // Silently ignore "User not authenticated" errors since we already checked isAuthenticated
      if (err.message?.includes('User not authenticated')) {
        console.log('Auth check prevented fetch');
        setLoading(false);
        return;
      }
      
      console.error('Error fetching transactions:', err);
      const errorMessage = err.message || err.response?.data?.message || 'Failed to load transactions';
      setError(errorMessage);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm, categoryFilter, typeFilter]);

  useEffect(() => {
    // Only fetch after auth is loaded AND user is authenticated
    if (!authLoading && isAuthenticated) {
      fetchTransactions();
    } else if (!authLoading) {
      // Auth finished loading but user is not authenticated
      // ProtectedRoute will handle the redirect
      setLoading(false);
    }
  }, [page, searchTerm, categoryFilter, typeFilter, authLoading, isAuthenticated]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionService.deleteTransaction(id);
        fetchTransactions();
      } catch (err) {
        setError('Failed to delete transaction');
      }
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export');
      return;
    }

    // Create CSV content
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Merchant', 'Payment Mode'];
    const rows = transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.description || '',
      t.category || '',
      t.type || '',
      t.amount.toLocaleString(),
      t.merchantName || '',
      t.paymentMode || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage your transactions</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleExportCSV}
              className="px-3 sm:px-4 py-2 bg-purple-600 text-white text-sm sm:text-base rounded-lg hover:bg-purple-700 font-medium transition-colors"
            >
              📥 Export CSV
            </button>
            <Link href="/dashboard/transactions/new" className="w-full sm:w-auto">
              <Button className="w-full">Add Transaction</Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-lg mb-4 sm:mb-6 text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <Input
              placeholder="Search description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-2 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <Input
              placeholder="Filter by category..."
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
            <Button variant="secondary" onClick={() => fetchTransactions()} size="sm" className="text-xs sm:text-base">
              Refresh
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          {loading ? (
            <div className="p-6 sm:p-8 flex items-center justify-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-gray-600 text-sm sm:text-base">
              No transactions found. Create one to get started!
            </div>
          ) : (
            <>
              <table className="w-full min-w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-900">
                      Date
                    </th>
                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-900">
                      Description
                    </th>
                    <th className="hidden sm:table-cell px-2 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-900">
                      Category
                    </th>
                    <th className="hidden sm:table-cell px-2 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-900">
                      Type
                    </th>
                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-right text-xs sm:text-sm font-medium text-gray-900">
                      Amount
                    </th>
                    <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="border-b hover:bg-gray-50 text-xs sm:text-sm">
                      <td className="px-2 sm:px-6 py-2 sm:py-3 text-gray-600">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-3 text-gray-900 truncate max-w-xs sm:max-w-none">
                        {transaction.description}
                      </td>
                      <td className="hidden sm:table-cell px-2 sm:px-6 py-2 sm:py-3">
                        <span className="inline-block px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {transaction.category}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-2 sm:px-6 py-2 sm:py-3">
                        <span
                          className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'income' || transaction.type === 'Income'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td
                        className={`px-2 sm:px-6 py-2 sm:py-3 font-semibold text-right whitespace-nowrap ${
                          transaction.type === 'income' || transaction.type === 'Income'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'income' || transaction.type === 'Income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-3 text-center space-x-1 sm:space-x-2">
                        <Link href={`/dashboard/transactions/${transaction._id}`}>
                          <Button variant="secondary" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(transaction._id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-6 py-4 flex justify-between items-center border-t">
                <div className="text-sm text-gray-600">
                  Showing {(page - 1) * 10 + 1} to{' '}
                  {Math.min(page * 10, total)} of {total} transactions
                </div>
                <div className="space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page * 10 >= total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
