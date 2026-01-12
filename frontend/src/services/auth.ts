import api from './api';
import { AuthResponse, User } from '@/types';

export const authService = {
  register: async (name: string, email: string, password: string, monthlyIncome: number): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { 
      name, 
      email, 
      password,
      confirmPassword: password,
      monthlyIncome 
    });
    // Extract from nested response structure
    const { data } = response.data;
    return {
      token: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      user: data.user,
    };
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    // Extract from nested response structure
    const { data } = response.data;
    return {
      token: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      user: data.user,
    };
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (name: string, email: string): Promise<User> => {
    const response = await api.put('/auth/update-profile', { name, email });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },
};
