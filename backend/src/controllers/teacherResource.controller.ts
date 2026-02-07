import { Request, Response, NextFunction } from 'express';
import { TeacherResourceService } from '../services/teacherResource.service';
import { errorHandler, AppError } from '../middleware/errorHandler';

const service = new TeacherResourceService();

export const listResources = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const levelId = req.query.levelId as string | undefined;
    const list = await service.list(levelId);
    res.json(list);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const createResource = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { title?: string; description?: string; fileUrl?: string; linkUrl?: string; levelId?: string };
    if (!body.title?.trim()) return res.status(400).json({ error: 'title gerekli' });
    const resource = await service.create(req.user.userId, {
      title: body.title,
      description: body.description,
      fileUrl: body.fileUrl,
      linkUrl: body.linkUrl,
      levelId: body.levelId,
    });
    res.status(201).json(resource);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const deleteResource = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    await service.delete(req.params.id ?? '', req.user.userId);
    res.status(204).send();
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};
