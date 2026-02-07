import { prisma } from '../config/database';
import { createError } from '../middleware/errorHandler';

export class MakeUpService {
  /** Hoca: telafi slotu oluşturur */
  async createSlot(
    teacherUserId: string,
    classId: string,
    slotStart: Date,
    slotEnd: Date,
    title?: string,
    maxStudents: number = 10
  ) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw createError('Öğretmen bulunamadı', 404);

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: { level: true },
    });
    if (!cls) throw createError('Sınıf bulunamadı', 404);

    if (slotEnd <= slotStart) throw createError('Bitiş saati başlangıçtan sonra olmalı', 400);
    if (maxStudents < 1 || maxStudents > 50) throw createError('maxStudents 1–50 arası olmalı', 400);

    return prisma.makeUpSlot.create({
      data: {
        classId,
        teacherId: teacher.id,
        slotStart,
        slotEnd,
        title: title ?? null,
        maxStudents,
      },
      include: {
        class: { include: { level: true } },
        teacher: { include: { user: true } },
        _count: { select: { bookings: true } },
      },
    });
  }

  /** Hoca: kendi açtığı telafi slotlarını listeler */
  async getSlotsForTeacher(teacherUserId: string) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw createError('Öğretmen bulunamadı', 404);

    return prisma.makeUpSlot.findMany({
      where: { teacherId: teacher.id },
      include: {
        class: { include: { level: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { slotStart: 'desc' },
      take: 50,
    });
  }

  /** Öğrenci: sınıfına ait, gelecekte olan, kapasitesi dolmamış ve kendisinin rezervasyon yapmadığı slotları listeler */
  async getAvailableSlotsForStudent(studentUserId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
      include: { class: true },
    });
    if (!student) throw createError('Öğrenci bulunamadı', 404);

    const now = new Date();
    const slots = await prisma.makeUpSlot.findMany({
      where: {
        classId: student.classId,
        slotStart: { gt: now },
      },
      include: {
        class: { include: { level: true } },
        teacher: { include: { user: true } },
        _count: { select: { bookings: true } },
        bookings: { where: { studentId: student.id }, select: { id: true } },
      },
      orderBy: { slotStart: 'asc' },
      take: 20,
    });

    return slots
      .filter((s) => s._count.bookings < s.maxStudents && s.bookings.length === 0)
      .map((s) => ({
        id: s.id,
        slotStart: s.slotStart,
        slotEnd: s.slotEnd,
        title: s.title,
        teacherName: s.teacher?.user?.name ?? '—',
        className: s.class.name,
        levelName: s.class.level?.name ?? '—',
        bookedCount: s._count.bookings,
        maxStudents: s.maxStudents,
      }));
  }

  /** Öğrenci: aldığı telafi randevularını listeler */
  async getMyBookings(studentUserId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
    });
    if (!student) throw createError('Öğrenci bulunamadı', 404);

    return prisma.makeUpBooking.findMany({
      where: { studentId: student.id },
      include: {
        slot: {
          include: {
            class: { include: { level: true } },
            teacher: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  /** Öğrenci: telafi slotuna randevu alır */
  async bookSlot(studentUserId: string, slotId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentUserId },
      include: { class: true },
    });
    if (!student) throw createError('Öğrenci bulunamadı', 404);

    const slot = await prisma.makeUpSlot.findUnique({
      where: { id: slotId },
      include: { _count: { select: { bookings: true } } },
    });
    if (!slot) throw createError('Telafi slotu bulunamadı', 404);
    if (slot.classId !== student.classId) throw createError('Bu slot sizin sınıfınıza ait değil', 403);
    if (new Date() > slot.slotStart) throw createError('Bu slotun tarihi geçmiş', 400);
    if (slot._count.bookings >= slot.maxStudents) throw createError('Bu slot için kontenjan doldu', 400);

    const existing = await prisma.makeUpBooking.findUnique({
      where: {
        slotId_studentId: { slotId, studentId: student.id },
      },
    });
    if (existing) throw createError('Bu slot için zaten randevunuz var', 409);

    return prisma.makeUpBooking.create({
      data: {
        slotId,
        studentId: student.id,
      },
      include: {
        slot: {
          include: {
            class: { include: { level: true } },
            teacher: { include: { user: true } },
          },
        },
      },
    });
  }
}
