import api from './client';

export interface AttendanceSession {
  id: string;
  code: string;
  classId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  latitude?: number | null;
  longitude?: number | null;
  class?: { id: string; name: string; level?: { name: string } };
  teacher?: { user: { name: string } };
  _count?: { records: number };
  records?: Array<{
    id: string;
    joinedAt: string;
    locationOk: boolean;
    rejectReason?: string | null;
    student?: { user: { name: string } };
  }>;
  joinedCount?: number;
  acceptedCount?: number;
}

export interface AbsenceReportRow {
  studentId: string;
  studentName: string;
  className: string;
  levelName: string;
  totalSessions: number;
  attendedSessions: number;
  attendanceRate: number;
  absenceRate: number;
}

export const attendanceApi = {
  startSession: async (data: {
    classId: string;
    durationMinutes?: number;
    latitude?: number;
    longitude?: number;
    topic?: string;
    resourceLinks?: string[];
  }) => {
    const res = await api.post<AttendanceSession>('/attendance/start', data);
    return res.data;
  },

  joinSession: async (data: { code: string; latitude?: number; longitude?: number }) => {
    const res = await api.post<{
      success: boolean;
      reason?: string;
      message: string;
    }>('/attendance/join', data);
    return res.data;
  },

  getSessionLive: async (sessionId: string) => {
    const res = await api.get<AttendanceSession>(`/attendance/session/${sessionId}/live`);
    return res.data;
  },

  getSessionsForTeacher: async () => {
    const res = await api.get<AttendanceSession[]>('/attendance/sessions');
    return res.data;
  },

  getAbsenceReport: async (classId?: string) => {
    const res = await api.get<AbsenceReportRow[]>(
      classId ? `/attendance/absence-report?classId=${classId}` : '/attendance/absence-report'
    );
    return res.data;
  },
};
