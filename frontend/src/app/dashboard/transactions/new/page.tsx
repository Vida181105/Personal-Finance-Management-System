'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { transactionService } from '@/services/transaction';
import { categoryService } from '@/services/category';
import { Transaction } from '@/types';

// Category options based on transaction type
const expenseCategories = [
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Office',
  'Home',
  'PersonalCare',
  'Insurance',
  'Subscriptions',
  'Donations',
  'Pets',
];

const incomeCategories = [
  'Salary',
  'Freelance',
  'Investment',
  'Bonus',
  'Refund',
  'Other Income',
];

export default function NewTransactionPage() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [merchant, setMerchant] = useState('');
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get appropriate categories based on type
  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setCategory(''); // Reset category when type changes
    setSuggestedCategory(''); // Reset suggested category
  };

  const handleMerchantChange = async (value: string) => {
    setMerchant(value);
    
    if (value.length > 2 && type === 'expense') {
      try {
        const suggestion = await categoryService.suggestCategory(value);
        setSuggestedCategory(suggestion.category);
      } catch (err) {
        setSuggestedCategory('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description || !amount || !category) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const newTransaction: Partial<Transaction> = {
        description,
        amount: parseFloat(amount),
        category,
        type,
        date: date,
      };
      
      if (merchant) {
        newTransaction.merchantName = merchant;
      }

      await transactionService.createTransaction(newTransaction);
      router.push('/dashboard/transactions');
    } catch (err: any) {
      // Silently ignore auth errors - ProtectedRoute handles redirection
      if (err.message?.includes('not authenticated')) {
        console.log('Auth check - redirecting to login');
        return;
      }
      setError(err.response?.data?.message || err.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Transaction</h1>
          <p className="text-gray-600">Create a new transaction</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  type === 'expense'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                disabled={loading}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  type === 'income'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                disabled={loading}
              >
                Income
              </button>
            </div>
          </div>

          <Input
            label="Description"
            type="text"
            placeholder="e.g., Grocery shopping"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={loading}
          />

          <Input
            label="Amount"
            type="number"
            placeholder="0.00"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            disabled={loading}
          />

          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={loading}
          />

          {type === 'expense' && (
            <Input
              label="Merchant (Optional)"
              type="text"
              placeholder="e.g., Starbucks"
              value={merchant}
              onChange={(e) => handleMerchantChange(e.target.value)}
              disabled={loading}
            />
          )}

          {suggestedCategory && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                Suggested category: <strong>{suggestedCategory}</strong>
              </p>
              <button
                type="button"
                onClick={() => setCategory(suggestedCategory)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Use suggested category
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <Button type="submit" loading={loading} className="flex-1">
              Create Transaction
            </Button>
            <Button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1 bg-gray-500 hover:bg-gray-600"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
