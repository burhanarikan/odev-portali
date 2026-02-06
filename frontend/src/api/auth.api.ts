import api from './client';
import { LoginResponse, RegisterResponse, User } from '../types';

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  register: async (data: {
    name: string;
    email: string;
    password: string;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    classId?: string;
  }) => {
    const response = await api.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};
