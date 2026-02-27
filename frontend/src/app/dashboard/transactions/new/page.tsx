'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { transactionService } from '@/services/transaction';
import { aiService } from '@/services/ai';
import { Transaction } from '@/types';

// Category options based on transaction type
const expenseCategories = [
  'Food & Dining',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Office',
  'Home',
  'Personal Care',
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
  const [suggestion, setSuggestion] = useState<{ category: string; confidence: number; reason: string } | null>(null);
  const [suggestingCategory, setSuggestingCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Debouncing refs for AI calls
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get appropriate categories based on type
  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setCategory(''); // Reset category when type changes
    setSuggestion(null); // Reset suggestion
  };

  const handleMerchantChange = (value: string) => {
    setMerchant(value);
    
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only suggest for expenses with amount > 0
    if (value.length > 2 && type === 'expense' && amount && parseFloat(amount) > 0) {
      setSuggestingCategory(true);
      
      // Debounce the API call (400ms)
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const result = await aiService.checkCategory(value, parseFloat(amount));
          setSuggestion({
            category: result.category,
            confidence: result.confidence,
            reason: result.reason,
          });
        } catch (err) {
          console.error('Failed to get AI suggestion:', err);
          setSuggestion(null);
        } finally {
          setSuggestingCategory(false);
        }
      }, 400);
    } else if (value.length <= 2) {
      setSuggestion(null);
      setSuggestingCategory(false);
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Re-suggest when amount changes (if merchant is set)
    if (merchant.length > 2 && type === 'expense' && value && parseFloat(value) > 0) {
      setSuggestingCategory(true);
      
      // Debounce the API call (400ms)
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const result = await aiService.checkCategory(merchant, parseFloat(value));
          setSuggestion({
            category: result.category,
            confidence: result.confidence,
            reason: result.reason,
          });
        } catch (err) {
          console.error('Failed to get AI suggestion:', err);
          setSuggestion(null);
        } finally {
          setSuggestingCategory(false);
        }
      }, 400);
    } else {
      setSuggestion(null);
      setSuggestingCategory(false);
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
            onChange={(e) => handleAmountChange(e.target.value)}
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

          {suggestingCategory && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                <span className="inline-block animate-spin mr-2">⚙️</span>
                Analyzing transaction with AI...
              </p>
            </div>
          )}

          {suggestion && !suggestingCategory && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    🤖 AI Suggestion
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    <strong>{suggestion.category}</strong>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {suggestion.reason}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    {(suggestion.confidence * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-blue-600">confidence</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCategory(suggestion.category)}
                className="w-full mt-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded font-medium transition-colors"
              >
                Use AI Suggestion
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
