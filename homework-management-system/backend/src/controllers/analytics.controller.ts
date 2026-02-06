import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { errorHandler } from '../middleware/errorHandler';

const analyticsService = new AnalyticsService();

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await analyticsService.getDashboardStats();
    res.json(stats);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const getStudentProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const progress = await analyticsService.getStudentProgress(studentId);
    res.json(progress);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const getTeacherPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teacherId = req.user!.userId;
    const performance = await analyticsService.getTeacherPerformance(teacherId);
    res.json(performance);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};
