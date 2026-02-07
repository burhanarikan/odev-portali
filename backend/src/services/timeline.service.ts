import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';

export class TimelineService {
  /** Sınıfın zaman tüneli (öğrenci kendi sınıfını görür). */
  async getTimelineForStudent(studentUserId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
      include: { class: true },
    });
    if (!student) throw createError('Öğrenci bulunamadı', 404);
    return this.getByClassId(student.classId);
  }

  /** Sınıfa göre post listesi (en yeni üstte). */
  async getByClassId(classId: string) {
    return prisma.timelinePost.findMany({
      where: { classId },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        class: { select: { name: true } },
      },
      orderBy: { postDate: 'desc' },
      take: 100,
    });
  }

  /** Hoca kendi ders verdiği sınıflara post atar. */
  async create(
    teacherUserId: string,
    data: { classId: string; summary: string; imageUrl?: string; linkUrl?: string; postDate?: string }
  ) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw createError('Öğretmen bulunamadı', 404);
    const classExists = await prisma.class.findFirst({
      where: { id: data.classId },
    });
    if (!classExists) throw createError('Sınıf bulunamadı', 404);
    const postDate = data.postDate ? new Date(data.postDate) : new Date();
    return prisma.timelinePost.create({
      data: {
        classId: data.classId,
        teacherId: teacher.id,
        summary: data.summary.trim(),
        imageUrl: data.imageUrl?.trim() || null,
        linkUrl: data.linkUrl?.trim() || null,
        postDate,
      },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        class: { select: { name: true } },
      },
    });
  }

  async delete(postId: string, teacherUserId: string) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw createError('Öğretmen bulunamadı', 404);
    const post = await prisma.timelinePost.findUnique({
      where: { id: postId },
    });
    if (!post) throw createError('Paylaşım bulunamadı', 404);
    if (post.teacherId !== teacher.id) throw createError('Bu paylaşımı silemezsiniz', 403);
    await prisma.timelinePost.delete({ where: { id: postId } });
    return { ok: true };
  }

  /** Hocanın post atabileceği sınıflar (kendi yoklama başlattığı veya ödev verdiği). */
  async getClassesForTeacher(teacherUserId: string) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw createError('Öğretmen bulunamadı', 404);
    const [byAttendance, byAssignment] = await Promise.all([
      prisma.attendanceSession.findMany({ where: { teacherId: teacher.id }, select: { classId: true } }),
      prisma.assignmentTarget.findMany({
        where: { assignment: { createdBy: teacher.id } },
        select: { classId: true },
      }),
    ]);
    const classIds = new Set([
      ...byAttendance.map((r) => r.classId),
      ...byAssignment.map((r) => r.classId).filter(Boolean),
    ] as string[]);
    if (classIds.size === 0) return [];
    return prisma.class.findMany({
      where: { id: { in: Array.from(classIds) } },
      include: { level: { select: { name: true } } },
    });
  }
}
