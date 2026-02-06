import { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/student.service';
import { submissionSchema } from '../utils/validators';
import { errorHandler, AppError } from '../middleware/errorHandler';

const studentService = new StudentService();

export const getAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const assignments = await studentService.getStudentAssignments(req.user.userId);
    res.json(assignments);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getAssignmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const assignment = await studentService.getAssignmentById(id ?? '', req.user.userId);
    res.json(assignment);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const submitAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = submissionSchema.parse(req.body);
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const submission = await studentService.submitAssignment(validatedData, req.user.userId);
    res.status(201).json(submission);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getSubmission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const submission = await studentService.getSubmission(assignmentId ?? '', req.user.userId);
    res.json(submission);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getEvaluations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const evaluations = await studentService.getEvaluations(req.user.userId);
    res.json(evaluations);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};
