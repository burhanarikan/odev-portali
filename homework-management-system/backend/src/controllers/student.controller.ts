import { Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/student.service';
import { submissionSchema } from '../utils/validators';
import { errorHandler } from '../middleware/errorHandler';

const studentService = new StudentService();

export const getAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user!.userId;
    const assignments = await studentService.getStudentAssignments(studentId);
    res.json(assignments);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const getAssignmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const studentId = req.user!.userId;
    const assignment = await studentService.getAssignmentById(id, studentId);
    res.json(assignment);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const submitAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = submissionSchema.parse(req.body);
    const studentId = req.user!.userId;
    const submission = await studentService.submitAssignment(validatedData, studentId);
    res.status(201).json(submission);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const getSubmission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user!.userId;
    const submission = await studentService.getSubmission(assignmentId, studentId);
    res.json(submission);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const getEvaluations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user!.userId;
    const evaluations = await studentService.getEvaluations(studentId);
    res.json(evaluations);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};
