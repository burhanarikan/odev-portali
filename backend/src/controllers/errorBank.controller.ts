import { Request, Response, NextFunction } from 'express';
import { ErrorBankService } from '../services/errorBank.service';
import { errorHandler, AppError } from '../middleware/errorHandler';

const service = new ErrorBankService();

export const getMyErrors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const data = await service.getMyErrors(req.user.userId);
    res.json(data);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const getReviewList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const data = await service.getReviewList(req.user.userId);
    res.json(data);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const addError = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const body = req.body as { studentId?: string; errorText?: string; submissionId?: string };
    if (!body.studentId || !body.errorText?.trim()) return res.status(400).json({ error: 'studentId ve errorText gerekli' });
    const entry = await service.add(req.user.userId, {
      studentId: body.studentId,
      errorText: body.errorText,
      submissionId: body.submissionId,
    });
    res.status(201).json(entry);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};

export const getErrorsByStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const studentId = req.params.studentId ?? '';
    const list = await service.getByStudent(studentId, req.user.userId);
    res.json(list);
  } catch (e) {
    errorHandler(e as AppError, req, res, next);
  }
};
