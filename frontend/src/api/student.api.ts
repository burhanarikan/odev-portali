import api from './client';
import { StudentAssignments, Assignment, Submission, Evaluation } from '../types';
import { withNormalizedAttachments, withNormalizedAttachmentsList } from '../utils/normalizeAttachments';

export const studentApi = {
  getAssignments: async () => {
    const data = await api.get<StudentAssignments>('/student/assignments').then((r) => r.data);
    return {
      active: withNormalizedAttachmentsList(data.active ?? []),
      upcoming: withNormalizedAttachmentsList(data.upcoming ?? []),
      past: withNormalizedAttachmentsList(data.past ?? []),
    };
  },

  getAssignmentById: async (id: string) => {
    const response = await api.get<Assignment>(`/student/assignments/${id}`);
    return withNormalizedAttachments(response.data);
  },

  submitAssignment: async (data: {
    assignmentId: string;
    contentText?: string;
    attachments?: string[];
    audioUrl?: string;
    fileUrl?: string;
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

  getMyPortfolio: async () => {
    const response = await api.get('/student/portfolio');
    return response.data as {
      student: { id: string; name: string; email: string; class: string; level: string };
      evaluations: Array<{ assignmentTitle: string; weekNumber: number; score: number | null; feedback: string | null; submittedAt: string; evaluatedAt: string | null }>;
      summary: { totalAssignments: number; submittedCount: number; evaluatedCount: number; averageScore: number | null; totalSessions: number; attendedSessions: number; attendanceRate: number; absenceRate: number };
      skillScores: { vocabulary: number; grammar: number; listening: number; speaking: number };
    };
  },

  getConsent: async () => {
    const response = await api.get<{ accepted: boolean; acceptedAt?: string }>('/student/consent');
    return response.data;
  },

  recordConsent: async () => {
    const response = await api.post<{ accepted: true; acceptedAt: string }>('/student/consent');
    return response.data;
  },

  getMissedSessions: async () => {
    const response = await api.get<MissedSessionItem[]>('/student/missed-sessions');
    return response.data;
  },

  getAvailableMakeUpSlots: async () => {
    const response = await api.get<MakeUpSlotItem[]>('/student/makeup-slots');
    return response.data;
  },

  getMyMakeUpBookings: async () => {
    const response = await api.get<MakeUpBookingItem[]>('/student/makeup-bookings');
    return response.data;
  },

  bookMakeUpSlot: async (slotId: string) => {
    const response = await api.post<MakeUpBookingItem>(`/student/makeup-slots/${slotId}/book`);
    return response.data;
  },
};

export interface MissedSessionItem {
  id: string;
  startTime: string;
  endTime: string;
  topic: string;
  resourceLinks: string[];
  teacherName: string;
}

export interface MakeUpSlotItem {
  id: string;
  slotStart: string;
  slotEnd: string;
  title: string | null;
  teacherName: string;
  className: string;
  levelName: string;
  bookedCount: number;
  maxStudents: number;
}

export interface MakeUpBookingItem {
  id: string;
  slotId: string;
  studentId: string;
  createdAt: string;
  slot?: {
    id: string;
    slotStart: string;
    slotEnd: string;
    title: string | null;
    class: { name: string; level?: { name: string } };
    teacher: { user: { name: string } };
  };
}
