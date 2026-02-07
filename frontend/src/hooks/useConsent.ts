import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/api/student.api';
import { useAuthStore } from '@/store/authStore';

export function useConsent() {
  const { user } = useAuthStore();
  const isStudent = user?.role === 'STUDENT';
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['student', 'consent'],
    queryFn: () => studentApi.getConsent(),
    enabled: !!isStudent,
  });

  const mutation = useMutation({
    mutationFn: () => studentApi.recordConsent(),
    onSuccess: () => {
      queryClient.setQueryData(['student', 'consent'], { accepted: true, acceptedAt: new Date().toISOString() });
    },
  });

  return {
    accepted: isStudent ? (query.data?.accepted ?? false) : true,
    acceptedAt: query.data?.acceptedAt,
    isLoading: isStudent && query.isLoading,
    accept: mutation.mutateAsync,
    isAccepting: mutation.isPending,
    refetch: query.refetch,
  };
}
