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
};
