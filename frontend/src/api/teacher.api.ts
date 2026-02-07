import api from './client';
import { Assignment, SimilarAssignment } from '../types';
import { withNormalizedAttachments, withNormalizedAttachmentsList } from '../utils/normalizeAttachments';

export interface Level {
  id: string;
  name: string;
  sortOrder: number;
}

export interface TeacherStudent {
  id: string;
  userId: string;
  name: string;
  email: string;
  class: { id: string; name: string; level: { id: string; name: string } } | null;
  enrollmentDate: string;
  createdAt: string;
}

export interface TeacherStudentDetail extends TeacherStudent {
  submissions: Array<{
    id: string;
    assignment: { id: string; title: string; dueDate: string };
    evaluation: { score?: number; feedback?: string; accepted: boolean } | null;
    submittedAt: string;
  }>;
}

export const teacherApi = {
  getLevels: async () => {
    const response = await api.get<Level[]>('/teacher/levels');
    return response.data;
  },

  getStudents: async () => {
    const response = await api.get<TeacherStudent[]>('/teacher/students');
    return response.data;
  },

  getStudentById: async (id: string) => {
    const response = await api.get<TeacherStudentDetail>(`/teacher/students/${id}`);
    return response.data;
  },

  submitEvaluation: async (
    submissionId: string,
    data: { score?: number; feedback?: string; accepted: boolean }
  ) => {
    const response = await api.post<unknown>(
      `/teacher/submissions/${submissionId}/evaluation`,
      data
    );
    return response.data;
  },

  createAssignment: async (data: {
    homeworkId?: string;
    title?: string;
    description?: string;
    levelId?: string;
    weekNumber?: number;
    startDate: string;
    dueDate: string;
    isDraft?: boolean;
    attachments?: string[];
    classId?: string;
    studentIds?: string[];
    homeworkType?: 'TEXT' | 'FILE' | 'AUDIO' | 'MIXED';
    homeworkInstructions?: string;
    homeworkFileUrl?: string;
    homeworkAudioUrl?: string;
  }) => {
    const response = await api.post<{
      assignment: Assignment;
      similarAssignments: SimilarAssignment[];
    }>('/teacher/assignments', data);
    return response.data;
  },

  getAssignments: async () => {
    const response = await api.get<Assignment[]>('/teacher/assignments');
    return withNormalizedAttachmentsList(response.data);
  },

  getAssignmentById: async (id: string) => {
    const response = await api.get<Assignment>(`/teacher/assignments/${id}`);
    return withNormalizedAttachments(response.data);
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
    levelId?: string;
    weekNumber?: number;
  }) => {
    const response = await api.post<{
      similarAssignments: SimilarAssignment[];
      warningMessage?: string | null;
    }>('/teacher/assignments/check-similarity', data);
    return response.data;
  },

  getAssignmentsByWeek: async (weekNumber: number) => {
    const response = await api.get<Assignment[]>(
      `/teacher/assignments/by-week/${weekNumber}`
    );
    return withNormalizedAttachmentsList(response.data);
  },

  getAssignmentsByLevel: async (levelId: string) => {
    const response = await api.get<Assignment[]>(
      `/teacher/assignments/by-level/${levelId}`
    );
    return withNormalizedAttachmentsList(response.data);
  },

  getSubmissions: async () => {
    const response = await api.get<TeacherSubmission[]>('/teacher/submissions');
    return response.data;
  },
};

export interface TeacherSubmission {
  id: string;
  assignmentId: string;
  studentId: string | null;
  submittedAt: string;
  isLate: boolean;
  contentText: string | null;
  assignment: { title: string; level?: { name: string } };
  student: { user: { name: string; email: string } } | null;
  evaluation: { score?: number; feedback?: string; accepted: boolean } | null;
}
