import api from './api';
import { Transaction, TransactionStats, PaginatedResponse } from '@/types';

const getUserId = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const userStr = localStorage.getItem('user');
  if (!userStr || userStr === 'undefined') {
    return null;
  }

  try {
    const user = JSON.parse(userStr);
    // Use userId string (e.g., "U018"), not MongoDB _id
    if (!user.userId) {
      return null;
    }
    return user.userId;
  } catch (e) {
    console.error('Error parsing user data:', userStr, e);
    return null;
  }
};

// Helper to wait for auth to be available
const waitForAuth = async (maxRetries = 30): Promise<string | null> => {
  for (let i = 0; i < maxRetries; i++) {
    const userId = getUserId();
    if (userId) {
      return userId;
    }
    
    if (i < maxRetries - 1) {
      // Wait 200ms before retrying
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  // Return null instead of throwing - caller will handle it
  return null;
};

export const transactionService = {
  getTransactions: async (
    page = 1,
    limit = 10,
    category?: string,
    type?: string,
    search?: string,
    sortBy = 'date',
    order = 'desc'
  ): Promise<PaginatedResponse<Transaction> & { stats: TransactionStats }> => {
    try {
      const userId = await waitForAuth();
      if (!userId) {
        // Return empty data silently for unauthenticated users
        return {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          hasMore: false,
          stats: {
            totalIncome: 0,
            totalExpense: 0,
            balance: 0,
            byCategory: {},
            byType: {},
            monthly: {},
          },
        };
      }
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        order,
      });

      if (category) params.append('category', category);
      // Capitalize type for backend: 'income' -> 'Income'
      if (type) params.append('type', type.charAt(0).toUpperCase() + type.slice(1));
      if (search) params.append('search', search);

      const response = await api.get(`/transactions/${userId}?${params.toString()}`);

      // Backend response structure: { success, message, data: [...], meta: { total, page, limit, pages, summary } }
      const transactionsData = response.data.data || [];
      const meta = response.data.meta || {};
      
      console.log('✅ Transaction API Response:', {
        rawData: response.data,
        dataLength: transactionsData.length,
        total: meta.total,
        summary: meta.summary,
      });
      
      return {
        data: transactionsData,
        total: meta.total || 0,
        page: meta.page || page,
        limit: meta.limit || limit,
        hasMore: (meta.page || page) < (meta.pages || 1),
        stats: meta.summary || {
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          byCategory: {},
          byType: {},
          monthly: {},
        },
      };
    } catch (err) {
      console.error('❌ Error fetching transactions:', err);
      throw err;
    }
  },

  createTransaction: async (data: Partial<Transaction>): Promise<Transaction> => {
    try {
      const userId = await waitForAuth();
      if (!userId) {
        // Return a rejected promise that will be caught by the form
        return Promise.reject(new Error('User not authenticated'));
      }
      // Capitalize type: 'income' -> 'Income', 'expense' -> 'Expense'
      const requestData = {
        ...data,
        type: data.type ? data.type.charAt(0).toUpperCase() + data.type.slice(1) : data.type,
      };
      const response = await api.post(`/transactions/${userId}`, requestData);
      // Extract from nested response structure
      return response.data.data || response.data;
    } catch (err) {
      // Don't log here - let the caller handle it
      throw err;
    }
  },

  updateTransaction: async (id: string, data: Partial<Transaction>): Promise<Transaction> => {
    try {
      const userId = await waitForAuth();
      if (!userId) {
        return Promise.reject(new Error('User not authenticated'));
      }
      const response = await api.put(`/transactions/${userId}/${id}`, data);
      return response.data;
    } catch (err) {
      throw err;
    }
  },

  deleteTransaction: async (id: string): Promise<void> => {
    try {
      const userId = await waitForAuth();
      if (!userId) {
        return Promise.reject(new Error('User not authenticated'));
      }
      await api.delete(`/transactions/${userId}/${id}`);
    } catch (err) {
      throw err;
    }
  },

  bulkCreateTransactions: async (transactions: Partial<Transaction>[]): Promise<Transaction[]> => {
    try {
      const userId = await waitForAuth();
      if (!userId) {
        return Promise.reject(new Error('User not authenticated'));
      }
      const response = await api.post(`/transactions/${userId}/bulk`, { transactions });
      return response.data;
    } catch (err) {
      throw err;
    }
  },

  getStats: async (): Promise<TransactionStats> => {
    try {
      const userId = await waitForAuth();
      if (!userId) {
        // Return empty stats silently for unauthenticated users
        return {
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          byCategory: {},
          byType: {},
          monthly: {},
        };
      }
      const response = await api.get(`/transactions/${userId}/stats`);
      
      // Calculate totals from the stats
      const { byCategory, byType, monthly } = response.data.data;
      
      // Build the formatted stats object
      let totalIncome = 0;
      let totalExpense = 0;
      const categoryMap: { [key: string]: number } = {};

      // Parse byType for income/expense totals
      if (Array.isArray(byType)) {
        byType.forEach((item: any) => {
          if (item._id === 'Income') {
            totalIncome = item.total;
          } else if (item._id === 'Expense') {
            totalExpense = item.total;
          }
        });
      }

      // Parse byCategory
      if (Array.isArray(byCategory)) {
        byCategory.forEach((item: any) => {
          categoryMap[item._id] = item.total;
        });
      }

      return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        byCategory: categoryMap,
        byType: byType,
        monthly: monthly || {},
      };
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Return proper default stats structure if there's an error
      return {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        byCategory: {},
        byType: {},
        monthly: {},
      };
    }
  },
};
