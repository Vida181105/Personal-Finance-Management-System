'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/Button';
import { transactionService } from '@/services/transaction';

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please select a valid CSV file');
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csv = event.target?.result as string;
          const lines = csv.split('\n');
          const transactions: any[] = [];

          // Parse CSV (assuming format: description,amount,category,type,date,merchant)
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;

            const [description, amount, category, type, date, merchant] = lines[i].split(',');
            if (description && amount && category) {
              transactions.push({
                description: description.trim(),
                amount: parseFloat(amount.trim()),
                category: category.trim(),
                type: (type?.trim() || 'expense') as 'income' | 'expense',
                date: date ? new Date(date.trim()) : new Date(),
                merchant: merchant?.trim() || null,
              });
            }
          }

          if (transactions.length === 0) {
            setError('No valid transactions found in CSV');
            setLoading(false);
            return;
          }

          const result = await transactionService.bulkCreateTransactions(transactions);
          setSuccess(`Successfully imported ${result.length} transactions`);
          setTimeout(() => {
            router.push('/dashboard/transactions');
          }, 1500);
        } catch (err: any) {
          if (err.message?.includes('not authenticated')) {
            setError('Please try again - authentication in progress');
          } else {
            setError(err.response?.data?.message || err.message || 'Failed to import transactions');
          }
          setLoading(false);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      setError('Error reading file');
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Transactions</h1>
          <p className="text-gray-600">Upload a CSV file to bulk import transactions</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CSV File</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={loading}
                className="w-full"
              />
              {file && (
                <p className="mt-2 text-sm text-green-600 font-medium">
                  ✓ {file.name} selected
                </p>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              CSV format: description, amount, category, type, date, merchant
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" loading={loading} className="flex-1">
              Import Transactions
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
