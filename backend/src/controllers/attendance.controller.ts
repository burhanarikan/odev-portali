import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { errorHandler, AppError } from '../middleware/errorHandler';

const attendanceService = new AttendanceService();

export const startSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { classId, durationMinutes, latitude, longitude, topic, resourceLinks } = req.body as {
      classId: string;
      durationMinutes?: number;
      latitude?: number;
      longitude?: number;
      topic?: string;
      resourceLinks?: string[];
    };
    if (!classId) return res.status(400).json({ error: 'classId gerekli' });
    const session = await attendanceService.startSession(
      req.user.userId,
      classId,
      durationMinutes ?? 15,
      latitude,
      longitude,
      topic,
      resourceLinks
    );
    res.status(201).json(session);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const joinSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { code, latitude, longitude } = req.body as {
      code: string;
      latitude?: number;
      longitude?: number;
    };
    if (!code || !code.trim()) return res.status(400).json({ error: 'Yoklama kodu girin' });
    const result = await attendanceService.joinSession(
      req.user.userId,
      code.trim(),
      latitude,
      longitude
    );
    res.json(result);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const getSessionLive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const teacherUserId = req.user.role === 'ADMIN' ? undefined : req.user.userId;
    const session = await attendanceService.getSessionLive(id ?? '', teacherUserId);
    res.json(session);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const getSessionByCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const session = await attendanceService.getSessionByCode(code ?? '');
    if (!session) return res.status(404).json({ error: 'Yoklama bulunamadı' });
    res.json(session);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const getSessionsForTeacher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const sessions = await attendanceService.getSessionsForTeacher(req.user.userId);
    res.json(sessions);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const getAbsenceReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const classId = req.query.classId as string | undefined;
    const report = await attendanceService.getAbsenceReport(classId);
    res.json(report);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};
