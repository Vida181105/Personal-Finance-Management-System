export interface User {
  _id: string;
  userId: string;
  name: string;
  email: string;
  monthlyIncome: number;
  phone?: string;
  profession?: string;
  city?: string;
  age?: number;
  avatar?: string;
  createdAt: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  merchantName?: string;
  paymentMode?: string;
  anomaly_score?: number;
  is_anomaly?: boolean;
  anomaly_reason?: string;
  suggested_category?: string;
  category_confidence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  monthly: Record<string, { income: number; expense: number }>;
}

export interface Category {
  name: string;
  description?: string;
  color?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
