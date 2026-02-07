import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';

export class ErrorBankService {
  /** Öğrencinin kendi hata listesi (Dikkat Etmem Gerekenler). */
  async getMyErrors(studentUserId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
    });
    if (!student) throw createError('Öğrenci bulunamadı', 404);
    const entries = await prisma.errorBankEntry.findMany({
      where: { studentId: student.id },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const byText = new Map<string, { text: string; count: number; lastAt: string }>();
    for (const e of entries) {
      const t = e.errorText.trim();
      if (!byText.has(t)) byText.set(t, { text: t, count: 0, lastAt: e.createdAt.toISOString() });
      const r = byText.get(t)!;
      r.count++;
      if (e.createdAt > new Date(r.lastAt)) r.lastAt = e.createdAt.toISOString();
    }
    return {
      entries: entries.map((e) => ({
        id: e.id,
        errorText: e.errorText,
        createdAt: e.createdAt,
        teacherName: e.teacher?.user?.name,
      })),
      uniqueErrors: Array.from(byText.values()).sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()),
    };
  }

  /** Kur sonu tekrar listesi: öğrencinin benzersiz hataları. */
  async getReviewList(studentUserId: string) {
    const { uniqueErrors } = await this.getMyErrors(studentUserId);
    return { items: uniqueErrors };
  }

  /** Hoca, değerlendirme sırasında hatayı bankaya ekler. */
  async add(
    teacherUserId: string,
    data: { studentId: string; errorText: string; submissionId?: string }
  ) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw createError('Öğretmen bulunamadı', 404);
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
    });
    if (!student) throw createError('Öğrenci bulunamadı', 404);
    return prisma.errorBankEntry.create({
      data: {
        studentId: data.studentId,
        teacherId: teacher.id,
        errorText: data.errorText.trim(),
        submissionId: data.submissionId || null,
      },
      include: {
        student: { include: { user: { select: { name: true } } } },
      },
    });
  }

  /** Hoca bir öğrencinin hata listesini görür. */
  async getByStudent(studentId: string, teacherUserId: string) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw createError('Öğretmen bulunamadı', 404);
    return prisma.errorBankEntry.findMany({
      where: { studentId },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
