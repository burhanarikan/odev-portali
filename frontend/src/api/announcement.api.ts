import api from './client';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string | null;
  createdAt: string;
  author?: { id: string; name: string } | null;
}

export const announcementApi = {
  list: async (): Promise<Announcement[]> => {
    const res = await api.get<Announcement[]>('/announcements');
    return res.data;
  },

  create: async (data: { title: string; body: string }) => {
    const res = await api.post<Announcement>('/announcements', data);
    return res.data;
  },

  delete: async (id: string) => {
    await api.delete(`/announcements/${id}`);
  },
};
