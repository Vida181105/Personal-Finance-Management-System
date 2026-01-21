'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { transactionService } from '@/services/transaction';
import { useAuth } from '@/context/AuthContext';
import { Transaction } from '@/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export default function EditTransactionPage() {
  const router = useRouter();
  const params = useParams();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'Expense',
    category: '',
    date: '',
    merchantName: '',
    paymentMode: '',
  });

  const transactionId = params?.id as string;

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!authLoading && isAuthenticated && transactionId) {
        try {
          setError('');
          setLoading(true);
          const data = await transactionService.getTransaction(transactionId);
          setTransaction(data);
          
          setFormData({
            description: data.description || '',
            amount: data.amount.toString(),
            type: data.type,
            category: data.category || '',
            date: new Date(data.date).toISOString().split('T')[0],
            merchantName: data.merchantName || '',
            paymentMode: data.paymentMode || '',
          });
        } catch (err: any) {
          console.error('Error fetching transaction:', err);
          setError(err.message || 'Failed to load transaction');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTransaction();
  }, [authLoading, isAuthenticated, transactionId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.category || !formData.date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      
      await transactionService.updateTransaction(transactionId, {
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type.toLowerCase() as 'income' | 'expense',
        category: formData.category,
        date: new Date(formData.date).toISOString(),
        merchantName: formData.merchantName,
        paymentMode: formData.paymentMode,
      });

      router.push('/dashboard/transactions');
    } catch (err: any) {
      console.error('Error updating transaction:', err);
      setError(err.message || 'Failed to update transaction');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Transaction</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Update transaction details</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-3 rounded-lg mb-4 sm:mb-6 text-sm sm:text-base">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : transaction ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <Input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <Input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter transaction description"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Transport">Transport</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Medical">Medical</option>
                    <option value="Education">Education</option>
                    <option value="Salary">Salary</option>
                    <option value="Bonus">Bonus</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Investment">Investment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <Input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Merchant Name</label>
                <Input
                  type="text"
                  name="merchantName"
                  value={formData.merchantName}
                  onChange={handleChange}
                  placeholder="Enter merchant name (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                <select
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select payment mode</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div className="flex gap-3 sm:gap-4 pt-4 sm:pt-6">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Updating...' : 'Update Transaction'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push('/dashboard/transactions')}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-600">
            Transaction not found
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
