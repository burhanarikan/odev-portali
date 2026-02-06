import api from './client';
import { LoginResponse, RegisterResponse, User } from '../types';

// Giriş/kayıt cold start'ta daha uzun sürebilir
const AUTH_TIMEOUT = 45000;

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post<LoginResponse>(
      '/auth/login',
      { email, password },
      { timeout: AUTH_TIMEOUT }
    );
    return response.data;
  },

  register: async (data: {
    name: string;
    email: string;
    password: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    classId?: string;
  }) => {
    const response = await api.post<RegisterResponse>(
      '/auth/register',
      data,
      { timeout: AUTH_TIMEOUT }
    );
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};
