import { getBaseURL } from './client';

export const uploadApi = {
  /** Tek dosyayı Vercel Blob'a yükler; URL döner. */
  async uploadFile(file: File): Promise<{ url: string; pathname?: string }> {
    const base = getBaseURL();
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${base}/upload/blob`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error || `Yükleme başarısız: ${response.status}`);
    }
    return response.json();
  },
};
