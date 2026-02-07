import { prisma } from '../config/database';
import { HomeworkInput } from '../utils/validators';
import { createError } from '../middleware/errorHandler';

export class HomeworkService {
  private async resolveTeacherId(userId: string): Promise<string> {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) throw createError('Teacher not found', 404);
    return teacher.id;
  }

  async create(data: HomeworkInput, teacherUserId: string) {
    const teacherId = await this.resolveTeacherId(teacherUserId);
    return prisma.homework.create({
      data: {
        teacherId,
        title: data.title,
        description: data.description ?? null,
        instructions: data.instructions ?? null,
        type: data.type ?? 'TEXT',
        fileUrl: data.fileUrl || null,
        audioUrl: data.audioUrl || null,
        levelId: data.levelId,
        weekNumber: data.weekNumber,
      },
      include: {
        level: true,
        teacher: { include: { user: true } },
      },
    });
  }

  async getByTeacher(teacherUserId?: string) {
    const teacherId = teacherUserId ? await this.resolveTeacherId(teacherUserId) : undefined;
    const where = teacherId ? { teacherId } : {};
    return prisma.homework.findMany({
      where,
      include: {
        level: true,
        teacher: { include: { user: true } },
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string, teacherUserId?: string, callerRole?: string) {
    const homework = await prisma.homework.findUnique({
      where: { id },
      include: {
        level: true,
        teacher: { include: { user: true } },
        assignments: {
          include: {
            level: true,
            _count: { select: { submissions: true } },
          },
        },
      },
    });
    if (!homework) throw createError('Homework not found', 404);
    if (callerRole === 'ADMIN') return homework;
    if (teacherUserId) {
      const teacherId = await this.resolveTeacherId(teacherUserId);
      if (homework.teacherId === teacherId) return homework;
    }
    throw createError('Not authorized to view this homework', 403);
  }

  async update(id: string, data: Partial<HomeworkInput>, teacherUserId: string) {
    const teacherId = await this.resolveTeacherId(teacherUserId);
    const homework = await prisma.homework.findUnique({ where: { id } });
    if (!homework) throw createError('Homework not found', 404);
    if (homework.teacherId !== teacherId) throw createError('Not authorized to update this homework', 403);
    return prisma.homework.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        type: data.type,
        fileUrl: data.fileUrl,
        audioUrl: data.audioUrl,
        levelId: data.levelId,
        weekNumber: data.weekNumber,
      },
      include: {
        level: true,
        teacher: { include: { user: true } },
      },
    });
  }

  async delete(id: string, teacherUserId: string) {
    const teacherId = await this.resolveTeacherId(teacherUserId);
    const homework = await prisma.homework.findUnique({ where: { id } });
    if (!homework) throw createError('Homework not found', 404);
    if (homework.teacherId !== teacherId) throw createError('Not authorized to delete this homework', 403);
    return prisma.homework.delete({ where: { id } });
  }
}
