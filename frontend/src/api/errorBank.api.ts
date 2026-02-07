import api from './client';

export interface ErrorBankEntry {
  id: string;
  errorText: string;
  createdAt: string;
  teacherName?: string;
}

export interface UniqueError {
  text: string;
  count: number;
  lastAt: string;
}

export const errorBankApi = {
  getMyErrors: () =>
    api.get<{ entries: ErrorBankEntry[]; uniqueErrors: UniqueError[] }>('/error-bank/my').then((r) => r.data),
  getReviewList: () => api.get<{ items: UniqueError[] }>('/error-bank/my/review-list').then((r) => r.data),
  addError: (data: { studentId: string; errorText: string; submissionId?: string }) =>
    api.post('/error-bank', data).then((r) => r.data),
  getByStudent: (studentId: string) => api.get<ErrorBankEntry[]>(`/error-bank/student/${studentId}`).then((r) => r.data),
};
