import api from './client';

export const analyticsApi = {
  getDashboardStats: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  getStudentProgress: async (studentId: string) => {
    const response = await api.get(`/analytics/student-progress/${studentId}`);
    return response.data;
  },

  getTeacherPerformance: async () => {
    const response = await api.get('/analytics/teacher-performance');
    return response.data;
  },

  getStudentsProgress: async () => {
    const response = await api.get<StudentsProgressItem[]>('/analytics/students-progress');
    return response.data;
  },

  /** Kur sonu raporu: toplam verilen ödev / tamamlanan ödev oranı (ADMIN) */
  getCourseEndReport: async () => {
    const response = await api.get<{
      report: string;
      description: string;
      students: StudentsProgressItem[];
      generatedAt: string;
    }>('/analytics/course-end-report');
    return response.data;
  },
};

export interface StudentsProgressItem {
  studentId: string;
  name: string;
  email: string;
  className: string;
  levelName: string;
  totalAssignments: number;
  submittedAssignments: number;
  completionRate: number;
}
