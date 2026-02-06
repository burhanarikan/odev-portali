import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi, teacherApi } from '../api';
import type { Assignment } from '../types';

export const useStudentAssignments = () => {
  return useQuery({
    queryKey: ['student', 'assignments'],
    queryFn: studentApi.getAssignments,
    enabled: !!localStorage.getItem('token'),
  });
};

export const useStudentAssignment = (id: string) => {
  return useQuery({
    queryKey: ['student', 'assignment', id],
    queryFn: () => studentApi.getAssignmentById(id),
    enabled: !!id && !!localStorage.getItem('token'),
  });
};

export const useStudentEvaluations = () => {
  return useQuery({
    queryKey: ['student', 'evaluations'],
    queryFn: studentApi.getEvaluations,
    enabled: !!localStorage.getItem('token'),
  });
};

export const useSubmitAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentApi.submitAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['student', 'evaluations'] });
    },
  });
};

export const useLevels = () => {
  return useQuery({
    queryKey: ['teacher', 'levels'],
    queryFn: teacherApi.getLevels,
    enabled: !!localStorage.getItem('token'),
  });
};

export const useTeacherStudents = () => {
  return useQuery({
    queryKey: ['teacher', 'students'],
    queryFn: teacherApi.getStudents,
    enabled: !!localStorage.getItem('token'),
  });
};

export const useTeacherAssignments = () => {
  return useQuery({
    queryKey: ['teacher', 'assignments'],
    queryFn: teacherApi.getAssignments,
    enabled: !!localStorage.getItem('token'),
  });
};

export const useTeacherSubmissions = () => {
  return useQuery({
    queryKey: ['teacher', 'submissions'],
    queryFn: teacherApi.getSubmissions,
    enabled: !!localStorage.getItem('token'),
  });
};

export const useTeacherAssignment = (id: string) => {
  return useQuery({
    queryKey: ['teacher', 'assignment', id],
    queryFn: () => teacherApi.getAssignmentById(id),
    enabled: !!id && !!localStorage.getItem('token'),
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teacherApi.createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'assignments'] });
    },
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Assignment> }) =>
      teacherApi.updateAssignment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'assignment', id] });
    },
  });
};

export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teacherApi.deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'assignments'] });
    },
  });
};

export const useSubmitEvaluation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      data,
    }: {
      submissionId: string;
      data: { score?: number; feedback?: string; accepted: boolean };
    }) => teacherApi.submitEvaluation(submissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'assignment'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'submissions'] });
    },
  });
};

export const useCheckSimilarity = () => {
  return useMutation({
    mutationFn: teacherApi.checkSimilarity,
  });
};

export const useAssignmentsByWeek = (weekNumber: number) => {
  return useQuery({
    queryKey: ['teacher', 'assignments', 'week', weekNumber],
    queryFn: () => teacherApi.getAssignmentsByWeek(weekNumber),
    enabled: !!weekNumber && !!localStorage.getItem('token'),
  });
};

export const useAssignmentsByLevel = (levelId: string) => {
  return useQuery({
    queryKey: ['teacher', 'assignments', 'level', levelId],
    queryFn: () => teacherApi.getAssignmentsByLevel(levelId),
    enabled: !!levelId && !!localStorage.getItem('token'),
  });
};
