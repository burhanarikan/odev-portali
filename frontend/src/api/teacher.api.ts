import api from './client';
import { Assignment, SimilarAssignment } from '../types';

export const teacherApi = {
  createAssignment: async (data: {
    title: string;
    description?: string;
    levelId: string;
    weekNumber: number;
    startDate: string;
    dueDate: string;
    isDraft?: boolean;
    attachments?: string[];
  }) => {
    const response = await api.post<{
      assignment: Assignment;
      similarAssignments: SimilarAssignment[];
    }>('/teacher/assignments', data);
    return response.data;
  },

  getAssignments: async () => {
    const response = await api.get<Assignment[]>('/teacher/assignments');
    return response.data;
  },

  getAssignmentById: async (id: string) => {
    const response = await api.get<Assignment>(`/teacher/assignments/${id}`);
    return response.data;
  },

  updateAssignment: async (id: string, data: Partial<{
    title: string;
    description: string;
    levelId: string;
    weekNumber: number;
    startDate: string;
    dueDate: string;
    isDraft: boolean;
    attachments: string[];
  }>) => {
    const response = await api.put<Assignment>(`/teacher/assignments/${id}`, data);
    return response.data;
  },

  deleteAssignment: async (id: string) => {
    await api.delete(`/teacher/assignments/${id}`);
  },

  checkSimilarity: async (data: {
    title: string;
    description?: string;
    levelId: string;
    weekNumber: number;
  }) => {
    const response = await api.post<{ similarAssignments: SimilarAssignment[] }>(
      '/teacher/assignments/check-similarity',
      data
    );
    return response.data;
  },

  getAssignmentsByWeek: async (weekNumber: number) => {
    const response = await api.get<Assignment[]>(
      `/teacher/assignments/by-week/${weekNumber}`
    );
    return response.data;
  },

  getAssignmentsByLevel: async (levelId: string) => {
    const response = await api.get<Assignment[]>(
      `/teacher/assignments/by-level/${levelId}`
    );
    return response.data;
  },
};
