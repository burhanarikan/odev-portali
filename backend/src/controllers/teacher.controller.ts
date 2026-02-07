import { Request, Response, NextFunction } from 'express';
import { AssignmentService } from '../services/assignment.service';
import { EvaluationService } from '../services/evaluation.service';
import { HomeworkService } from '../services/homework.service';
import { MakeUpService } from '../services/makeUp.service';
import { assignmentSchema, assignmentUpdateSchema, evaluationSchema, homeworkSchema } from '../utils/validators';
import { errorHandler, AppError } from '../middleware/errorHandler';
import { sendJson } from '../utils/serialize';
import { prisma } from '../config/database';

const assignmentService = new AssignmentService();
const evaluationService = new EvaluationService();
const homeworkService = new HomeworkService();
const makeUpService = new MakeUpService();

export const createAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = assignmentSchema.parse(req.body);
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await assignmentService.createAssignment(validatedData, req.user.userId);
    res.status(201);
    sendJson(res, result);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    // Yönetici tüm ödevleri görür (kim ne vermiş takibi)
    const teacherUserId = req.user.role === 'ADMIN' ? undefined : req.user.userId;
    const assignments = await assignmentService.getAssignments(teacherUserId, req.user.role);
    sendJson(res, assignments);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getAssignmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const assignment = await assignmentService.getAssignmentById(id ?? '', req.user.userId, req.user.role);
    res.json(assignment);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const updateAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = assignmentUpdateSchema.parse(req.body);
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const assignment = await assignmentService.updateAssignment(id ?? '', validatedData, req.user.userId);
    res.json(assignment);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const deleteAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    await assignmentService.deleteAssignment(id ?? '', req.user.userId);
    res.status(204).send();
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const checkSimilarity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, levelId, weekNumber } = req.body as {
      title: string;
      description?: string;
      levelId?: string;
      weekNumber?: string | number;
    };
    const { SimilarityService } = await import('../services/similarity.service');
    const similarityService = new SimilarityService();
    const similarAssignments = await similarityService.findSimilarAssignments(
      title ?? '',
      description ?? '',
      levelId,
      weekNumber ? parseInt(String(weekNumber), 10) : undefined
    );
    const warningMessage =
      similarAssignments.length > 0
        ? 'Benzer ödevler bulundu. Aynı ödevi tekrar vermemek için başlık veya açıklamayı gözden geçirin.'
        : null;
    res.json({ similarAssignments, warningMessage });
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getAssignmentsByWeek = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { weekNumber } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const teacherUserId = req.user.role === 'ADMIN' ? undefined : req.user.userId;
    const assignments = await assignmentService.getAssignmentsByWeek(
      parseInt(weekNumber ?? '0', 10),
      teacherUserId
    );
    res.json(assignments);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const createGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId, name } = req.body as { assignmentId: string; name: string };
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const group = await assignmentService.createGroup(assignmentId, name, req.user.userId);
    res.status(201).json(group);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const addStudentToGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { groupId, studentId } = req.body as { groupId: string; studentId: string };
    const result = await assignmentService.addStudentToGroup(groupId, studentId);
    res.json(result);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const removeStudentFromGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { groupId, studentId } = req.body as { groupId: string; studentId: string };
    await assignmentService.removeStudentFromGroup(groupId, studentId);
    res.status(204).send();
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getGroups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId } = req.params;
    const groups = await assignmentService.getGroups(assignmentId ?? '');
    res.json(groups);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getAssignmentsByLevel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { levelId } = req.params;
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const teacherUserId = req.user.role === 'ADMIN' ? undefined : req.user.userId;
    const assignments = await assignmentService.getAssignmentsByLevel(
      levelId ?? '',
      teacherUserId
    );
    res.json(assignments);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getLevels = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const levels = await prisma.level.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, sortOrder: true },
    });
    res.json(levels);
  } catch (error: unknown) {
    errorHandler(error as AppError, _req, res, next);
  }
};

// --- Homework (taslak) CRUD ---
export const getHomeworks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const teacherUserId = req.user.role === 'ADMIN' ? undefined : req.user.userId;
    const list = await homeworkService.getByTeacher(teacherUserId);
    res.json(list);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const createHomework = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = homeworkSchema.parse(req.body);
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const homework = await homeworkService.create(validated, req.user.userId);
    res.status(201).json(homework);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getHomeworkById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const homework = await homeworkService.getById(req.params.id ?? '', req.user.userId, req.user.role);
    res.json(homework);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const updateHomework = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = homeworkSchema.partial().parse(req.body);
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const homework = await homeworkService.update(req.params.id ?? '', validated, req.user.userId);
    res.json(homework);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const deleteHomework = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    await homeworkService.delete(req.params.id ?? '', req.user.userId);
    res.status(204).send();
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getSubmissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role === 'ADMIN') return sendJson(res, []);
    const submissions = await assignmentService.getSubmissionsForTeacher(req.user.userId);
    sendJson(res, submissions);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getStudents = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        class: {
          include: {
            level: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const list = students.map((s) => ({
      id: s.id,
      userId: s.userId,
      name: s.user.name,
      email: s.user.email,
      class: s.class ? { id: s.class.id, name: s.class.name, level: s.class.level } : null,
      enrollmentDate: s.enrollmentDate,
      createdAt: s.createdAt,
    }));
    res.json(list);
  } catch (error: unknown) {
    errorHandler(error as AppError, _req, res, next);
  }
};

export const getStudentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id: id ?? '' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        class: {
          include: {
            level: { select: { id: true, name: true } },
          },
        },
        submissions: {
          include: {
            assignment: { select: { id: true, title: true, dueDate: true } },
            evaluation: { select: { score: true, feedback: true, accepted: true } },
          },
          orderBy: { submittedAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!student) {
      return res.status(404).json({ error: 'Öğrenci bulunamadı' });
    }
    res.json({
      id: student.id,
      userId: student.userId,
      name: student.user.name,
      email: student.user.email,
      class: student.class ? { id: student.class.id, name: student.class.name, level: student.class.level } : null,
      enrollmentDate: student.enrollmentDate,
      createdAt: student.createdAt,
      submissions: student.submissions,
    });
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const submitEvaluation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { submissionId } = req.params;
    const validated = evaluationSchema.parse(req.body);
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const result = await evaluationService.submitEvaluation(submissionId ?? '', validated, req.user.userId);
    res.json(result);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const createMakeUpSlot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId, slotStart, slotEnd, title, maxStudents } = req.body as {
      classId: string;
      slotStart: string;
      slotEnd: string;
      title?: string;
      maxStudents?: number;
    };
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!classId || !slotStart || !slotEnd) {
      return res.status(400).json({ error: 'classId, slotStart ve slotEnd gerekli' });
    }
    const slot = await makeUpService.createSlot(
      req.user.userId,
      classId,
      new Date(slotStart),
      new Date(slotEnd),
      title,
      maxStudents ?? 10
    );
    res.status(201).json(slot);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};

export const getMyMakeUpSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const slots = await makeUpService.getSlotsForTeacher(req.user.userId);
    res.json(slots);
  } catch (error: unknown) {
    errorHandler(error as AppError, req, res, next);
  }
};
