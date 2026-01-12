'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { transactionService } from '@/services/transaction';
import { categoryService } from '@/services/category';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export default function TransactionForm() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const [formData, setFormData] = useState<{
    date: string;
    amount: string;
    description: string;
    category: string;
    type: 'income' | 'expense';
    merchantName: string;
    paymentMode: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
    category: '',
    type: 'expense',
    merchantName: '',
    paymentMode: '',
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState<{ category: string; confidence: string } | null>(
    null
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await categoryService.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (id && id !== 'new') {
      const fetchTransaction = async () => {
        try {
          setLoading(true);
          const result = await transactionService.getTransactions();
          const transaction = result.data.find((t) => t._id === id);
          if (transaction) {
            setFormData({
              date: transaction.date,
              amount: transaction.amount.toString(),
              description: transaction.description,
              category: transaction.category,
              type: transaction.type,
              merchantName: transaction.merchantName || '',
              paymentMode: transaction.paymentMode || '',
            });
          }
        } catch (err) {
          setError('Failed to load transaction');
        } finally {
          setLoading(false);
        }
      };
      fetchTransaction();
    }
  }, [id]);

  const handleSuggestCategory = async () => {
    if (formData.merchantName || formData.description) {
      try {
        const result = await categoryService.categorizeTransaction(
          formData.merchantName,
          formData.description
        );
        setSuggestion(result);
        setFormData({ ...formData, category: result.category });
      } catch (err) {
        console.error('Failed to suggest category:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        date: formData.date,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        type: formData.type,
        merchantName: formData.merchantName,
        paymentMode: formData.paymentMode,
      };

      if (id && id !== 'new') {
        await transactionService.updateTransaction(id, data);
      } else {
        await transactionService.createTransaction(data);
      }

      router.push('/dashboard/transactions');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/dashboard/transactions" className="text-blue-600 hover:text-blue-700 mb-4">
            ← Back to Transactions
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {id && id !== 'new' ? 'Edit Transaction' : 'Add Transaction'}
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              disabled={loading}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <Input
              label="Amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              disabled={loading}
            />

            <Input
              label="Merchant Name"
              type="text"
              placeholder="e.g., Starbucks"
              value={formData.merchantName}
              onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
              disabled={loading}
            />

            <Input
              label="Description"
              type="text"
              placeholder="Enter description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={loading}
            />

            <Input
              label="Payment Mode"
              type="text"
              placeholder="e.g., Credit Card"
              value={formData.paymentMode}
              onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="flex gap-2">
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSuggestCategory}
                disabled={loading || (!formData.merchantName && !formData.description)}
              >
                Suggest
              </Button>
            </div>
            {suggestion && (
              <p className="text-sm text-gray-600 mt-2">
                Suggested: <strong>{suggestion.category}</strong> ({suggestion.confidence})
              </p>
            )}
          </div>

          <div className="mt-8 flex gap-4">
            <Button type="submit" loading={loading} className="flex-1">
              {id && id !== 'new' ? 'Update Transaction' : 'Create Transaction'}
            </Button>
            <Link href="/dashboard/transactions" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
