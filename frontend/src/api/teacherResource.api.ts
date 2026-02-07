import api from './client';

export interface TeacherResource {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  linkUrl: string | null;
  levelId: string | null;
  createdAt: string;
  teacher?: { user?: { name: string } };
  level?: { name: string };
}

export const teacherResourceApi = {
  list: (levelId?: string) =>
    api.get<TeacherResource[]>('/teacher-resources', levelId ? { params: { levelId } } : undefined).then((r) => r.data),
  create: (data: { title: string; description?: string; fileUrl?: string; linkUrl?: string; levelId?: string }) =>
    api.post<TeacherResource>('/teacher-resources', data).then((r) => r.data),
  delete: (id: string) => api.delete(`/teacher-resources/${id}`),
};
