import api from './client';

export interface TeacherWikiPage {
  id: string;
  title: string;
  content: string;
  category: string | null;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  teacher?: { user?: { name: string } };
}

export const teacherWikiApi = {
  list: (category?: string) =>
    api
      .get<TeacherWikiPage[]>('/teacher-wiki', category ? { params: { category } } : undefined)
      .then((r) => r.data),
  get: (id: string) => api.get<TeacherWikiPage>(`/teacher-wiki/${id}`).then((r) => r.data),
  create: (data: { title: string; content: string; category?: string }) =>
    api.post<TeacherWikiPage>('/teacher-wiki', data).then((r) => r.data),
  update: (id: string, data: { title?: string; content?: string; category?: string }) =>
    api.put<TeacherWikiPage>(`/teacher-wiki/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/teacher-wiki/${id}`),
};
