import { Request, Response, NextFunction } from 'express';
import { InterventionService } from '../services/intervention.service';
import { errorHandler, AppError } from '../middleware/errorHandler';

const service = new InterventionService();

export const getAtRiskStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const teacherId = req.user.role === 'TEACHER' ? req.user.userId : undefined;
    const list = await service.getAtRiskStudents(teacherId);
    res.json(list);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const addLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { studentId?: string; reason?: string; note?: string };
    if (!body.studentId || !body.reason?.trim()) return res.status(400).json({ error: 'studentId ve reason gerekli' });
    const log = await service.addLog(req.user.userId, {
      studentId: body.studentId,
      reason: body.reason,
      note: body.note,
    });
    res.status(201).json(log);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const getLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const studentId = req.query.studentId as string | undefined;
    const list = await service.getLogs(studentId);
    res.json(list);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};
