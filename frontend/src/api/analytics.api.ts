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

  /** Hoca iş yükü (ADMIN): ödev sayısı, değerlendirme, 24h içinde geri bildirim */
  getTeacherWorkload: async () => {
    const response = await api.get<TeacherWorkloadItem[]>('/analytics/teacher-workload');
    return response.data;
  },

  /** Öğrenci portfolyosu (TEACHER/ADMIN): studentId = Student.id */
  getStudentPortfolio: async (studentId: string) => {
    const response = await api.get<StudentPortfolio>(`/analytics/portfolio/${studentId}`);
    return response.data;
  },

  /** Sınıf rekabeti: ödev + yoklama puanına göre sıralı sınıf listesi */
  getClassLeaderboard: async () => {
    const response = await api.get<ClassLeaderboardItem[]>('/analytics/class-leaderboard');
    return response.data;
  },
};

export interface ClassLeaderboardItem {
  classId: string;
  className: string;
  levelName: string;
  studentCount: number;
  completionRate: number;
  attendanceRate: number;
  score: number;
}

export interface TeacherWorkloadItem {
  teacherId: string;
  teacherName: string;
  assignmentCount: number;
  submissionCount: number;
  evaluatedCount: number;
  evaluatedWithin24h: number;
  lastEvaluationAt: string | null;
}

export interface StudentPortfolio {
  student: { id: string; name: string; email: string; class: string; level: string };
  evaluations: Array<{
    assignmentTitle: string;
    weekNumber: number;
    score: number | null;
    feedback: string | null;
    submittedAt: string;
    evaluatedAt: string | null;
  }>;
  summary: {
    totalAssignments: number;
    submittedCount: number;
    evaluatedCount: number;
    averageScore: number | null;
    totalSessions: number;
    attendedSessions: number;
    attendanceRate: number;
    absenceRate: number;
  };
}

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
