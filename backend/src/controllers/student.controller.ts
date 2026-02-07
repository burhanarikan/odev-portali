import { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/student.service';
import { AnalyticsService } from '../services/analytics.service';
import { AttendanceService } from '../services/attendance.service';
import { MakeUpService } from '../services/makeUp.service';
import { submissionSchema } from '../utils/validators';
import { errorHandler, AppError } from '../middleware/errorHandler';
import { prisma } from '../config/database';

const studentService = new StudentService();
const analyticsService = new AnalyticsService();
const attendanceService = new AttendanceService();
const makeUpService = new MakeUpService();

export const getAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const assignments = await studentService.getStudentAssignments(req.user.userId);
    res.json(assignments);
  } catch (error: unknown) {
    const err = error as AppError & { code?: string };
    if (process.env.NODE_ENV !== 'production') {
      console.error('[getAssignments]', err.message, err.code);
    }
    errorHandler(error as AppError, req, res, next);
  }
};

export const getAssignmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const assignment = await studentService.getAssignmentById(id ?? '', req.user.userId);
    res.json(assignment);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const submitAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = submissionSchema.parse(req.body);
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const submission = await studentService.submitAssignment(validatedData, req.user.userId);
    res.status(201).json(submission);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getSubmission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId } = req.params;
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const submission = await studentService.getSubmission(assignmentId ?? '', req.user.userId);
    res.json(submission);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getEvaluations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const evaluations = await studentService.getEvaluations(req.user.userId);
    res.json(evaluations);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getMyPortfolio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const student = await prisma.student.findUnique({
      where: { userId: req.user.userId },
      select: { id: true },
    });
    if (!student) return res.status(404).json({ error: 'Öğrenci kaydı bulunamadı' });
    const portfolio = await analyticsService.getStudentPortfolio(student.id);
    res.json(portfolio);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getConsent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const consent = await studentService.getConsent(req.user.userId);
    res.json(consent);
  } catch (error: unknown) {
    const err = error as AppError & { code?: string };
    if (['P1014', 'P2021'].includes(err.code || '') || (err.message && /relation|table|does not exist/i.test(err.message))) {
      res.json({ accepted: false });
      return;
    }
    errorHandler(error as AppError, req, res, next);
  }
};

export const recordConsent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const consent = await studentService.recordConsent(req.user.userId);
    res.status(201).json({ accepted: true, acceptedAt: consent.acceptedAt });
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getMissedSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const list = await attendanceService.getMissedSessionsForStudent(req.user.userId);
    res.json(list);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getAvailableMakeUpSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const slots = await makeUpService.getAvailableSlotsForStudent(req.user.userId);
    res.json(slots);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getMyMakeUpBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const bookings = await makeUpService.getMyBookings(req.user.userId);
    res.json(bookings);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const bookMakeUpSlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slotId } = req.params;
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const booking = await makeUpService.bookSlot(req.user.userId, slotId ?? '');
    res.status(201).json(booking);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};
