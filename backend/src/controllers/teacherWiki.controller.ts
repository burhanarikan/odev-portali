import { Request, Response, NextFunction } from 'express';
import { TeacherWikiService } from '../services/teacherWiki.service';
const service = new TeacherWikiService();

export const listPages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = req.query.category as string | undefined;
    const list = await service.list(category);
    res.json(list);
  } catch (e) {
    next(e);
  }
};

export const getPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = await service.getById(req.params.id ?? '');
    res.json(page);
  } catch (e) {
    next(e);
  }
};

export const createPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { title?: string; content?: string; category?: string };
    const page = await service.create(req.user.userId, {
      title: body.title ?? '',
      content: body.content ?? '',
      category: body.category,
    });
    res.status(201).json(page);
  } catch (e) {
    next(e);
  }
};

export const updatePage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { title?: string; content?: string; category?: string };
    const page = await service.update(
      req.params.id ?? '',
      req.user.userId,
      req.user.role === 'ADMIN',
      body
    );
    res.json(page);
  } catch (e) {
    next(e);
  }
};

export const deletePage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    await service.delete(req.params.id ?? '', req.user.userId, req.user.role === 'ADMIN');
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
