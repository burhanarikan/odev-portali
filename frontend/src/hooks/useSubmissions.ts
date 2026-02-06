import { useQuery } from '@tanstack/react-query';
import { studentApi } from '../api';

export const useStudentSubmission = (assignmentId: string) => {
  return useQuery({
    queryKey: ['student', 'submission', assignmentId],
    queryFn: () => studentApi.getSubmission(assignmentId),
    enabled: !!assignmentId && !!localStorage.getItem('token'),
  });
};

export const useStudentEvaluations = () => {
  return useQuery({
    queryKey: ['student', 'evaluations'],
    queryFn: studentApi.getEvaluations,
    enabled: !!localStorage.getItem('token'),
  });
};
