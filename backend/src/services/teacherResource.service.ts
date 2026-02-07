import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';

export class TeacherResourceService {
  /** Tüm hocalar için ortak havuz (sadece teacher/admin). */
  async list(levelId?: string) {
    const where = levelId ? { levelId } : {};
    return prisma.teacherResource.findMany({
      where,
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        level: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async create(
    teacherUserId: string,
    data: { title: string; description?: string; fileUrl?: string; linkUrl?: string; levelId?: string }
  ) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw createError('Öğretmen bulunamadı', 404);
    return prisma.teacherResource.create({
      data: {
        teacherId: teacher.id,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        fileUrl: data.fileUrl?.trim() || null,
        linkUrl: data.linkUrl?.trim() || null,
        levelId: data.levelId || null,
      },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        level: { select: { name: true } },
      },
    });
  }

  async delete(resourceId: string, teacherUserId: string) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw createError('Öğretmen bulunamadı', 404);
    const resource = await prisma.teacherResource.findUnique({
      where: { id: resourceId },
    });
    if (!resource) throw createError('Materyal bulunamadı', 404);
    if (resource.teacherId !== teacher.id) throw createError('Bu materyali silemezsiniz', 403);
    await prisma.teacherResource.delete({ where: { id: resourceId } });
    return { ok: true };
  }
}
