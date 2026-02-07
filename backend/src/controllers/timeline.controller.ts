import { Request, Response, NextFunction } from 'express';
import { TimelineService } from '../services/timeline.service';
import { errorHandler, AppError } from '../middleware/errorHandler';

const timelineService = new TimelineService();

export const getMyTimeline = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await timelineService.getTimelineForStudent(req.user.userId);
    res.json(list);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const getTimelineByClass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classId = req.params.classId ?? '';
    const list = await timelineService.getByClassId(classId);
    res.json(list);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const getTeacherClasses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await timelineService.getClassesForTeacher(req.user.userId);
    res.json(list);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const createPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { classId?: string; summary?: string; imageUrl?: string; linkUrl?: string; postDate?: string };
    if (!body.classId || !body.summary?.trim()) return res.status(400).json({ error: 'classId ve summary gerekli' });
    const post = await timelineService.create(req.user.userId, {
      classId: body.classId,
      summary: body.summary,
      imageUrl: body.imageUrl,
      linkUrl: body.linkUrl,
      postDate: body.postDate,
    });
    res.status(201).json(post);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    await timelineService.delete(req.params.id ?? '', req.user.userId);
    res.status(204).send();
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};
