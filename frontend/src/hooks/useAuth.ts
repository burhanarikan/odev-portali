import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';
import { LoginResponse, RegisterResponse } from '../types';

export const useLogin = () => {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data: LoginResponse) => {
      login(data.user, data.token);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

export const useRegister = () => {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      password: string;
      role: 'STUDENT' | 'TEACHER' | 'ADMIN';
      classId?: string;
    }) => authApi.register(data),
    onSuccess: (data: RegisterResponse) => {
      login(data.user, data.token);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

export const useProfile = () => {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: authApi.getProfile,
    enabled: isAuthenticated,
    retry: false,
  });
};

export const useLogout = () => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return () => {
    logout();
    queryClient.clear();
  };
};
