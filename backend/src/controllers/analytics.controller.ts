import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { errorHandler, AppError } from '../middleware/errorHandler';

const analyticsService = new AnalyticsService();

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const stats = await analyticsService.getDashboardStats(req.user.role);
    res.json(stats);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getStudentProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const progress = await analyticsService.getStudentProgress(studentId ?? '');
    res.json(progress);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getTeacherPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const teacherIdParam = req.user.role === 'ADMIN' ? (req.query.teacherId as string | undefined) : undefined;
    const performance = await analyticsService.getTeacherPerformance(req.user.userId, teacherIdParam);
    res.json(performance);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getAllStudentsProgress = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await analyticsService.getAllStudentsProgress();
    res.json(list);
  } catch (error: unknown) {
    errorHandler(error as AppError, _req, res, next);
  }
};

/** Kur sonu raporu: her öğrenci için toplam verilen ödev / tamamlanan ödev oranı (ADMIN) */
export const getCourseEndReport = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await analyticsService.getAllStudentsProgress();
    res.json({
      report: 'course_end',
      description: 'Toplam verilen ödev / tamamlanan ödev oranı (öğrenci bazlı)',
      students: list,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    errorHandler(error as AppError, _req, res, next);
  }
};

/** Hoca iş yükü: kim kaç ödev vermiş, kaçı değerlendirilmiş, 24 saat içinde geri bildirim (ADMIN) */
export const getTeacherWorkload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await analyticsService.getTeacherWorkload();
    res.json(list);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

/** Öğrenci portfolyosu (kur geçmişi): studentId = Student.id (TEACHER/ADMIN) */
export const getStudentPortfolio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const portfolio = await analyticsService.getStudentPortfolio(studentId ?? '');
    res.json(portfolio);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

/** Sınıf rekabeti liderlik tablosu (ödev + yoklama puanı) */
export const getClassLeaderboard = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await analyticsService.getClassLeaderboard();
    res.json(list);
  } catch (error: unknown) {
    errorHandler(error as AppError, _req, res, next);
  }
};
