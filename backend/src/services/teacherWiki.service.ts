import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';

export class TeacherWikiService {
  /** Tüm wiki sayfalarını listele (sadece öğretmen/admin). */
  async list(category?: string) {
    const where = category ? { category: category.trim() || undefined } : {};
    return prisma.teacherWikiPage.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: {
        teacher: { include: { user: { select: { name: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
  }

  async getById(id: string) {
    const page = await prisma.teacherWikiPage.findUnique({
      where: { id },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
      },
    });
    if (!page) throw createError('Sayfa bulunamadı', 404);
    return page;
  }

  async create(
    teacherUserId: string,
    data: { title: string; content: string; category?: string }
  ) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw createError('Öğretmen bulunamadı', 404);
    if (!data.title?.trim()) throw createError('Başlık gerekli', 400);
    if (!data.content?.trim()) throw createError('İçerik gerekli', 400);
    return prisma.teacherWikiPage.create({
      data: {
        teacherId: teacher.id,
        title: data.title.trim(),
        content: data.content.trim(),
        category: data.category?.trim() || null,
      },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
      },
    });
  }

  async update(
    id: string,
    teacherUserId: string,
    isAdmin: boolean,
    data: { title?: string; content?: string; category?: string }
  ) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw createError('Öğretmen bulunamadı', 404);
    const page = await prisma.teacherWikiPage.findUnique({
      where: { id },
    });
    if (!page) throw createError('Sayfa bulunamadı', 404);
    if (!isAdmin && page.teacherId !== teacher.id) {
      throw createError('Bu sayfayı düzenleme yetkiniz yok', 403);
    }
    return prisma.teacherWikiPage.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.content !== undefined && { content: data.content.trim() }),
        ...(data.category !== undefined && { category: data.category?.trim() || null }),
      },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
      },
    });
  }

  async delete(id: string, teacherUserId: string, isAdmin: boolean) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw createError('Öğretmen bulunamadı', 404);
    const page = await prisma.teacherWikiPage.findUnique({
      where: { id },
    });
    if (!page) throw createError('Sayfa bulunamadı', 404);
    if (!isAdmin && page.teacherId !== teacher.id) {
      throw createError('Bu sayfayı silme yetkiniz yok', 403);
    }
    await prisma.teacherWikiPage.delete({ where: { id } });
    return { ok: true };
  }
}
