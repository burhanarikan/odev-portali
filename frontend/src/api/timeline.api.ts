import api from './client';

export interface TimelinePost {
  id: string;
  classId: string;
  teacherId: string;
  summary: string;
  imageUrl: string | null;
  linkUrl: string | null;
  postDate: string;
  createdAt: string;
  teacher?: { user?: { name: string } };
  class?: { name: string };
}

export interface ClassOption {
  id: string;
  name: string;
  level?: { name: string };
}

export const timelineApi = {
  getMyTimeline: () => api.get<TimelinePost[]>('/timeline/my').then((r) => r.data),
  getTimelineByClass: (classId: string) => api.get<TimelinePost[]>(`/timeline/class/${classId}`).then((r) => r.data),
  getTeacherClasses: () => api.get<ClassOption[]>('/timeline/teacher/classes').then((r) => r.data),
  createPost: (data: { classId: string; summary: string; imageUrl?: string; linkUrl?: string; postDate?: string }) =>
    api.post<TimelinePost>('/timeline', data).then((r) => r.data),
  deletePost: (id: string) => api.delete(`/timeline/${id}`),
};
