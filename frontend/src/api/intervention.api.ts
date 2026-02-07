import api from './client';

export interface AtRiskStudent {
  studentId: string;
  studentName: string;
  email: string;
  className: string;
  levelName: string;
  reasons: string[];
  lastIntervention?: string;
}

export interface InterventionLogItem {
  id: string;
  studentId: string;
  reason: string;
  note: string | null;
  createdAt: string;
  student?: { user?: { name: string } };
  teacher?: { user?: { name: string } };
}

export const interventionApi = {
  getAtRiskStudents: () => api.get<AtRiskStudent[]>('/intervention/at-risk').then((r) => r.data),
  addLog: (data: { studentId: string; reason: string; note?: string }) =>
    api.post<InterventionLogItem>('/intervention/log', data).then((r) => r.data),
  getLogs: (studentId?: string) =>
    api.get<InterventionLogItem[]>('/intervention/logs', studentId ? { params: { studentId } } : undefined).then((r) => r.data),
};
