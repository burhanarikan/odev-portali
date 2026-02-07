import { Request, Response, NextFunction } from 'express';
import { AnnouncementService } from '../services/announcement.service';
import { errorHandler, AppError } from '../middleware/errorHandler';

const announcementService = new AnnouncementService();

export const listAnnouncements = async (req: Request, res: Response, next: NextFunction) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/33b73e8a-9feb-4e60-88ab-976de39f9176',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hypothesisId:'H4',location:'announcement.controller:listAnnouncements:entry',message:'listAnnouncements entered',data:{},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  try {
    const list = await announcementService.list();
    res.json(list);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/33b73e8a-9feb-4e60-88ab-976de39f9176',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hypothesisId:'H4',location:'announcement.controller:listAnnouncements:exit',message:'listAnnouncements success',data:{count:Array.isArray(list)?list.length:0},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const createAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
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
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    await announcementService.delete(req.params.id ?? '', req.user.userId, req.user.role);
    res.status(204).send();
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};
