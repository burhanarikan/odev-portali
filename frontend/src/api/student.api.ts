import api from './client';
import { StudentAssignments, Assignment, Submission, Evaluation } from '../types';

export const studentApi = {
  getAssignments: async () => {
    const response = await api.get<StudentAssignments>('/student/assignments');
    return response.data;
  },

  getAssignmentById: async (id: string) => {
    const response = await api.get<Assignment>(`/student/assignments/${id}`);
    return response.data;
  },

  submitAssignment: async (data: {
    assignmentId: string;
    contentText?: string;
    attachments?: string[];
  }) => {
    const response = await api.post<Submission>('/student/submissions', data);
    return response.data;
  },

  getSubmission: async (assignmentId: string) => {
    const response = await api.get<Submission>(`/student/submissions/${assignmentId}`);
    return response.data;
  },

  getEvaluations: async () => {
    const response = await api.get<Evaluation[]>('/student/evaluations');
    return response.data;
  },
};
