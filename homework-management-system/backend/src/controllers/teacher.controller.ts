import { Request, Response, NextFunction } from 'express';
import { AssignmentService } from '../services/assignment.service';
import { assignmentSchema } from '../utils/validators';
import { errorHandler } from '../middleware/errorHandler';

const assignmentService = new AssignmentService();

export const createAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = assignmentSchema.parse(req.body);
    const teacherId = req.user!.userId;
    const result = await assignmentService.createAssignment(validatedData, teacherId);
    res.status(201).json(result);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const getAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const teacherId = req.user!.userId;
    const assignments = await assignmentService.getAssignments(teacherId);
    res.json(assignments);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const getAssignmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const assignment = await assignmentService.getAssignmentById(id);
    res.json(assignment);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const updateAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = assignmentSchema.partial().parse(req.body);
    const teacherId = req.user!.userId;
    const assignment = await assignmentService.updateAssignment(id, validatedData, teacherId);
    res.json(assignment);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const deleteAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const teacherId = req.user!.userId;
    await assignmentService.deleteAssignment(id, teacherId);
    res.status(204).send();
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const checkSimilarity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, levelId, weekNumber } = req.body;
    const { SimilarityService } = await import('../services/similarity.service');
    const similarityService = new SimilarityService();
    
    const similarAssignments = await similarityService.findSimilarAssignments(
      title,
      description || '',
      levelId,
      parseInt(weekNumber)
    );
    
    res.json({ similarAssignments });
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const getAssignmentsByWeek = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { weekNumber } = req.params;
    const teacherId = req.user!.userId;
    const assignments = await assignmentService.getAssignmentsByWeek(parseInt(weekNumber), teacherId);
    res.json(assignments);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const createGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId, name } = req.body;
    const teacherId = req.user!.userId;
    const group = await assignmentService.createGroup(assignmentId, name, teacherId);
    res.status(201).json(group);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const addStudentToGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { groupId, studentId } = req.body;
    const result = await assignmentService.addStudentToGroup(groupId, studentId);
    res.json(result);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const removeStudentFromGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { groupId, studentId } = req.body;
    await assignmentService.removeStudentFromGroup(groupId, studentId);
    res.status(204).send();
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const getGroups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId } = req.params;
    const groups = await assignmentService.getGroups(assignmentId);
    res.json(groups);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};

export const getAssignmentsByLevel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { levelId } = req.params;
    const teacherId = req.user!.userId;
    const assignments = await assignmentService.getAssignmentsByLevel(levelId, teacherId);
    res.json(assignments);
  } catch (error: any) {
    errorHandler(error, req, res, next);
  }
};
