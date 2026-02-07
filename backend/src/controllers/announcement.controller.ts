import { Request, Response, NextFunction } from 'express';
import { AnnouncementService } from '../services/announcement.service';
import { errorHandler, AppError } from '../middleware/errorHandler';

const announcementService = new AnnouncementService();

export const listAnnouncements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await announcementService.list();
    res.json(list);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const createAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { title, body } = req.body as { title?: string; body?: string };
    if (!title?.trim()) return res.status(400).json({ error: 'Başlık gerekli' });
    const authorId = req.user.role === 'ADMIN' || req.user.role === 'TEACHER' ? req.user.userId : null;
    const announcement = await announcementService.create(
      title.trim(),
      (body ?? '').trim(),
      authorId
    );
    res.status(201).json(announcement);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const deleteAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    await announcementService.delete(req.params.id ?? '', req.user.userId, req.user.role);
    res.status(204).send();
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};
